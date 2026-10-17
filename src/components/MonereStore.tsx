import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
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
  const activate = useServerFn(activateSubscription);
  const capture = useServerFn(capturePackOrder);
  const createOrder = useServerFn(createPackOrder);
  const queryClient = useQueryClient();

  const signInCheckout = <Button asChild size="sm" className="h-auto min-h-8 w-full whitespace-normal px-2 py-1.5 text-center text-xs leading-tight"><Link to="/auth">Sign in to pay with PayPal</Link></Button>;
  const loadingCheckout = <p role="status" className="min-h-8 py-1.5 text-center text-xs text-muted-foreground">Loading checkout…</p>;

  async function captured(orderId: string) {
    const r = await capture({ data: { orderId } });
    if (!r.ok) { toast.error("We couldn't confirm that payment. You haven't been charged twice — contact us if points are missing."); return; }
    await refresh();
    try { playFanfare(); } catch { /* sound optional */ }
    toast.success(`🎉 +${r.points} Wisdom Points added to your wallet!`, { duration: 6000 });
  }

  async function subscribed(subscriptionId: string) {
    const r = await activate({ data: { subscriptionId } });
    await refresh();
    await queryClient.invalidateQueries({ queryKey: ["monere-care", user?.id] });
    if (r.ok) toast.success(`👑 Welcome to ${r.tier === "club" ? "Monere Club" : "Monere Plus"}! Your monthly points and tokens are in your wallet.`, { duration: 6000 });
    else toast.error("PayPal hasn't confirmed your membership yet. It'll switch on as soon as it does.");
  }

  return (
    <section data-no-one-link="true" className="one-link-ignore mb-4 space-y-4">
      <div>
        <h2 className="mb-2 font-display text-base font-semibold">Point Packs</h2>
        <div className="grid gap-2 sm:grid-cols-3">
          {POINT_PACKS.map((p) => (
            <div key={p.id} data-no-one-link="true" className={`one-link-ignore relative flex flex-col rounded-lg border bg-card p-3 ${p.badge ? "border-primary ring-1 ring-primary" : "border-border"}`}>
              {p.badge && <span className="absolute -top-2 right-2 rounded-full bg-primary px-1.5 py-px text-[10px] font-bold text-primary-foreground">{p.badge}</span>}
              <p className="text-sm font-semibold leading-tight">{p.name}</p>
              <p className="font-display text-lg font-semibold leading-tight text-primary">{p.points.toLocaleString()} <span className="text-xs">pts</span></p>
              <p className="mb-2 text-xs text-muted-foreground">£{p.price} one-time</p>
              <div className="mt-auto">
                {!ready ? loadingCheckout : !user ? signInCheckout : <PayPalButton mode="capture" createOrder={async () => (await createOrder({ data: { pack: p.id } })).id} onApprove={captured} onError={() => toast.error("PayPal checkout didn't complete.")} />}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="font-display text-base font-semibold">Memberships</h2>
          <div className="flex rounded-full border border-border p-0.5 text-[11px] font-semibold" role="group" aria-label="Billing period">
            {(["monthly", "yearly"] as Interval[]).map((i) => (
              <Button key={i} type="button" size="sm" variant={interval === i ? "default" : "ghost"} onClick={() => setInterval(i)} aria-pressed={interval === i} className="h-auto rounded-full px-2 py-0.5 capitalize">{i}</Button>
            ))}
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {MEMBERSHIPS.map((m) => {
            const planId = m.plans[interval];
            const current = tier === m.tier;
            return (
              <div key={m.tier} data-no-one-link="true" className={`one-link-ignore relative flex flex-col rounded-lg border bg-card p-3 ${m.badge ? "border-primary ring-1 ring-primary" : "border-border"}`}>
                {m.badge && <span className="absolute -top-2 right-2 rounded-full bg-primary px-1.5 py-px text-[10px] font-bold text-primary-foreground">{m.badge}</span>}
                <p className="flex items-center gap-1 text-sm font-semibold leading-tight">{m.tier === "club" ? <Crown className="h-3.5 w-3.5 text-primary" /> : <Sparkles className="h-3.5 w-3.5 text-primary" />}{m.name}</p>
                <p className="font-display text-lg font-semibold leading-tight">£{interval === "monthly" ? m.monthly : m.yearly}<span className="text-xs text-muted-foreground">/{interval === "monthly" ? "mo" : "yr"}</span></p>
                <ul className="my-2 space-y-0.5 text-xs text-muted-foreground">{m.perks.map((x) => <li key={x} className="flex gap-1 leading-snug"><Check className="h-3 w-3 shrink-0 translate-y-0.5 text-primary" />{x}</li>)}</ul>
                <div className="mt-auto">
                  {!ready ? loadingCheckout : !user ? signInCheckout : current ? <p className="rounded-md bg-primary/10 py-1.5 text-center text-xs font-semibold text-primary">Your current membership</p>
                    : planId ? <div className="space-y-1">
                        <p className="text-center text-[11px] font-semibold text-foreground">{m.tier === "club" ? "Join" : "Subscribe to"} {m.name} – £{interval === "monthly" ? `${m.monthly}/mo` : `${m.yearly}/yr`}</p>
                        <PayPalButton mode="subscription" planId={planId} accountId={user.id} onApprove={subscribed} onError={() => toast.error("PayPal checkout didn't complete.")} />
                      </div>
                    : <p className="rounded-md border border-dashed border-border py-1.5 text-center text-[11px] text-muted-foreground">Coming soon</p>}
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-1.5 text-center text-[11px] text-muted-foreground">Under 18? Ask a parent or guardian to check out with PayPal. Cancel anytime in PayPal.</p>
      </div>
    </section>
  );
}
