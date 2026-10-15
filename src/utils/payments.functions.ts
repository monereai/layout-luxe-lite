import { createServerFn } from "@tanstack/react-start";
import Stripe from "stripe";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Env = "sandbox" | "live";

// Prices live in the owner's own Stripe account.
export const PLANS = {
  individual: { priceId: "price_1UQhOuQ94lPfyPtigN4pvW4V", trial: true },
  group: { priceId: "price_1UQhPFQ94lPfyPtiON7xBjuU", trial: true },
} as const;
export type PlanKey = keyof typeof PLANS;
export const GROUP_SEATS = 30;
const TRIAL_DAYS = 7;

function stripe() {
  const key = process.env["STRIPE_SECRET_KEY"];
  if (!key) throw new Error("Stripe is not configured");
  return new Stripe(key, { httpClient: Stripe.createFetchHttpClient() });
}
const msg = (e: unknown) => (e instanceof Error ? e.message : "Stripe request failed");

async function findCustomer(s: Stripe, email: string, userId: string, create: boolean) {
  const found = await s.customers.list({ email, limit: 1 });
  if (found.data[0]) return found.data[0].id;
  if (!create) return null;
  return (await s.customers.create({ email, metadata: { userId } })).id;
}

export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { plan: PlanKey; origin: string }) => {
    if (!(d.plan in PLANS)) throw new Error("Invalid plan");
    if (!/^https?:\/\/[^\s]{1,200}$/.test(d.origin)) throw new Error("Invalid origin");
    return d;
  })
  .handler(async ({ data, context }): Promise<{ url: string } | { error: string }> => {
    try {
      const email = typeof context.claims?.email === "string" ? context.claims.email : "";
      if (!email) return { error: "Please sign in with email first." };
      const s = stripe();
      const plan = PLANS[data.plan];
      const customer = (await findCustomer(s, email, context.userId, true))!;
      const session = await s.checkout.sessions.create({
        mode: "subscription",
        customer,
        line_items: [{ price: plan.priceId, quantity: 1 }],
        subscription_data: { metadata: { userId: context.userId, plan: data.plan }, ...(plan.trial && { trial_period_days: TRIAL_DAYS }) },
        metadata: { userId: context.userId },
        success_url: `${data.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${data.origin}/`,
      });
      return { url: session.url ?? "" };
    } catch (e) {
      return { error: msg(e) };
    }
  });

function newCode() {
  const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const b = crypto.getRandomValues(new Uint8Array(6));
  return "GROUP-" + Array.from(b, (x) => a[x % a.length]).join("");
}

// Reads the user's latest subscription from Stripe and mirrors it into the database,
// so is_premium stays the single source of truth.
export const syncSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { environment: Env }) => {
    if (d.environment !== "sandbox" && d.environment !== "live") throw new Error("Invalid environment");
    return d;
  })
  .handler(async ({ data, context }): Promise<{ plan: PlanKey | null; status: string | null; groupCode: string | null; error?: string }> => {
    try {
      const email = typeof context.claims?.email === "string" ? context.claims.email : "";
      const s = stripe();
      const customer = email ? await findCustomer(s, email, context.userId, false) : null;
      if (!customer) return { plan: null, status: null, groupCode: null };
      const subs = await s.subscriptions.list({ customer, status: "all", limit: 5 });
      const sub = subs.data.find((x) => ["active", "trialing", "past_due"].includes(x.status)) ?? subs.data[0];
      if (!sub) return { plan: null, status: null, groupCode: null };
      const item = sub.items.data[0];
      const priceId = item?.price.id ?? "";
      const plan = (Object.keys(PLANS) as PlanKey[]).find((k) => PLANS[k].priceId === priceId) ?? null;
      const periodEnd = item?.current_period_end ? new Date(item.current_period_end * 1000).toISOString() : null;
      const periodStart = item?.current_period_start ? new Date(item.current_period_start * 1000).toISOString() : null;
      const status = sub.cancel_at_period_end && sub.status === "active" ? "canceled" : sub.status;
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("subscriptions").upsert({
        user_id: context.userId, stripe_subscription_id: sub.id, stripe_customer_id: customer,
        product_id: typeof item?.price.product === "string" ? item.price.product : "", price_id: priceId,
        status, current_period_start: periodStart, current_period_end: periodEnd,
        cancel_at_period_end: sub.cancel_at_period_end, environment: data.environment, updated_at: new Date().toISOString(),
      }, { onConflict: "stripe_subscription_id" });

      let groupCode: string | null = null;
      if (plan === "group") {
        const active = ["active", "trialing", "past_due"].includes(sub.status) || (periodEnd !== null && new Date(periodEnd) > new Date());
        const { data: existing } = await supabaseAdmin.from("organization_codes").select("code").eq("stripe_subscription_id", sub.id).maybeSingle();
        if (existing) {
          groupCode = existing.code;
          await supabaseAdmin.from("organization_codes").update({ is_active: active, expiration_date: periodEnd ?? new Date(Date.now() + 366 * 864e5).toISOString() }).eq("stripe_subscription_id", sub.id);
        } else {
          groupCode = newCode();
          await supabaseAdmin.from("organization_codes").insert({
            code: groupCode, organization_name: "your youth group", max_uses: GROUP_SEATS, is_active: active,
            expiration_date: periodEnd ?? new Date(Date.now() + 366 * 864e5).toISOString(), owner_user_id: context.userId, stripe_subscription_id: sub.id,
          });
        }
      }
      return { plan, status: sub.status, groupCode };
    } catch (e) {
      return { plan: null, status: null, groupCode: null, error: msg(e) };
    }
  });

export const createPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { returnUrl: string; environment: Env }) => d)
  .handler(async ({ data, context }): Promise<{ url: string } | { error: string }> => {
    try {
      const email = typeof context.claims?.email === "string" ? context.claims.email : "";
      const s = stripe();
      const customer = email ? await findCustomer(s, email, context.userId, false) : null;
      if (!customer) return { error: "No subscription found" };
      const portal = await s.billingPortal.sessions.create({ customer, return_url: data.returnUrl });
      return { url: portal.url };
    } catch (e) {
      return { error: msg(e) };
    }
  });
