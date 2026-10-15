import { useEffect, useSyncExternalStore } from "react";

export const GAME_KEY = "monereai-game";
export type GameState = { points: number; detective: boolean; best: Record<string, number> };
const EMPTY: GameState = { points: 0, detective: false, best: {} };

let current = EMPTY;

export const GRID_SIZE = 8;
export const MINI_COUNT = 10;
export const DECOY_COUNT = 3;
export const POINTS_PER_MINI = 20;
export const COMPLETION_BONUS = 100;

export type TileKind = "mini" | "decoy" | "empty";
export type Tile = { kind: TileKind; obstacle: number };

/** Fresh shuffled grid: exactly MINI_COUNT minis and DECOY_COUNT decoys, rest empty; each tile gets an obstacle index. */
export function makeGrid(obstacleCount: number, rand: () => number = Math.random): Tile[] {
  const total = GRID_SIZE * GRID_SIZE;
  const kinds: TileKind[] = Array.from({ length: total }, (_, i) =>
    i < MINI_COUNT ? "mini" : i < MINI_COUNT + DECOY_COUNT ? "decoy" : "empty");
  for (let i = kinds.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [kinds[i], kinds[j]] = [kinds[j]!, kinds[i]!];
  }
  return kinds.map((kind) => ({ kind, obstacle: Math.floor(rand() * obstacleCount) }));
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
