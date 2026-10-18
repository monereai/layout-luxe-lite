import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createStripeClient, getStripeErrorMessage, type StripeEnv } from "@/lib/stripe.server";
import { STORE_PRICE_IDS, packPrice } from "./store-config";
import { syncStripeSubscription } from "./stripe-sync.server";
import { paymentReturnUrl } from "./payment-return";

const envSchema = z.enum(["sandbox", "live"]);

async function resolveOrCreateCustomer(stripe: ReturnType<typeof createStripeClient>, options: { email?: string | undefined; userId?: string | undefined }): Promise<string> {
  if (options.userId && !/^[a-zA-Z0-9_-]+$/.test(options.userId)) throw new Error("Invalid userId");
  if (options.userId) {
    const found = await stripe.customers.search({ query: `metadata['userId']:'${options.userId}'`, limit: 1 });
    const f = found.data[0]; if (f) return f.id;
  }
  const created = await stripe.customers.create({
    ...(options.email && { email: options.email }),
    ...(options.userId && { metadata: { userId: options.userId } }),
  });
  return created.id;
}

export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ priceId: z.enum(STORE_PRICE_IDS as [string, ...string[]]), returnUrl: z.string().url().max(500), environment: envSchema }).parse(d))
  .handler(async ({ data, context }): Promise<{ clientSecret: string } | { error: string }> => {
    try {
      const origin = new URL(data.returnUrl).origin;
      const allowed = data.environment === "live" ? ["https://monereai.com"] : ["https://monereai.com", "https://www.monereai.com", "https://layout-luxe-lite.lovable.app", "http://localhost:8080"];
      const sameOrigin = (() => { try { const h = getRequest()?.headers; const o = h?.get("origin"); return o ? new URL(o).origin : null; } catch { return null; } })();
      if ((!allowed.includes(origin) && origin !== sameOrigin) || data.returnUrl !== paymentReturnUrl(origin, data.environment)) {
        throw new Error("Payments must return to this website with payment verification enabled.");
      }
      const stripe = createStripeClient(data.environment as StripeEnv);
      const prices = await stripe.prices.list({ lookup_keys: [data.priceId] });
      const price = prices.data[0];
      if (!price) throw new Error("Price not found");
      const recurring = price.type === "recurring";
      const email = (context.claims as any)?.email as string | undefined;
      const customer = await resolveOrCreateCustomer(stripe, { email, userId: context.userId });
      let description: string | undefined;
      if (!recurring) {
        const productId = typeof price.product === "string" ? price.product : price.product.id;
        description = (await stripe.products.retrieve(productId)).name;
      }
      const session = await stripe.checkout.sessions.create({
        line_items: [{ price: price.id, quantity: 1 }],
        mode: recurring ? "subscription" : "payment",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        customer,
        managed_payments: { enabled: true },
        metadata: { userId: context.userId, priceId: data.priceId },
        ...(recurring ? { subscription_data: { metadata: { userId: context.userId } } } : { payment_intent_data: { description } }),
      } as any);
      return { clientSecret: session.client_secret ?? "" };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

/** Verifies a finished checkout with Stripe, then saves the tier or credits the pack once. */
export const confirmCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ sessionId: z.string().regex(/^cs_[A-Za-z0-9_]+$/).max(200), environment: envSchema }).parse(d))
  .handler(async ({ data, context }): Promise<{ ok: boolean; kind?: "pack" | "membership"; points?: number; tier?: string | null; error?: string }> => {
    try {
      const env = data.environment as StripeEnv;
      const stripe = createStripeClient(env);
      const session = await stripe.checkout.sessions.retrieve(data.sessionId);
      if (session.metadata?.['userId'] !== context.userId || session.status !== "complete" || (session.mode === "payment" ? session.payment_status !== "paid" : session.payment_status === "unpaid")) return { ok: false };
      if (session.mode === "subscription") {
        const subId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
        if (!subId) return { ok: false };
        const r = await syncStripeSubscription(stripe, subId, env, context.userId);
        return { ok: r.ok, kind: "membership", tier: r.tier };
      }
      const pack = packPrice(session.metadata?.['priceId'] ?? "");
      if (!pack || session.amount_subtotal !== Math.round(Number(pack.price) * 100) || session.currency !== "gbp") return { ok: false };
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const credit = await supabaseAdmin.from("point_credits").upsert({ user_id: context.userId, source: "pack", reference: `stripe:${session.id}`, points: pack.points }, { onConflict: "reference", ignoreDuplicates: true });
      if (credit.error) return { ok: false, error: "Payment verified, but your points could not be saved. Please retry." };
      return { ok: true, kind: "pack", points: pack.points };
    } catch (error) {
      return { ok: false, error: getStripeErrorMessage(error) };
    }
  });

/** Re-checks saved Stripe memberships (renewals, cancellations, monthly grants). */
export const syncMembership = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ environment: envSchema }).parse(d))
  .handler(async ({ data, context }) => {
    try {
      const { data: subs } = await context.supabase.from("subscriptions").select("stripe_subscription_id").eq("environment", data.environment).neq("stripe_customer_id", "paypal");
      if (!subs?.length) return { ok: true };
      const stripe = createStripeClient(data.environment as StripeEnv);
      for (const s of subs) await syncStripeSubscription(stripe, s.stripe_subscription_id, data.environment as StripeEnv, context.userId).catch(() => null);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: getStripeErrorMessage(error) };
    }
  });
