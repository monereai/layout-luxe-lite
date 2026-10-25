import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useCare } from "./useCare";
import { usePlan } from "./usePlan";
import { startOrchardMaze, settleOrchardMaze, spendMovementEnergy, startGardenGame, commitGardenGame, startArcadeGame, commitArcadeGame } from "@/lib/treasure.functions";
import { GARDEN_ENERGY_REWARD, type GardenInput } from "@/lib/garden-game";
import type { ArcadeInput } from "@/lib/arcade-game";
import { DASH_ENERGY, SPRINT_ENERGY_PER_SECOND } from "@/lib/movement";
import { depositEnergy, replayMaze, type MazeDirection } from "@/lib/harvest-maze";
import { takeGuestMazeEntry, type TreeId } from "@/lib/orchard";
import { DIG_ENERGY } from "@/lib/treasure";

const GUEST_KEY = "monere-orchard-guest-energy";
const COOLDOWN = 60_000;
/** Signed in: Monere's real care Energy (server-capped per tree per day). Guests: a local, display-only bar. */
export function useOrchardEnergy() {
  const care = useCare(); const client = useQueryClient();
  const plan = usePlan();
  const start = useServerFn(startOrchardMaze); const settle = useServerFn(settleOrchardMaze); const spend = useServerFn(spendMovementEnergy);
  const gardenStart = useServerFn(startGardenGame), gardenCommit = useServerFn(commitGardenGame);
  const arcadeStart = useServerFn(startArcadeGame), arcadeCommit = useServerFn(commitArcadeGame);
  const [guest, setGuest] = useState(50);
  const guestBalance = useRef(50);
  const spending = useRef(false);
  const identity = useRef(care.user?.id); identity.current = care.user?.id;
  const [cooling, setCooling] = useState<Record<string, number>>({});
  const practiceRounds = useRef(new Set<string>());
  function saveGuest(next: number) { guestBalance.current = next; setGuest(next); try { localStorage.setItem(GUEST_KEY, String(next)); } catch { /* optional */ } }
  useEffect(() => { try { const v = Number(localStorage.getItem(GUEST_KEY)); if (Number.isFinite(v) && localStorage.getItem(GUEST_KEY) !== null) { guestBalance.current = Math.min(100, Math.max(0, v)); setGuest(guestBalance.current); } } catch { /* optional */ } }, []);
  const energy = care.user ? care.data?.energy ?? 0 : guest;
  const cool = (id: TreeId) => (cooling[id] ?? 0) > Date.now();
  async function beginMaze(id: TreeId) {
    if (id !== "caverns-1" && cool(id)) throw new Error("This tree is regrowing its fruit.");
    if (!care.user && !takeGuestMazeEntry(new Date().toISOString().slice(0, 10))) {
      if (id === "caverns-1") return "guest-practice";
      throw new Error("Free players can enter the Energy maze twice a day. Sign in with Monere Plus to harvest without limits!");
    }
    if (!care.user) return "guest";
    const round = await start({ data: { tree: id } });
    if (round.practice) practiceRounds.current.add(round.id);
    return round.id;
  }
  async function finishMaze(id: TreeId, round: string, trace: MazeDirection[]) {
    const maze = replayMaze(trace);
    if (round === "practice" || round === "guest-practice") return { gained: 0, state: null };
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
  /** Pet digs reward Energy: server-granted for accounts, mirrored into the local bar for guests. */
  function gainDig() {
    if (!care.user) { saveGuest(Math.min(100, guestBalance.current + DIG_ENERGY)); return; }
    void care.refetch();
  }
  async function beginGarden() { return care.user ? (await gardenStart()).id : "guest"; }
  async function gardenAction(round: string, trace: GardenInput[], finish: boolean) {
    if (!care.user) {
      // Jumps are free; only the one-time finish reward touches the guest balance.
      const already = localStorage.getItem("monere-garden-guest-reward") === "claimed";
      const gained = finish && !already ? depositEnergy(guestBalance.current, GARDEN_ENERGY_REWARD) : 0;
      if (finish) saveGuest(guestBalance.current + gained);
      if (finish) localStorage.setItem("monere-garden-guest-reward", "claimed");
      return { energy: guestBalance.current, gained, points: finish && !already ? 20 : 0, state: null };
    }
    const account = care.user.id;
    const result = await gardenCommit({ data: { round, trace, finish } });
    if (identity.current !== account) throw new Error("Account changed.");
    client.setQueryData(["monere-care", account], (old: Record<string, unknown> | undefined) => old ? { ...old, energy: result.energy } : old);
    if (finish) { void care.refetch(); void plan.refresh(); }
    return result;
  }
  async function beginArcade() { return care.user ? (await arcadeStart()).id : "guest"; }
  /** Connie's arcade prizes the second scroll only — no Energy or points, so guests need no local ledger. */
  async function finishArcade(round: string, trace: ArcadeInput[]) {
    if (!care.user) return { state: null };
    const account = care.user.id;
    const result = await arcadeCommit({ data: { round, trace } });
    if (identity.current !== account) throw new Error("Account changed.");
    void care.refetch();
    return result;
  }
  return { energy, cool, beginMaze, isMazePractice: (round: string) => round === "practice" || round === "guest-practice" || practiceRounds.current.has(round), finishMaze, boost, gainDig, beginGarden, gardenAction, beginArcade, finishArcade, guest: !care.user };
}
