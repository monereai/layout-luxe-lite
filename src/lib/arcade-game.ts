/** Fixed-step rules for Connie's 80's arcade fruit catcher, shared by the isolated renderer and authenticated replay. */
export const ARCADE_TICK_MS = 50;
/** Catch this many fruits to win the second scroll. */
export const ARCADE_WIN_CATCHES = 10;
/** Missing this many fruits ends the round (free retry, nothing is charged). */
export const ARCADE_MAX_MISSES = 5;
export const ARCADE_MAX_TICKS = 24000;
export const ARCADE_SPAWN_EVERY = 45;
export const ARCADE_FALL_SPEED = 6;
export const ARCADE_CATCH_Y = 470;
export type ArcadeInput = "idle" | "left" | "right";
export type Fruit = { x: number; y: number; kind: number };
export type ArcadeState = { tick: number; x: number; catches: number; misses: number; spawned: number; fruits: Fruit[]; won: boolean; lost: boolean };
/** Deterministic spawn lane for the n-th fruit — no RNG state, so replays match exactly. */
export function fruitLane(n: number) { return 40 + ((n * 73 + 137) % 520); }
export function newArcade(): ArcadeState { return { tick: 0, x: 300, catches: 0, misses: 0, spawned: 0, fruits: [], won: false, lost: false }; }
export function arcadeStep(old: ArcadeState, input: ArcadeInput): ArcadeState {
  if (old.won || old.lost) return old;
  const s = { ...old, tick: old.tick + 1, fruits: old.fruits.map(f => ({ ...f })) };
  if (input === "left") s.x = Math.max(40, s.x - 8);
  if (input === "right") s.x = Math.min(560, s.x + 8);
  if (s.tick % ARCADE_SPAWN_EVERY === 0) { s.fruits.push({ x: fruitLane(s.spawned), y: 0, kind: s.spawned % 5 }); s.spawned++; }
  const kept: Fruit[] = [];
  for (const f of s.fruits) {
    f.y += ARCADE_FALL_SPEED;
    if (f.y >= ARCADE_CATCH_Y - 20 && f.y <= ARCADE_CATCH_Y + 10 && Math.abs(f.x - s.x) < 34) { s.catches++; continue; }
    if (f.y > 510) { s.misses++; continue; }
    kept.push(f);
  }
  s.fruits = kept;
  s.won = s.catches >= ARCADE_WIN_CATCHES;
  s.lost = !s.won && s.misses >= ARCADE_MAX_MISSES;
  return s;
}
export function replayArcade(trace: ArcadeInput[]) { return trace.reduce(arcadeStep, newArcade()); }
