import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { useOutfit } from "@/lib/outfit";
import { Button } from "@/components/ui/button";
import { PassCodeLink } from "@/components/PassCodeDialog";
import { usePlan } from "@/hooks/usePlan";
import { createCheckoutSession, type PlanKey } from "@/utils/payments.functions";

const PLANS: { id: PlanKey; name: string; price: string; note: string }[] = [
  { id: "individual", name: "Individual Mentor Plan", price: "£2.99 / month", note: "Full Monere chat, daily features and the whole wardrobe." },
  { id: "group", name: "Youth Group Pass", price: "£99 / year", note: "A shareable code for up to 30 young people in your club or group." },
];

export function PaywallModal({ onClose, reason = "limit" }: { onClose: () => void; reason?: "limit" | "upgrade" }) {
  const { outfit } = useOutfit();
  const { user } = usePlan();
  const [plan, setPlan] = useState<PlanKey>("individual");
  const [busy, setBusy] = useState(false);

  async function go() {
    setBusy(true);
    const fail = "Couldn't start checkout.";
    const r = await createCheckoutSession({ data: { plan, origin: window.location.origin } }).catch(() => ({ error: fail }));
    if ("error" in r || !r.url) { toast("error" in r ? r.error : fail); setBusy(false); return; }
    window.location.href = r.url;
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="Subscribe or upgrade" className="fixed inset-0 z-50 flex items-end justify-center bg-background/85 backdrop-blur-sm sm:items-center">
      <div className="surface-card payment-modal relative z-40 max-h-[90vh] w-full max-w-md overflow-y-auto overscroll-contain rounded-b-none sm:rounded-3xl">
        <div className="relative p-6 pb-12">
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close" className="absolute right-3 top-3 z-10 text-muted-foreground hover:text-primary"><X className="h-5 w-5" /></Button>
        <img src={outfit.src} alt="Monere the lion holding his tablet" className="mentor-avatar mx-auto h-40 w-40 shrink-0 object-contain" />
        <h2 className="mt-2 text-center font-display text-xl font-semibold">
          {reason === "limit" ? "You've reached today's free limit! Upgrade to Monere Plus to keep talking with Monere." : "Subscribe / Upgrade"}
        </h2>
        <div role="radiogroup" aria-label="Choose a plan" className="mt-5 grid gap-2">
          {PLANS.map((p) => {
            const on = plan === p.id;
            return (
              <button key={p.id} role="radio" aria-checked={on} onClick={() => setPlan(p.id)}
                className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition ${on ? "border-primary bg-primary/10 shadow-[var(--shadow-gold)]" : "border-border hover:border-primary/50"}`}>
                <span>
                  <span className="block text-sm font-semibold">{p.name}</span>
                  <span className="text-sm text-muted-foreground">{p.price}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{p.note}</span>
                </span>
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${on ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"}`}>{on && <Check className="h-3 w-3" />}</span>
              </button>
            );
          })}
        </div>
        {!user && <p className="mt-5 text-center text-xs text-muted-foreground">You'll create a free account first so Plus stays with you.</p>}
        <p className="mt-3 text-center text-xs text-muted-foreground">Free for 7 days, then billed. Cancel anytime.</p>
        <PassCodeLink className="mx-auto mt-4 block" />
        </div>
        <div className="sticky bottom-0 z-50 border-t border-border bg-background/95 px-6 pt-3 pb-safe backdrop-blur">
          {user ? (
            <Button onClick={() => void go()} disabled={busy} className="btn-gold h-auto w-full whitespace-normal py-4">{busy ? "Opening secure checkout…" : "Start 7-Day Free Trial"}</Button>
          ) : (
            <Button asChild className="btn-gold h-auto w-full whitespace-normal py-4"><Link to="/auth" search={{ next: "/?upgrade=1" }}>Start 7-Day Free Trial</Link></Button>
          )}
        </div>
      </div>
    </div>
  );
}
