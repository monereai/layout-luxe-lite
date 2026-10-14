import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { KeyRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { redeemPassCode } from "@/lib/passcode.functions";
import { usePlan } from "@/hooks/usePlan";

export function PassCodeLink({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`text-xs text-muted-foreground underline-offset-4 hover:text-primary hover:underline ${className}`}>
        Have a Church or School Pass Code? Enter it here.
      </button>
      {open && <PassCodeDialog onClose={() => setOpen(false)} />}
    </>
  );
}

function PassCodeDialog({ onClose }: { onClose: () => void }) {
  const { user, refresh } = usePlan();
  const redeem = useServerFn(redeemPassCode);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (code.trim().length < 3) { setError("Hmm, that code isn't recognized or has expired. Check with your youth leader or try again."); return; }
    setBusy(true);
    const res = await redeem({ data: { code } }).catch(() => ({ ok: false as const }));
    setBusy(false);
    if (!res.ok) { setError("Hmm, that code isn't recognized or has expired. Check with your youth leader or try again."); return; }
    window.localStorage.setItem("monereai-tier", "premium");
    await refresh();
    toast.success(`Welcome, ${res.organization} member! You have full access to Monere Plus.`);
    onClose();
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="Enter a pass code" className="fixed inset-0 z-[60] flex items-center justify-center bg-background/85 p-5 backdrop-blur-sm">
      <div className="surface-card relative max-h-[90dvh] w-full max-w-sm overflow-y-auto p-6">
        <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 text-muted-foreground hover:text-primary"><X className="h-5 w-5" /></button>
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-primary"><KeyRound className="h-5 w-5" /></span>
        <h2 className="mt-4 font-display text-xl font-semibold">Enter your Youth Group or School Pass Code</h2>
        {!user ? (
          <>
            <p className="mt-2 text-sm text-muted-foreground">Sign in first so your pass stays with your account.</p>
            <Button asChild className="btn-gold mt-5 h-auto w-full py-3"><Link to="/auth" search={{ next: "/" }}>Sign in or create account</Link></Button>
          </>
        ) : (
          <form onSubmit={submit} className="mt-4">
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={40} autoFocus placeholder="e.g. STMARKS2026" aria-label="Pass code"
              className="w-full rounded-xl border border-border bg-background/60 px-4 py-3 font-mono tracking-widest outline-none focus:border-primary" />
            {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={busy} className="btn-gold mt-4 h-auto w-full py-3">{busy ? "Checking…" : "Activate Pass"}</Button>
          </form>
        )}
      </div>
    </div>
  );
}
