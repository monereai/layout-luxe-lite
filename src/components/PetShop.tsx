import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Award, Check, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { usePointsWallet } from "@/hooks/usePointsWallet";
import { usePlan } from "@/hooks/usePlan";
import { PETS, petAction, petButtonState, usePets, type Pet } from "@/lib/pets";

const BUTTON = "mt-auto h-auto min-h-8 w-full whitespace-normal px-2 py-2 text-center leading-tight";

export function PetShop() {
  const pets = usePets();
  const wallet = usePointsWallet();
  const { user, refresh } = usePlan();
  const [busy, setBusy] = useState<string | null>(null);

  async function run(action: "buy" | "equip" | "unequip", pet: Pet) {
    if (!user) { toast.error("Please sign in to adopt a pet."); return; }
    if (action === "buy" && wallet < pet.cost) { toast.error("Not enough points!"); return; }
    setBusy(pet.id);
    try {
      await petAction(action, pet.id);
      if (action === "buy") { await refresh(); toast.success(`Purchase successful! ${pet.name} is now your pet.`); }
      else if (action === "equip") toast.success(`Equipped ${pet.name} as your companion! 🦁`);
      else toast.success(`${pet.name} unequipped.`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      toast.error(msg.includes("Not enough points") ? "Not enough points!" : "Something went wrong — please try again.");
    } finally { setBusy(null); }
  }

  return (
    <section aria-label="Pet Shop">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Adopt a companion for Monere with your Shop Points.</p>
        <div className="flex shrink-0 items-center gap-2 rounded-full border border-points/45 bg-points/10 px-3 py-1.5 text-points pop-shadow" aria-live="polite" aria-label={`${wallet} points available`}>
          <Award className="h-4 w-4" /><span className="font-heading text-lg font-semibold tabular-nums">{wallet}</span><span className="text-xs">pts</span>
        </div>
      </div>
      {!user && <p className="mb-4 rounded-lg border border-border bg-card p-3 text-sm"><Link to="/auth" search={{ next: "/pet-shop" } as never} className="text-primary underline-offset-2 hover:underline">Sign in</Link> to adopt pets.</p>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {PETS.map((pet) => {
          const st = petButtonState(pets, wallet, pet);
          return (
            <div key={pet.id} className={`flex flex-col rounded-lg border bg-card p-3 transition-all hover:-translate-y-0.5 hover:border-primary/50 ${st === "equipped" ? "border-primary ring-2 ring-primary" : "border-border"}`}>
              <div className="mb-2 flex h-28 items-center justify-center">
                <img src={pet.src} alt={pet.name} width={816} height={816} loading="lazy" className="max-h-full max-w-full object-contain" />
              </div>
              <p className="font-heading text-sm font-semibold">{pet.name}</p>
              <p className="font-body text-xs text-muted-foreground">{pet.description}</p>
              <p className="mb-3 mt-1 flex items-center gap-1 font-heading text-xs font-semibold text-points"><Award className="h-3.5 w-3.5" />{pet.cost} pts</p>
              {st === "equipped" ? (
                <Button size="sm" variant="secondary" className={BUTTON} disabled={busy === pet.id} onClick={() => run("unequip", pet)} aria-label={`${pet.name} equipped — tap to unequip`}><Check /> Equipped · Unequip</Button>
              ) : st === "owned" ? (
                <Button size="sm" variant="outline" className={BUTTON} disabled={busy === pet.id} onClick={() => run("equip", pet)}>Equip</Button>
              ) : (
                <Button size="sm" className={`${BUTTON} ${st === "unaffordable" ? "opacity-60" : ""}`} disabled={st === "unaffordable" || busy === pet.id} onClick={() => run("buy", pet)}>
                  {st === "unaffordable" && <Lock />} Buy for {pet.cost} pts
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
