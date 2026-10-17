import { useEffect, useSyncExternalStore } from "react";

export const GAME_KEY = "monereai-game";
export type GameState = { points: number; detective: boolean; best: Record<string, number>; finds: Record<string, number>; mystery?: string; jigsaws?: number[]; hintsSpent?: number };
const EMPTY: GameState = { points: 0, detective: false, best: {}, finds: {} };

let current = EMPTY;

export const MINI_COUNT = 10;
export const POINTS_PER_MINI = 0;
export const COMPLETION_BONUS = 5;

/** Wisdom Points charged for one clue from Monere's Hint. */
export const HINT_COST = 20;

/** A map unlocks after this many Mini-Moneres found in the previous map. */
export const MAP_UNLOCK_FINDS = 10;

/** The first map is always open; later maps need MAP_UNLOCK_FINDS finds in the map before them. */
export function mapUnlocked(finds: Record<string, number>, prevSceneId?: string) {
  if (!prevSceneId) return true;
  return (finds[prevSceneId] ?? 0) >= MAP_UNLOCK_FINDS;
}

/** True when every listed map has had all its Mini-Moneres found. */
export function allMapsComplete(finds: Record<string, number>, sceneIds: string[]) {
  return sceneIds.every((id) => (finds[id] ?? 0) >= MINI_COUNT);
}

/** Remembers the one-time mystery reward so it is only given once. */
export function recordMystery(itemId: string) {
  if (current.mystery) return false;
  current = { ...current, mystery: itemId };
  save();
  return true;
}

/** A hidden Mini-Monere: x/y are % of the picture, size is % of its width. */
export type Spot = { x: number; y: number; size: number; rot: number };

/** Ten random, non-overlapping spots inside the picture (kept away from the edges). Tiny sizes and full rotation keep the hunt challenging. */
export function makeSpots(rand: () => number = Math.random): Spot[] {
  const spots: Spot[] = [];
  let tries = 0;
  while (spots.length < MINI_COUNT && tries < 4000) {
    tries++;
    const s = { x: 5 + rand() * 90, y: 7 + rand() * 86, size: 2 + rand() * 1.2, rot: Math.round(rand() * 360) };
    if (spots.every((o) => Math.hypot(o.x - s.x, (o.y - s.y) * 0.66) > 5)) spots.push(s);
  }
  return spots;
}

function save() {
  try { localStorage.setItem(GAME_KEY, JSON.stringify(current)); } catch { /* ignore */ }
  listeners.forEach((l) => l());
}

/** Individual finds track progression only; rewards are credited on the account per round. */
export function recordMini(scene?: string) {
  current = {
    ...current,
    points: current.points + POINTS_PER_MINI,
    finds: scene ? { ...current.finds, [scene]: (current.finds[scene] ?? 0) + 1 } : current.finds,
  };
  save();
  return POINTS_PER_MINI;
}

/** Unlocks the badge; round points and energy are credited by care_finish_round. */
export function recordComplete() {
  current = { ...current, detective: true };
  save();
  return 0;
}

/** Records a clue spend against the shared wallet; the caller checks affordability first. */
export function recordHintSpend() {
  current = { ...current, hintsSpent: (current.hintsSpent ?? 0) + HINT_COST };
  save();
  return HINT_COST;
}

/** Read-only snapshot of the current game state. */
export function gameStateSnapshot(): GameState {
  return current;
}
let loaded = false;
const listeners = new Set<() => void>();

/** Legacy scoring uses the same frugal round value, without time or hint multipliers. */
export function scoreFind(_seconds: number, _usedHint: boolean) {
  return 5;
}

export function recordFind(scene: string, seconds: number, usedHint: boolean) {
  const pts = scoreFind(seconds, usedHint);
  const prev = current.best[scene];
  current = {
    ...current,
    detective: true,
    finds: current.finds,
    best: { ...current.best, [scene]: prev === undefined ? seconds : Math.min(prev, seconds) },
  };
  try { localStorage.setItem(GAME_KEY, JSON.stringify(current)); } catch { /* ignore */ }
  listeners.forEach((l) => l());
  return 0;
}

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const p = JSON.parse(localStorage.getItem(GAME_KEY) ?? "null");
    if (p && typeof p.points === "number") { current = { ...EMPTY, ...p }; listeners.forEach((l) => l()); }
  } catch { /* ignore */ }
}

export function useGame() {
  const s = useSyncExternalStore((cb) => { listeners.add(cb); return () => listeners.delete(cb); }, () => current, () => EMPTY);
  useEffect(load, []);
  return s;
}

/** +100 once per weekly episode finished; returns 0 if already claimed. */
export function recordChapterComplete(episode: number, bonus = 100) {
  const done = (current as GameState & { episodes?: number[] }).episodes ?? [];
  if (done.includes(episode)) return 0;
  current = { ...current, points: current.points + bonus, episodes: [...done, episode] } as GameState;
  save();
  return bonus;
}

export const JIGSAW_BONUS = 5;
/** Jigsaw levels unlock in order: Easy is always open; each finished level opens the next. */
export const JIGSAW_LEVELS = [3, 4, 5, 6] as const;
export function allJigsawsComplete(state: GameState) {
  return JIGSAW_LEVELS.every((size) => (state.jigsaws ?? []).includes(size));
}
export function jigsawUnlocked(size: number, state: GameState = current) {
  const index = JIGSAW_LEVELS.indexOf(size as (typeof JIGSAW_LEVELS)[number]);
  if (index <= 0) return index === 0;
  const previous = JIGSAW_LEVELS[index - 1];
  return previous !== undefined && (state.jigsaws ?? []).includes(previous);
}
/** Remembers puzzle progression only; account care rewards supply points and energy. */
export function recordJigsaw(size?: number) {
  const done = current.jigsaws ?? [];
  current = { ...current, jigsaws: size !== undefined && !done.includes(size) ? [...done, size] : done };
  save();
  return 0;
}

/** True when every piece sits in its home slot. */
export function jigsawSolved(order: number[]) {
  return order.every((p, i) => p === i);
}

/** Slots whose piece already sits in its home slot; the board may not move these again. */
export function lockedSlots(order: number[]) {
  const locked = new Set<number>();
  order.forEach((p, i) => { if (p === i) locked.add(i); });
  return locked;
}

/** Random order that is never already solved. */
export function shufflePieces(n: number, rand: () => number = Math.random) {
  const a = Array.from({ length: n }, (_, i) => i);
  do {
    for (let i = n - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j]!, a[i]!]; }
  } while (n > 1 && jigsawSolved(a));
  return a;
}
