import { Link } from "@tanstack/react-router";
import { Heart, Gift } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useCare } from "@/hooks/useCare";
import { canClaimCare } from "@/lib/care";

export function MonereCare() {
  const care = useCare();
  const state = care.data;
  const shown = state?.energy ?? 0;
  if (!care.ready) return <p className="py-3 text-center text-sm text-muted-foreground">Loading Monere's care…</p>;
  if (!care.user) return <p className="py-3 text-center text-sm text-muted-foreground"><Link to="/auth" className="text-primary underline">Sign in</Link> to care for Monere and earn rewards.</p>;
  if (!state) return <div className="py-3 text-center"><p className="text-sm text-muted-foreground">{care.isError ? "Monere's care couldn't load." : "Loading Monere's care…"}</p>{care.isError && <Button variant="outline" onClick={() => void care.refetch()}>Try again</Button>}</div>;
  async function claim() {
    try {
      const result = await care.action.mutateAsync("claim");
      const perk = result.allowance === 300 ? "Club Perk" : result.allowance === 200 ? "Plus Perk" : "Upgrade to Plus for 2x";
      toast.success(`+${result.pointsAwarded} Points! (${perk})`);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Couldn't save Monere's care. Try again."); }
  }
  const eligible = canClaimCare(state.energy, state.claimed, state.claimDate, state.today);
  return <section aria-label="Monere energy and daily care" className="relative mx-auto my-4 w-full max-w-lg">
    <div className="mb-2 flex items-center justify-between gap-3 text-sm">
      <span className="flex items-center gap-2 font-semibold"><Heart className="h-4 w-4 text-primary" />Monere's Energy</span>
      <span className="font-semibold text-primary tabular-nums">{shown}/100%</span>
    </div>
    <Progress value={shown} aria-label="Monere energy" aria-valuenow={state.energy} className="h-3" />
    <div className="my-2 flex items-center justify-between gap-2 text-xs text-muted-foreground"><span>{state.energy === 100 ? "Feeling great" : state.energy >= 50 ? "Happy & playful" : state.energy >= 20 ? "A little tired" : "Ready for some care"}</span><span>{state.allowance} Points daily · resets at 00:00 UTC</span></div>
    <Button className="h-auto w-full whitespace-normal py-3" disabled={care.action.isPending || !eligible} onClick={() => void claim()}><Gift />{state.claimed ? "Daily Care Reward Claimed" : `Claim Daily Care Reward · ${state.allowance} Points`}</Button>
  </section>;
}