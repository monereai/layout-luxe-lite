import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Crown, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { PayPalButton } from "./PayPalButton";
import { usePlan } from "@/hooks/usePlan";
import { MEMBERSHIPS, POINT_PACKS, type Interval } from "@/lib/paypal-config";
import { activateSubscription, capturePackOrder, createPackOrder } from "@/lib/paypal.functions";
import { playFanfare } from "@/lib/sound";
import { Button } from "@/components/ui/button";

export function MonereStore() {
  const { user, tier, ready, refresh } = usePlan();
  const [interval, setInterval] = useState<Interval>("monthly");

  const signInCheckout = <Button asChild className="h-auto min-h-10 w-full whitespace-normal text-center"><Link to="/auth">Sign in to pay with PayPal</Link></Button>;
  const loadingCheckout = <p role="status" className="min-h-10 py-2 text-center text-sm text-muted-foreground">Loading checkout…</p>;

  async function captured(orderId: string) {
    const r = await capturePackOrder({ data: { orderId } });
    if (!r.ok) { toast.error("We couldn't confirm that payment. You haven't been charged twice — contact us if points are missing."); return; }
    await refresh();
    try { playFanfare(); } catch { /* sound optional */ }
    toast.success(`🎉 +${r.points} Wisdom Points added to your wallet!`, { duration: 6000 });
  }

  async function subscribed(subscriptionId: string) {
    const r = await activateSubscription({ data: { subscriptionId } });
    await refresh();
    if (r.ok) toast.success(`👑 Welcome to ${r.tier === "club" ? "MonereAI Club" : "Monere Plus"}! Your monthly points are in your wallet.`, { duration: 6000 });
    else toast.error("PayPal hasn't confirmed your membership yet. It'll switch on as soon as it does.");
  }

  return (
    <section data-no-one-link="true" className="one-link-ignore mb-5 space-y-5">
      <div>
        <h2 className="mb-3 font-display text-xl font-semibold">Point Packs</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {POINT_PACKS.map((p) => (
            <div key={p.id} data-no-one-link="true" className={`one-link-ignore relative flex flex-col rounded-lg border bg-card p-4 ${p.badge ? "border-primary ring-1 ring-primary" : "border-border"}`}>
              {p.badge && <span className="absolute -top-2.5 right-3 rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground">{p.badge}</span>}
              <p className="font-semibold">{p.name}</p>
              <p className="font-display text-2xl font-semibold text-primary">{p.points.toLocaleString()} <span className="text-sm">pts</span></p>
              <p className="mb-3 text-sm text-muted-foreground">£{p.price} one-time</p>
              <div className="mt-auto">
                {!ready ? loadingCheckout : !user ? signInCheckout : <PayPalButton mode="capture" createOrder={async () => (await createPackOrder({ data: { pack: p.id } })).id} onApprove={captured} onError={() => toast.error("PayPal checkout didn't complete.")} />}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-display text-xl font-semibold">Memberships</h2>
          <div className="flex rounded-full border border-border p-0.5 text-xs font-semibold" role="group" aria-label="Billing period">
            {(["monthly", "yearly"] as Interval[]).map((i) => (
              <Button key={i} type="button" size="sm" variant={interval === i ? "default" : "ghost"} onClick={() => setInterval(i)} aria-pressed={interval === i} className="h-auto rounded-full px-3 py-1 capitalize">{i}</Button>
            ))}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {MEMBERSHIPS.map((m) => {
            const planId = m.plans[interval];
            const current = tier === m.tier;
            return (
              <div key={m.tier} data-no-one-link="true" className={`one-link-ignore relative flex flex-col rounded-lg border bg-card p-4 ${m.badge ? "border-primary ring-2 ring-primary" : "border-border"}`}>
                {m.badge && <span className="absolute -top-2.5 right-3 rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground">{m.badge}</span>}
                <p className="flex items-center gap-1.5 font-semibold">{m.tier === "club" ? <Crown className="h-4 w-4 text-primary" /> : <Sparkles className="h-4 w-4 text-primary" />}{m.name}</p>
                <p className="font-display text-2xl font-semibold">£{interval === "monthly" ? m.monthly : m.yearly}<span className="text-sm text-muted-foreground">/{interval === "monthly" ? "mo" : "yr"}</span></p>
                <ul className="my-3 space-y-1 text-sm text-muted-foreground">{m.perks.map((x) => <li key={x} className="flex gap-1.5"><Check className="h-4 w-4 shrink-0 text-primary" />{x}</li>)}</ul>
                <div className="mt-auto">
                  {!ready ? loadingCheckout : !user ? signInCheckout : current ? <p className="rounded-md bg-primary/10 py-2 text-center text-sm font-semibold text-primary">Your current membership</p>
                    : planId ? <PayPalButton mode="subscription" planId={planId} onApprove={subscribed} onError={() => toast.error("PayPal checkout didn't complete.")} />
                    : <p className="rounded-md border border-dashed border-border py-2 text-center text-xs text-muted-foreground">Coming soon</p>}
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">Under 18? Ask a parent or guardian to check out with PayPal. Cancel anytime in PayPal.</p>
      </div>
    </section>
  );
}
