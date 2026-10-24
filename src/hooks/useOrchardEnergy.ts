import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useCare } from "./useCare";
import { startOrchardMaze, settleOrchardMaze } from "@/lib/treasure.functions";
import { depositEnergy, replayMaze, type MazeDirection } from "@/lib/harvest-maze";
import { type TreeId } from "@/lib/orchard";

const GUEST_KEY = "monere-orchard-guest-energy";
const COOLDOWN = 60_000;
/** Signed in: Monere's real care Energy (server-capped per tree per day). Guests: a local, display-only bar. */
export function useOrchardEnergy() {
  const care = useCare(); const client = useQueryClient();
  const start = useServerFn(startOrchardMaze); const settle = useServerFn(settleOrchardMaze);
  const [guest, setGuest] = useState(50);
  const [cooling, setCooling] = useState<Record<string, number>>({});
  useEffect(() => { try { const v = Number(localStorage.getItem(GUEST_KEY)); if (Number.isFinite(v) && localStorage.getItem(GUEST_KEY) !== null) setGuest(Math.min(100, Math.max(0, v))); } catch { /* optional */ } }, []);
  const energy = care.user ? care.data?.energy ?? 0 : guest;
  const cool = (id: TreeId) => (cooling[id] ?? 0) > Date.now();
  async function beginMaze(id: TreeId) {
    if (id !== "caverns-1" && cool(id)) throw new Error("This tree is regrowing its fruit.");
    if (!care.user && !takeGuestMazeEntry(new Date().toISOString().slice(0, 10))) throw new Error("Free players can enter the Energy maze twice a day. Sign in with Monere Plus to harvest without limits!");
    return care.user ? (await start({ data: { tree: id } })).id : "guest";
  }
  async function finishMaze(id: TreeId, round: string, trace: MazeDirection[]) {
    const maze = replayMaze(trace);
    if (round === "practice") return { gained: 0, state: null };
    if (!care.user) {
      const gained = depositEnergy(guest, maze.energy), next = guest + gained;
      setGuest(next); try { localStorage.setItem(GUEST_KEY, String(next)); } catch { /* optional */ }
      setCooling(c => ({ ...c, [id]: Date.now() + COOLDOWN }));
      return { gained, state: null };
    }
    const result = await settle({ data: { round, trace } });
    client.setQueryData(["monere-care", care.user.id], (old: Record<string, unknown> | undefined) => old ? { ...old, energy: result.energy } : old);
    setCooling(c => ({ ...c, [id]: Date.now() + COOLDOWN })); void care.refetch();
    return result;
  }
  return { energy, cool, beginMaze, finishMaze, guest: !care.user };
}
