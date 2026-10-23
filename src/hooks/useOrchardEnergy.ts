import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useCare } from "./useCare";
import { orchardHarvest } from "@/lib/treasure.functions";
import { harvestGain, type TreeId } from "@/lib/orchard";

const GUEST_KEY = "monere-orchard-guest-energy";
const COOLDOWN = 60_000;
/** Signed in: Monere's real care Energy (server-capped per tree per day). Guests: a local, display-only bar. */
export function useOrchardEnergy() {
  const care = useCare(); const client = useQueryClient(); const harvest = useServerFn(orchardHarvest);
  const [guest, setGuest] = useState(50);
  const [cooling, setCooling] = useState<Record<string, number>>({});
  useEffect(() => { try { const v = Number(localStorage.getItem(GUEST_KEY)); if (Number.isFinite(v) && localStorage.getItem(GUEST_KEY) !== null) setGuest(Math.min(100, Math.max(0, v))); } catch { /* optional */ } }, []);
  const energy = care.user ? care.data?.energy ?? 0 : guest;
  const cool = (id: TreeId) => (cooling[id] ?? 0) > Date.now();
  async function pick(id: TreeId): Promise<{ gained: number; reason?: string }> {
    if (cool(id)) return { gained: 0, reason: "This tree is regrowing its fruit." };
    setCooling(c => ({ ...c, [id]: Date.now() + COOLDOWN })); setTimeout(() => setCooling(c => ({ ...c })), COOLDOWN + 50);
    if (!care.user) { const gained = harvestGain(guest); const next = guest + gained; setGuest(next); try { localStorage.setItem(GUEST_KEY, String(next)); } catch { /* optional */ } return { gained }; }
    const r = await harvest({ data: { tree: id } });
    client.setQueryData(["monere-care", care.user.id], (old: Record<string, unknown> | undefined) => old ? { ...old, energy: r.energy } : old);
    void care.refetch();
    return r.harvested ? { gained: r.gained } : { gained: 0, reason: "You've already harvested this tree today. Come back tomorrow!" };
  }
  return { energy, pick, cool, guest: !care.user };
}
