import { useEffect, useSyncExternalStore } from "react";

export const GAME_KEY = "monereai-game";
export type GameState = { points: number; detective: boolean; best: Record<string, number>; finds: Record<string, number>; mystery?: string; jigsaws?: number[] };
const EMPTY: GameState = { points: 0, detective: false, best: {}, finds: {} };

let current = EMPTY;

export const MINI_COUNT = 10;
export const POINTS_PER_MINI = 20;
export const COMPLETION_BONUS = 100;

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

/** +20 points for one Mini-Monere; counts the find toward the scene it was found in. */
export function recordMini(scene?: string) {
  current = {
    ...current,
    points: current.points + POINTS_PER_MINI,
    finds: scene ? { ...current.finds, [scene]: (current.finds[scene] ?? 0) + 1 } : current.finds,
  };
  save();
  return POINTS_PER_MINI;
}

/** +100 bonus when all ten are found; unlocks the Master Detective badge. */
export function recordComplete() {
  current = { ...current, points: current.points + COMPLETION_BONUS, detective: true };
  save();
  return COMPLETION_BONUS;
}
let loaded = false;
const listeners = new Set<() => void>();

/** Points for a find: 100 base, +5 per second under 60s, halved when a hint was used. */
export function scoreFind(seconds: number, usedHint: boolean) {
  const base = 100 + Math.max(0, 60 - Math.floor(seconds)) * 5;
  return usedHint ? Math.round(base / 2) : base;
}

export function recordFind(scene: string, seconds: number, usedHint: boolean) {
  const pts = scoreFind(seconds, usedHint);
  const prev = current.best[scene];
  current = {
    points: current.points + pts,
    detective: true,
    finds: current.finds,
    best: { ...current.best, [scene]: prev === undefined ? seconds : Math.min(prev, seconds) },
  };
  try { localStorage.setItem(GAME_KEY, JSON.stringify(current)); } catch { /* ignore */ }
  listeners.forEach((l) => l());
  return pts;
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

export const JIGSAW_BONUS = 50;
/** Jigsaw levels unlock in order: Easy is always open; each finished level opens the next. */
export const JIGSAW_LEVELS = [3, 4, 5] as const;
export function jigsawUnlocked(size: number, state: GameState = current) {
  const index = JIGSAW_LEVELS.indexOf(size as (typeof JIGSAW_LEVELS)[number]);
  if (index <= 0) return index === 0;
  return (state.jigsaws ?? []).includes(JIGSAW_LEVELS[index - 1]!);
}
/** +50 Wisdom Points (shop wallet) for each finished jigsaw; remembers the level so the next unlocks. */
export function recordJigsaw(size?: number) {
  const done = current.jigsaws ?? [];
  current = { ...current, points: current.points + JIGSAW_BONUS, jigsaws: size !== undefined && !done.includes(size) ? [...done, size] : done };
  save();
  return JIGSAW_BONUS;
}

/** True when every piece sits in its home slot. */
export function jigsawSolved(order: number[]) {
  return order.every((p, i) => p === i);
}

/** Random order that is never already solved. */
export function shufflePieces(n: number, rand: () => number = Math.random) {
  const a = Array.from({ length: n }, (_, i) => i);
  do {
    for (let i = n - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j]!, a[i]!]; }
  } while (n > 1 && jigsawSolved(a));
  return a;
}
