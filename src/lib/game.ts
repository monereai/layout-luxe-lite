import { useEffect, useSyncExternalStore } from "react";

export const GAME_KEY = "monereai-game";
export type GameState = { points: number; detective: boolean; best: Record<string, number> };
const EMPTY: GameState = { points: 0, detective: false, best: {} };

let current = EMPTY;
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
