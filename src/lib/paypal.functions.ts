import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PAYPAL_API, PAYPAL_CLIENT_ID, POINT_PACKS, planInfo } from "./paypal-config";

async function paypal(path: string, init: RequestInit = {}) {
  const secret = process.env["PAYPAL_CLIENT_SECRET"];
  if (!secret) throw new Error("PayPal is not configured");
  const tok = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${btoa(`${PAYPAL_CLIENT_ID}:${secret}`)}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  if (!tok.ok) throw new Error("PayPal auth failed");
  const { access_token } = (await tok.json()) as { access_token: string };
  const res = await fetch(`${PAYPAL_API}${path}`, { ...init, headers: { Authorization: `Bearer ${access_token}`, "Content-Type": "application/json", ...(init.headers ?? {}) } });
  const body = (await res.json().catch(() => ({}))) as any;
  return { ok: res.ok, body };
}

/** Server sets the amount, so the browser can't change the price. */
export const createPackOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ pack: z.enum(["pocket", "popular", "mega"]) }).parse(d))
  .handler(async ({ data, context }) => {
    const pack = POINT_PACKS.find((p) => p.id === data.pack)!;
    const { ok, body } = await paypal("/v2/checkout/orders", {
      method: "POST",
      body: JSON.stringify({ intent: "CAPTURE", purchase_units: [{ custom_id: `${context.userId}:${pack.id}`, description: `${pack.name} — ${pack.points} points`, amount: { currency_code: "GBP", value: pack.price } }] }),
    });
    if (!ok) throw new Error("Could not start PayPal order");
    return { id: body.id as string };
  });

export const capturePackOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ orderId: z.string().min(5).max(64) }).parse(d))
  .handler(async ({ data, context }): Promise<{ ok: boolean; points: number }> => {
    let { ok, body } = await paypal(`/v2/checkout/orders/${encodeURIComponent(data.orderId)}/capture`, { method: "POST" });
    if (!ok) ({ ok, body } = await paypal(`/v2/checkout/orders/${encodeURIComponent(data.orderId)}`)); // already captured
    const unit = body?.purchase_units?.[0];
    const capture = unit?.payments?.captures?.[0];
    const [uid, packId] = String(unit?.custom_id ?? "").split(":");
    const pack = POINT_PACKS.find((p) => p.id === packId);
    if (body?.status !== "COMPLETED" || capture?.status !== "COMPLETED" || uid !== context.userId || !pack) return { ok: false, points: 0 };
    if (capture.amount?.currency_code !== "GBP" || capture.amount?.value !== pack.price) return { ok: false, points: 0 };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("point_credits").upsert({ user_id: context.userId, source: "pack", reference: `order:${data.orderId}`, points: pack.points }, { onConflict: "reference", ignoreDuplicates: true });
    return { ok: true, points: pack.points };
  });

/** Confirms the subscription with PayPal, saves membership, and credits this billing cycle's points once. */
export const activateSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ subscriptionId: z.string().min(5).max(64) }).parse(d))
  .handler(async ({ data, context }) => syncOne(data.subscriptionId, context.userId));

/** Re-checks the user's saved PayPal memberships (renewals, cancellations, monthly points). */
export const syncMembership = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: subs } = await context.supabase.from("subscriptions").select("stripe_subscription_id").eq("stripe_customer_id", "paypal");
    for (const s of subs ?? []) await syncOne(s.stripe_subscription_id, context.userId).catch(() => null);
    return { ok: true };
  });

async function syncOne(subscriptionId: string, userId: string): Promise<{ ok: boolean; tier: string | null }> {
  const { ok, body } = await paypal(`/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}`);
  const plan = ok ? planInfo(body.plan_id) : null;
  if (!plan) return { ok: false, tier: null };
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: existing } = await supabaseAdmin.from("subscriptions").select("user_id").eq("stripe_subscription_id", subscriptionId).maybeSingle();
  if (existing && existing.user_id !== userId) return { ok: false, tier: null };
  const status = body.status === "ACTIVE" ? "active" : body.status === "CANCELLED" ? "canceled" : String(body.status).toLowerCase();
  const end = body.billing_info?.next_billing_time ?? null;
  const row = { user_id: userId, environment: "live", product_id: plan.tier, price_id: `${plan.tier}_${plan.interval}`, status, stripe_customer_id: "paypal", stripe_subscription_id: subscriptionId, current_period_end: end, current_period_start: body.billing_info?.last_payment?.time ?? body.start_time ?? null, updated_at: new Date().toISOString() };
  if (existing) await supabaseAdmin.from("subscriptions").update(row).eq("stripe_subscription_id", subscriptionId);
  else await supabaseAdmin.from("subscriptions").insert(row);
  const paidAt = body.billing_info?.last_payment?.time;
  if (body.status === "ACTIVE" && paidAt) {
    // Yearly plans still award points monthly: one credit per elapsed month since the last payment.
    const months = plan.interval === "yearly" ? Math.min(12, Math.floor((Date.now() - Date.parse(paidAt)) / (30 * 864e5)) + 1) : 1;
    for (let m = 0; m < months; m++) {
      await supabaseAdmin.from("point_credits").upsert({ user_id: userId, source: "subscription", reference: `sub:${subscriptionId}:${paidAt}:${m}`, points: plan.points }, { onConflict: "reference", ignoreDuplicates: true });
      await supabaseAdmin.from("token_credits").upsert({ user_id: userId, source: "subscription", reference: `subtok:${subscriptionId}:${paidAt}:${m}`, tokens: plan.tokens }, { onConflict: "reference", ignoreDuplicates: true });
    }
  }
  return { ok: body.status === "ACTIVE", tier: plan.tier };
}
