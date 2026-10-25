/** Fixed-step rules shared by the isolated renderer and authenticated replay. */
export const GARDEN_TICK_MS = 50;
/** Every accepted Barn Climb jump spends shared Energy. */
export const JUMP_COST = 5;
/** A jump lasts 700ms and peaks high enough to clear a rolling barrel. */
export const JUMP_TICKS = 14;
export const JUMP_HEIGHT = 64;
export const canGardenJump = (energy: number) => Number.isFinite(energy) && energy >= JUMP_COST;
export const GARDEN_ENERGY_REWARD = 50;
export const GARDEN_COIN_REWARD = 20;
export const PLATFORM_Y = [450, 330, 210, 90];
export const LADDERS = [490, 110, 490];
export type GardenInput = "idle" | "left" | "right" | "up" | "down" | "jump" | "reset";
export type Barrel = { x: number; level: number; drop: number };
export type GardenState = { tick: number; x: number; level: number; climb: number; jump: number; jumps: number; hits: number; won: boolean; barrels: Barrel[] };
export function newGarden(): GardenState { return { tick: 0, x: 60, level: 0, climb: 0, jump: 0, jumps: 0, hits: 0, won: false, barrels: [] }; }
export function gardenStep(old: GardenState, input: GardenInput): GardenState {
  if (old.won) return old;
  const s = { ...old, tick: old.tick + 1, barrels: old.barrels.map(b => ({ ...b })) };
  if (input === "reset") { s.x = 60; s.level = 0; s.climb = 0; s.jump = 0; }
  if (input === "jump" && !s.jump && !s.climb) { s.jump = JUMP_TICKS; s.jumps++; }
  else s.jump = Math.max(0, s.jump - 1);
  if (!s.climb) {
    if (input === "left") s.x = Math.max(40, s.x - 6);
    if (input === "right") s.x = Math.min(560, s.x + 6);
    if (!s.jump && input === "up" && s.level < 3 && Math.abs(s.x - (LADDERS[s.level] ?? 0)) <= 14) s.climb = 1;
    if (!s.jump && input === "down" && s.level > 0 && Math.abs(s.x - (LADDERS[s.level - 1] ?? 0)) <= 14) s.climb = -1;
  } else if ((s.climb > 0 && input === "up") || (s.climb < 0 && input === "down")) {
    s.climb += Math.sign(s.climb);
    if (Math.abs(s.climb) >= 21) { s.level += Math.sign(s.climb); s.climb = 0; }
  }
  if (s.tick % 90 === 0) s.barrels.push({ x: 42, level: 3, drop: 0 });
  for (const b of s.barrels) {
    if (b.drop) { b.drop++; if (b.drop >= 21) { b.level--; b.drop = 0; } }
    else {
      const dir = b.level % 2 ? 1 : -1;
      b.x += dir * 3.6;
      if (b.level > 0 && Math.abs(b.x - (LADDERS[b.level - 1] ?? 0)) <= 4) { b.x = LADDERS[b.level - 1] ?? b.x; b.drop = 1; }
    }
  }
  s.barrels = s.barrels.filter(b => b.x >= 20 && b.x <= 580);
  const py = gardenPlayerY(s);
  if (s.barrels.some(b => Math.abs(b.x - s.x) < 18 && Math.abs(gardenBarrelY(b) - py) < 22)) {
    s.x = 60; s.level = 0; s.climb = 0; s.jump = 0; s.hits++;
  }
  s.won = s.level === 3 && !s.climb && s.x <= 85;
  return s;
}
export function gardenPlayerY(s: GardenState) { return (PLATFORM_Y[s.level] ?? 450) - Math.sign(s.climb) * Math.abs(s.climb) * 6 - (s.jump ? Math.sin(s.jump / JUMP_TICKS * Math.PI) * JUMP_HEIGHT : 0); }
export function gardenBarrelY(b: Barrel) { return (PLATFORM_Y[b.level] ?? 450) + b.drop * 6; }
export function replayGarden(trace: GardenInput[]) { return trace.reduce(gardenStep, newGarden()); }