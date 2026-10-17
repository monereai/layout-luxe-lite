import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Check, CreditCard, Crown, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { usePlan } from "@/hooks/usePlan";
import { MEMBERSHIPS, POINT_PACKS, type Interval } from "@/lib/store-config";
import { confirmCheckout } from "@/lib/payments.functions";
import { getStripeEnvironment } from "@/lib/stripe";
import { playFanfare } from "@/lib/sound";
import { Button } from "@/components/ui/button";
import { StripeCheckoutDialog } from "./StripeCheckoutDialog";

export function MonereStore() {
  const { user, tier, ready, refresh } = usePlan();
  const [interval, setInterval] = useState<Interval>("monthly");
  const [checkout, setCheckout] = useState<{ priceId: string; title: string } | null>(null);
  const confirm = useServerFn(confirmCheckout);
  const queryClient = useQueryClient();
  const handled = useRef(false);

  // After Stripe returns to /shop?session_id=…, verify server-side and update the wallet without a reload.
  useEffect(() => {
    if (!ready || !user || handled.current) return;
    const sessionId = new URLSearchParams(window.location.search).get("session_id");
    if (!sessionId) return;
    handled.current = true;
    window.history.replaceState(null, "", window.location.pathname);
    void (async () => {
      const r = await confirm({ data: { sessionId, environment: getStripeEnvironment() } });
      await refresh();
      await queryClient.invalidateQueries({ queryKey: ["monere-care", user.id] });
      if (!r.ok) { toast.error(r.error ?? "We couldn't confirm that payment yet. Contact us if it doesn't appear shortly."); return; }
      try { playFanfare(); } catch { /* sound optional */ }
      if (r.kind === "pack") toast.success(`🎉 +${r.points} Shop Points added to your wallet!`, { duration: 6000 });
      else toast.success(`👑 Welcome to ${r.tier === "club" ? "Monere Club" : "Monere Plus"}! Your monthly points and tokens are in your wallet.`, { duration: 6000 });
    })();
  }, [ready, user, confirm, refresh, queryClient]);

  const signIn = <Button asChild size="sm" className="h-auto min-h-8 w-full whitespace-normal px-2 py-1.5 text-xs"><Link to="/auth">Sign in to buy</Link></Button>;
  const loading = <p role="status" className="min-h-8 py-1.5 text-center text-xs text-muted-foreground">Loading…</p>;
  const payButton = (priceId: string, title: string, label: string) => (
    <Button size="sm" className="h-auto min-h-8 w-full whitespace-normal px-2 py-1.5 text-xs" onClick={() => setCheckout({ priceId, title })}><CreditCard className="h-3.5 w-3.5" />{label}</Button>
  );

  return (
    <section className="mb-4 space-y-4">
      {String(import.meta.env["VITE_PAYMENTS_CLIENT_TOKEN"] ?? "").startsWith("pk_test_") && <p className="rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 text-center text-xs text-primary">All payments made in the preview are Stripe test payments. <a className="underline" target="_blank" rel="noopener noreferrer" href="https://docs.lovable.dev/features/payments#test-and-live-environments">Read more</a></p>}
      <div>
        <h2 className="mb-2 font-display text-base font-semibold">Point Packs</h2>
        <div className="grid gap-2 sm:grid-cols-3">
          {POINT_PACKS.map((p) => (
            <div key={p.id} className={`relative flex flex-col rounded-lg border bg-card p-3 ${p.badge ? "border-primary ring-1 ring-primary" : "border-border"}`}>
              {p.badge && <span className="absolute -top-2 right-2 rounded-full bg-primary px-1.5 py-px text-[10px] font-bold text-primary-foreground">{p.badge}</span>}
              <p className="text-sm font-semibold leading-tight">{p.name}</p>
              <p className="font-display text-lg font-semibold leading-tight text-primary">{p.points.toLocaleString()} <span className="text-xs">pts</span></p>
              <p className="mb-2 text-xs text-muted-foreground">£{p.price} one-time</p>
              <div className="mt-auto">{!ready ? loading : !user ? signIn : payButton(p.priceId, `${p.name} — £${p.price}`, `Buy for £${p.price}`)}</div>
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
            const price = interval === "monthly" ? `£${m.monthly}/mo` : `£${m.yearly}/yr`;
            return (
              <div key={m.tier} className={`relative flex flex-col rounded-lg border bg-card p-3 ${m.badge ? "border-primary ring-1 ring-primary" : "border-border"}`}>
                {m.badge && <span className="absolute -top-2 right-2 rounded-full bg-primary px-1.5 py-px text-[10px] font-bold text-primary-foreground">{m.badge}</span>}
                <p className="flex items-center gap-1 text-sm font-semibold leading-tight">{m.tier === "club" ? <Crown className="h-3.5 w-3.5 text-primary" /> : <Sparkles className="h-3.5 w-3.5 text-primary" />}{m.name}</p>
                <p className="font-display text-lg font-semibold leading-tight">£{interval === "monthly" ? m.monthly : m.yearly}<span className="text-xs text-muted-foreground">/{interval === "monthly" ? "mo" : "yr"}</span></p>
                <ul className="my-2 space-y-0.5 text-xs text-muted-foreground">{m.perks.map((x) => <li key={x} className="flex gap-1 leading-snug"><Check className="h-3 w-3 shrink-0 translate-y-0.5 text-primary" />{x}</li>)}</ul>
                <div className="mt-auto">
                  {!ready ? loading : !user ? signIn : tier === m.tier
                    ? <p className="rounded-md bg-primary/10 py-1.5 text-center text-xs font-semibold text-primary">Your current membership</p>
                    : payButton(m.prices[interval], `${m.name} — ${price}`, `${m.tier === "club" ? "Join" : "Subscribe"} – ${price}`)}
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-1.5 text-center text-[11px] text-muted-foreground">Under 18? Ask a parent or guardian to check out. Pay securely with Stripe; cancel anytime.</p>
      </div>
      <StripeCheckoutDialog item={checkout} onClose={() => setCheckout(null)} />
    </section>
  );
}
