import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useCare } from "./useCare";
import { startOrchardMaze, settleOrchardMaze, spendMovementEnergy } from "@/lib/treasure.functions";
import { DASH_ENERGY, SPRINT_ENERGY_PER_SECOND } from "@/lib/movement";
import { depositEnergy, replayMaze, type MazeDirection } from "@/lib/harvest-maze";
import { takeGuestMazeEntry, type TreeId } from "@/lib/orchard";

const GUEST_KEY = "monere-orchard-guest-energy";
const COOLDOWN = 60_000;
/** Signed in: Monere's real care Energy (server-capped per tree per day). Guests: a local, display-only bar. */
export function useOrchardEnergy() {
  const care = useCare(); const client = useQueryClient();
  const start = useServerFn(startOrchardMaze); const settle = useServerFn(settleOrchardMaze); const spend = useServerFn(spendMovementEnergy);
  const [guest, setGuest] = useState(50);
  const guestBalance = useRef(50);
  const spending = useRef(false);
  const identity = useRef(care.user?.id); identity.current = care.user?.id;
  const [cooling, setCooling] = useState<Record<string, number>>({});
  function saveGuest(next: number) { guestBalance.current = next; setGuest(next); try { localStorage.setItem(GUEST_KEY, String(next)); } catch { /* optional */ } }
  useEffect(() => { try { const v = Number(localStorage.getItem(GUEST_KEY)); if (Number.isFinite(v) && localStorage.getItem(GUEST_KEY) !== null) { guestBalance.current = Math.min(100, Math.max(0, v)); setGuest(guestBalance.current); } } catch { /* optional */ } }, []);
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
      const gained = depositEnergy(guestBalance.current, maze.energy), next = guestBalance.current + gained;
      saveGuest(next);
      setCooling(c => ({ ...c, [id]: Date.now() + COOLDOWN }));
      return { gained, state: null };
    }
    const result = await settle({ data: { round, trace } });
    client.setQueryData(["monere-care", care.user.id], (old: Record<string, unknown> | undefined) => old ? { ...old, energy: result.energy } : old);
    setCooling(c => ({ ...c, [id]: Date.now() + COOLDOWN })); void care.refetch();
    return result;
  }
  async function boost(mode: "sprint" | "dash") {
    if (!care.user) {
      const cost = mode === "dash" ? DASH_ENERGY : SPRINT_ENERGY_PER_SECOND;
      if (guestBalance.current < cost) return false;
      saveGuest(guestBalance.current - cost);
      return true;
    }
    if (spending.current || (care.data?.energy ?? 0) < (mode === "dash" ? DASH_ENERGY : SPRINT_ENERGY_PER_SECOND)) return false;
    spending.current = true;
    const account = care.user.id;
    try {
      const result = await spend({ data: { mode } });
      if (identity.current !== account) return false;
      client.setQueryData(["monere-care", account], (old: Record<string, unknown> | undefined) => old ? { ...old, energy: result.energy } : old);
      return result.allowed;
    } finally { spending.current = false; }
  }
  /** Pet digs cost Energy too: server-deducted for accounts, mirrored from the local bar for guests. */
  function spendDig() {
    if (!care.user) {
      if (guestBalance.current < DIG_ENERGY) return false;
      saveGuest(guestBalance.current - DIG_ENERGY);
      return true;
    }
    void care.refetch();
    return true;
  }
  return { energy, cool, beginMaze, finishMaze, boost, spendDig, guest: !care.user };
}
