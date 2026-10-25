import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useCare } from "./useCare";
import { usePlan } from "./usePlan";
import { startOrchardMaze, settleOrchardMaze, spendMovementEnergy, startGardenGame, commitGardenGame, startArcadeGame, commitArcadeGame } from "@/lib/treasure.functions";
import { GARDEN_ENERGY_REWARD, GARDEN_COIN_REWARD, JUMP_COST, replayGarden, type GardenInput } from "@/lib/garden-game";
import { CONNIE_COIN_REWARD } from "@/lib/adventure-economy";
import type { ArcadeInput } from "@/lib/arcade-game";
import { DASH_ENERGY, SPRINT_ENERGY_PER_SECOND } from "@/lib/movement";
import { depositEnergy, replayMaze, type MazeDirection } from "@/lib/harvest-maze";
import { overflowPayout, splitEnergyGain, takeGuestMazeEntry, type TreeId } from "@/lib/orchard";
import { recordEnergyOverflow } from "@/lib/game";
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
  function saveGuest(next: number) { next = Math.min(100, Math.max(0, next)); guestBalance.current = next; setGuest(next); try { localStorage.setItem(GUEST_KEY, String(next)); } catch { /* optional */ } }
  useEffect(() => { try { const v = Number(localStorage.getItem(GUEST_KEY)); if (Number.isFinite(v) && localStorage.getItem(GUEST_KEY) !== null) { guestBalance.current = Math.min(100, Math.max(0, v)); setGuest(guestBalance.current); } } catch { /* optional */ } }, []);
  const energy = care.user ? care.data?.energy ?? 0 : guest;
  const cool = (id: TreeId) => (cooling[id] ?? 0) > Date.now();
  const overflowBalance = useRef(0);
  const OVERFLOW_KEY = "monere-orchard-guest-overflow";
  useEffect(() => { try { const v = Number(localStorage.getItem(OVERFLOW_KEY)); if (Number.isFinite(v)) overflowBalance.current = Math.max(0, v); } catch { /* optional */ } }, []);
  /** The bar stays capped at 100 (daily care remains claimable); Energy gained while full accumulates and pays +5 Points per 100. */
  async function creditOverflow(amount: number) {
    if (amount <= 0) return;
    if (!care.user) {
      const payout = overflowPayout(overflowBalance.current + amount);
      overflowBalance.current = payout.overflow;
      try { localStorage.setItem(OVERFLOW_KEY, String(payout.overflow)); } catch { /* optional */ }
      if (payout.points > 0) { recordEnergyOverflow(payout.points); toast(`+${payout.points} Points! Energy Overflow!`); }
      return;
    }
  }
  function acceptEnergy(account: string, next: number) {
    client.setQueryData(["monere-care", account], (old: Record<string, unknown> | undefined) => ({ ...old, energy: next }));
    try { localStorage.setItem(`monere-energy-cache-${account}`, String(next)); } catch { /* mirror only */ }
  }
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
      void creditOverflow(maze.energy - gained);
      setCooling(c => ({ ...c, [id]: Date.now() + COOLDOWN }));
      return { gained, state: null };
    }
    const result = await settle({ data: { round, trace } });
    acceptEnergy(care.user.id, result.energy);
    if (result.overflowPoints > 0) toast(`+${result.overflowPoints} Points! Energy Overflow!`);
    void plan.refresh();
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
      acceptEnergy(account, result.energy);
      return result.allowed;
    } finally { spending.current = false; }
  }
  /** Pet digs reward Energy: server-granted for accounts, mirrored into the local bar for guests. */
  function gainDig() {
    if (!care.user) {
      const split = splitEnergyGain(guestBalance.current, DIG_ENERGY);
      saveGuest(split.energy);
      void creditOverflow(split.overflow);
      return;
    }
    void care.refetch();
    void plan.refresh();
  }
  const guestJumps = useRef(0);
  async function beginGarden() { guestJumps.current = 0; return care.user ? (await gardenStart()).id : "guest"; }
  async function gardenAction(round: string, trace: GardenInput[], finish: boolean) {
    if (!care.user) {
      const jumps = replayGarden(trace).jumps;
      const cost = Math.max(0, jumps - guestJumps.current) * JUMP_COST;
      if (guestBalance.current < cost) throw new Error("Each jump needs 5 Energy.");
      saveGuest(guestBalance.current - cost); guestJumps.current = Math.max(guestJumps.current, jumps);
      const already = localStorage.getItem("monere-garden-guest-reward") === "claimed";
      const gained = finish && !already ? depositEnergy(guestBalance.current, GARDEN_ENERGY_REWARD) : 0;
      if (finish && !already) { saveGuest(guestBalance.current + gained); void creditOverflow(GARDEN_ENERGY_REWARD - gained); }
      if (finish) localStorage.setItem("monere-garden-guest-reward", "claimed");
      return { energy: guestBalance.current, gained, points: 0, coins: finish && !already ? GARDEN_COIN_REWARD : 0, state: null };
    }
    const account = care.user.id;
    const result = await gardenCommit({ data: { round, trace, finish } });
    if (identity.current !== account) throw new Error("Account changed.");
    acceptEnergy(account, result.energy);
    if (result.overflowPoints > 0) toast(`+${result.overflowPoints} Points! Energy Overflow!`);
    if (finish) { void care.refetch(); void plan.refresh(); }
    return result;
  }
  async function beginArcade() { return care.user ? (await arcadeStart()).id : "guest"; }
  /** Connie's Coins are distinct from Shop Points and awarded once. */
  async function finishArcade(round: string, trace: ArcadeInput[]) {
    if (!care.user) {
      const already = localStorage.getItem("monere-arcade-guest-reward") === "claimed";
      localStorage.setItem("monere-arcade-guest-reward", "claimed");
      return { state: null, coins: already ? 0 : CONNIE_COIN_REWARD };
    }
    const account = care.user.id;
    const result = await arcadeCommit({ data: { round, trace } });
    if (identity.current !== account) throw new Error("Account changed.");
    void care.refetch();
    return result;
  }
  return { energy, cool, beginMaze, isMazePractice: (round: string) => round === "practice" || round === "guest-practice" || practiceRounds.current.has(round), finishMaze, boost, gainDig, beginGarden, gardenAction, beginArcade, finishArcade, guest: !care.user };
}
