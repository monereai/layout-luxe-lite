import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { Check, X, ArrowLeft } from "lucide-react";
import { useOutfit } from "@/lib/outfit";
import { Button } from "@/components/ui/button";
import { PassCodeLink } from "@/components/PassCodeDialog";
import { usePlan } from "@/hooks/usePlan";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { createCheckoutSession } from "@/utils/payments.functions";

const PLANS = [
  { id: "plus_monthly", name: "Monere Plus (Monthly)", price: "£2.99 / month" },
  { id: "plus_yearly", name: "Monere Plus (Annual Best Value)", price: "£24.99 / year", badge: "Save 30%" },
] as const;

function Checkout({ priceId }: { priceId: string }) {
  const options = useMemo(() => ({
    fetchClientSecret: async () => {
      const r = await createCheckoutSession({
        data: { priceId, environment: getStripeEnvironment(), returnUrl: `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}` },
      });
      if ("error" in r) throw new Error(r.error);
      return r.clientSecret;
    },
  }), [priceId]);
  return (
    <div id="checkout" className="overflow-hidden rounded-2xl">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={options}><EmbeddedCheckout /></EmbeddedCheckoutProvider>
    </div>
  );
}

export function PaywallModal({ onClose, reason = "limit" }: { onClose: () => void; reason?: "limit" | "upgrade" }) {
  const { user } = usePlan();
  const [plan, setPlan] = useState<string>("plus_yearly");
  const [checkout, setCheckout] = useState(false);

  return (
    <div role="dialog" aria-modal="true" aria-label="Upgrade to Monere Plus" className="fixed inset-0 z-50 flex items-end justify-center bg-background/85 backdrop-blur-sm sm:items-center">
      <div className="surface-card relative flex max-h-[100dvh] w-full max-w-md flex-col overflow-y-auto rounded-b-none p-6 sm:rounded-3xl">
        <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 z-10 text-muted-foreground hover:text-primary"><X className="h-5 w-5" /></button>
        {checkout ? (
          <>
            <button onClick={() => setCheckout(false)} className="mb-3 inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" /> Back to plans</button>
            <Checkout priceId={plan} />
          </>
        ) : (
          <>
            <img src={outfit.src} alt="Monere the lion holding his tablet" className="mentor-avatar mx-auto h-40 w-40 object-contain" />
            <h2 className="mt-2 text-center font-display text-xl font-semibold">
              {reason === "limit" ? "You've reached today's free limit! Upgrade to Monere Plus to keep talking with Monere." : "Upgrade to Monere Plus"}
            </h2>
            <p className="mt-3 rounded-2xl border border-primary/25 bg-primary/10 px-4 py-3 text-center text-sm italic">
              "Keep the conversation going with unlimited advice, music recommendations, and your private reflection journal."
            </p>
            <div role="radiogroup" aria-label="Choose a plan" className="mt-5 grid gap-2">
              {PLANS.map((p) => {
                const on = plan === p.id;
                return (
                  <button key={p.id} role="radio" aria-checked={on} onClick={() => setPlan(p.id)}
                    className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition ${on ? "border-primary bg-primary/10 shadow-[var(--shadow-gold)]" : "border-border hover:border-primary/50"}`}>
                    <span>
                      <span className="block text-sm font-semibold">{p.name}</span>
                      <span className="text-sm text-muted-foreground">{p.price}{"badge" in p && <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">{p.badge}</span>}</span>
                    </span>
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${on ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"}`}>{on && <Check className="h-3 w-3" />}</span>
                  </button>
                );
              })}
            </div>
            {user ? (
              <Button onClick={() => setCheckout(true)} className="btn-gold mt-5 h-auto w-full py-4">Start 7-Day Free Trial</Button>
            ) : (
              <>
                <Button asChild className="btn-gold mt-5 h-auto w-full py-4"><Link to="/auth" search={{ next: "/?upgrade=1" }}>Start 7-Day Free Trial</Link></Button>
                <p className="mt-2 text-center text-xs text-muted-foreground">You'll create a free account first so Plus stays with you.</p>
              </>
            )}
            <p className="mt-2 text-center text-xs text-muted-foreground">Free for 7 days, then billed. Cancel anytime.</p>
            <PassCodeLink className="mx-auto mt-4 block" />
          </>
        )}
      </div>
    </div>
  );
}
