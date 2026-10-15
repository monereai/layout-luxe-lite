import { useEffect, useSyncExternalStore } from "react";

export const GAME_KEY = "monereai-game";
export type GameState = { points: number; detective: boolean; best: Record<string, number> };
const EMPTY: GameState = { points: 0, detective: false, best: {} };

let current = EMPTY;

export const MINI_COUNT = 10;
export const POINTS_PER_MINI = 20;
export const COMPLETION_BONUS = 100;

/** A hidden Mini-Monere: x/y are % of the picture, size is % of its width. */
export type Spot = { x: number; y: number; size: number; rot: number };

/** Ten random, non-overlapping spots inside the picture (kept away from the edges). */
export function makeSpots(rand: () => number = Math.random): Spot[] {
  const spots: Spot[] = [];
  let tries = 0;
  while (spots.length < MINI_COUNT && tries < 2000) {
    tries++;
    const s = { x: 5 + rand() * 90, y: 7 + rand() * 86, size: 3 + rand() * 1.5, rot: Math.round(rand() * 50 - 25) };
    if (spots.every((o) => Math.hypot(o.x - s.x, (o.y - s.y) * 0.66) > 8)) spots.push(s);
  }
  return spots;
}

function save() {
  try { localStorage.setItem(GAME_KEY, JSON.stringify(current)); } catch { /* ignore */ }
  listeners.forEach((l) => l());
}

/** +20 points for one Mini-Monere. */
export function recordMini() {
  current = { ...current, points: current.points + POINTS_PER_MINI };
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
