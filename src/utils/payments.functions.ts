import { createServerFn } from "@tanstack/react-start";
import type Stripe from "stripe";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { type StripeEnv, createStripeClient, getStripeErrorMessage } from "@/lib/stripe.server";

type CheckoutSessionResult = { clientSecret: string } | { error: string };

const ALLOWED_PRICES = ["plus_monthly", "plus_yearly"];
export const TRIAL_DAYS = 7;

async function resolveOrCreateCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  options: { email?: string | undefined; userId?: string | undefined },
): Promise<string> {
  if (options.userId && !/^[a-zA-Z0-9_-]+$/.test(options.userId)) {
    throw new Error("Invalid userId");
  }
  if (options.userId) {
    const found = await stripe.customers.search({
      query: `metadata['userId']:'${options.userId}'`,
      limit: 1,
    });
    if (found.data[0]) return found.data[0].id;
  }
  if (options.email) {
    const existing = await stripe.customers.list({ email: options.email, limit: 1 });
    const customer = existing.data[0];
    if (customer) {
      if (options.userId && customer.metadata?.["userId"] !== options.userId) {
        await stripe.customers.update(customer.id, {
          metadata: { ...customer.metadata, userId: options.userId },
        });
      }
      return customer.id;
    }
  }
  const created = await stripe.customers.create({
    ...(options.email && { email: options.email }),
    ...(options.userId && { metadata: { userId: options.userId } }),
  });
  return created.id;
}

export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { priceId: string; returnUrl: string; environment: StripeEnv }) => {
    if (!ALLOWED_PRICES.includes(data.priceId)) throw new Error("Invalid priceId");
    if (data.environment !== "sandbox" && data.environment !== "live") throw new Error("Invalid environment");
    if (typeof data.returnUrl !== "string" || data.returnUrl.length > 500) throw new Error("Invalid returnUrl");
    return data;
  })
  .handler(async ({ data, context }): Promise<CheckoutSessionResult> => {
    try {
      const userId = context.userId;
      const email = typeof context.claims?.email === "string" ? context.claims.email : undefined;
      const stripe = createStripeClient(data.environment);

      const prices = await stripe.prices.list({ lookup_keys: [data.priceId] });
      const stripePrice = prices.data[0];
      if (!stripePrice) throw new Error("Price not found");

      const customerId = await resolveOrCreateCustomer(stripe, { email, userId });

      const session = await stripe.checkout.sessions.create({
        line_items: [{ price: stripePrice.id, quantity: 1 }],
        mode: "subscription",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        customer: customerId,
        metadata: { userId, managed_payments: "true" },
        subscription_data: { metadata: { userId }, trial_period_days: TRIAL_DAYS },
        managed_payments: { enabled: true },
      } as Stripe.Checkout.SessionCreateParams);

      return { clientSecret: session.client_secret ?? "" };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

async function portalConfigId(stripe: ReturnType<typeof createStripeClient>): Promise<string> {
  const list = await stripe.billingPortal.configurations.list({ limit: 20, active: true });
  const existing = list.data.find((c) => c.metadata?.["app"] === "monere_plus");
  if (existing) return existing.id;
  const prices = await stripe.prices.list({ lookup_keys: ALLOWED_PRICES });
  const product = prices.data[0]?.product;
  const productId = typeof product === "string" ? product : product?.id;
  const created = await stripe.billingPortal.configurations.create({
    metadata: { app: "monere_plus" },
    business_profile: { headline: "Manage your Monere Plus subscription" },
    features: {
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true },
      // Cancels keep access until the end of the paid period.
      subscription_cancel: { enabled: true, mode: "at_period_end" },
      // Monthly <-> annual switches take effect at renewal, no proration.
      subscription_update: {
        enabled: true,
        default_allowed_updates: ["price"],
        proration_behavior: "none",
        products: productId ? [{ product: productId, prices: prices.data.map((p) => p.id) }] : [],
        schedule_at_period_end: { conditions: [{ type: "decreasing_item_amount" }, { type: "shortening_interval" }] },
      },
    },
  } as Stripe.BillingPortal.ConfigurationCreateParams);
  return created.id;
}

export const createPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { returnUrl: string; environment: StripeEnv }) => {
    if (data.environment !== "sandbox" && data.environment !== "live") throw new Error("Invalid environment");
    return data;
  })
  .handler(async ({ data, context }): Promise<{ url: string } | { error: string }> => {
    const { data: sub } = await context.supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", context.userId)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!sub?.stripe_customer_id) return { error: "No subscription found" };
    try {
      const stripe = createStripeClient(data.environment);
      const portal = await stripe.billingPortal.sessions.create({
        customer: sub.stripe_customer_id,
        configuration: await portalConfigId(stripe),
        return_url: data.returnUrl,
      });
      return { url: portal.url };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });
