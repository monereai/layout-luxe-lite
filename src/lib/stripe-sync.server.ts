import type Stripe from "stripe";
import type { StripeEnv } from "./stripe.server";
import { membershipPrice } from "./store-config";

/** Saves a Stripe subscription for its owner and credits each elapsed month's Points + Tokens once. */
export async function syncStripeSubscription(stripe: Stripe, subscriptionId: string, env: StripeEnv, expectedUser?: string) {
  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = sub.metadata?.['userId'];
  if (!userId || (expectedUser && userId !== expectedUser)) return { ok: false, tier: null as string | null };
  const item = sub.items.data[0] as any;
  const lookup = item?.price?.lookup_key || item?.price?.metadata?.lovable_external_id || "";
  const plan = membershipPrice(lookup);
  if (!plan) return { ok: false, tier: null };
  const start = item?.current_period_start ?? (sub as any).current_period_start;
  const end = item?.current_period_end ?? (sub as any).current_period_end;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: existing } = await supabaseAdmin.from("subscriptions").select("user_id").eq("stripe_subscription_id", sub.id).maybeSingle();
  if (existing && existing.user_id !== userId) return { ok: false, tier: null };
  const row = {
    user_id: userId, environment: env, product_id: plan.tier, price_id: lookup, status: sub.status,
    stripe_customer_id: typeof sub.customer === "string" ? sub.customer : sub.customer.id, stripe_subscription_id: sub.id,
    current_period_start: start ? new Date(start * 1000).toISOString() : null,
    current_period_end: end ? new Date(end * 1000).toISOString() : null,
    cancel_at_period_end: sub.cancel_at_period_end ?? false, updated_at: new Date().toISOString(),
  };
  const saved = await supabaseAdmin.from("subscriptions").upsert(row, { onConflict: "stripe_subscription_id" });
  if (saved.error) throw new Error("Could not save your membership. Please retry.");
  if ((sub.status === "active" || sub.status === "trialing") && start) {
    // Yearly plans still award monthly: one credit per elapsed month of the current period.
    const months = plan.interval === "yearly" ? Math.min(12, Math.floor((Date.now() / 1000 - start) / (30 * 86400)) + 1) : 1;
    for (let m = 0; m < months; m++) {
      const grant = await supabaseAdmin.rpc("credit_stripe_membership" as any, { p_user: userId, p_subscription: sub.id, p_period_key: `${start}:${m}`, p_tier: plan.tier });
      if (grant.error) throw new Error("Your membership is active, but its wallet grant needs a retry.");
    }
  }
  return { ok: sub.status === "active" || sub.status === "trialing", tier: plan.tier as string | null };
}
