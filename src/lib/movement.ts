export const SPRINT_MULTIPLIER = 1.5;
export const SPRINT_ENERGY_PER_SECOND = 1;
export const DASH_ENERGY = 5;
export const CORNER_MARGIN = 10;
export type Vector = { x: number; y: number };
/** Exponential velocity easing is independent of rendering frame rate. */
export function easeVelocity(current: number, target: number, seconds: number) {
  const rate = Math.abs(target) > Math.abs(current) ? 12 : 18;
  return current + (target - current) * (1 - Math.exp(-Math.max(0, seconds) * rate));
}
export function easeVector(current: Vector, target: Vector, seconds: number): Vector {
  return { x: easeVelocity(current.x, target.x, seconds), y: easeVelocity(current.y, target.y, seconds) };
}
/** A turn is buffered at a nearby tile edge, never by cutting through a wall. */
export function cornerTurn(position: Vector, center: Vector, input: Vector, open: (x: number, y: number) => boolean, tileSize: number): Vector | null {
  if (Math.hypot(position.x - center.x, position.y - center.y) > CORNER_MARGIN) return null;
  return slideDirection({ x: Math.floor(center.x / tileSize), y: Math.floor(center.y / tileSize) }, input, open);
}
export function boostRetryDelay(mode: "sprint" | "dash") { return mode === "sprint" ? 1000 : 500; }
export function slideDirection(at: Vector, input: Vector, open: (x: number, y: number) => boolean): Vector | null {
  const candidates = input.x ? [{ x: input.x, y: 0 }, ...(input.y ? [{ x: 0, y: input.y }] : [])] : [{ x: 0, y: input.y }];
  return candidates.find(d => (d.x || d.y) && open(at.x + d.x, at.y + d.y)) ?? null;
}
/** Smooth along a validated corridor, never extrapolate past its endpoint. */
export function advanceAlong(current: Vector, target: Vector, speed: number, seconds: number): Vector {
  const dx = target.x - current.x, dy = target.y - current.y, distance = Math.hypot(dx, dy);
  if (!distance) return { ...target };
  const travel = Math.min(distance, Math.max(0, speed) * Math.max(0, seconds));
  return { x: current.x + dx / distance * travel, y: current.y + dy / distance * travel };
}