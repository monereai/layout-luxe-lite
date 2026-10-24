export const SPRINT_MULTIPLIER = 1.5;
export const WALK_FRAME_MS = 120;
/** Pose timing is separate from the eight directional artwork frames. */
export function walkPose(elapsedMs: number, active: boolean) {
  return active ? Math.floor(Math.max(0, elapsedMs) / WALK_FRAME_MS) % 4 : 0;
}
export function walkBounce(timeSeconds: number, moving: boolean) {
  return moving ? Math.sin(timeSeconds * 12) * 3 : 0;
}
/** Visible hop with squash on landing and stretch at the top; neutral when idle. */
export function walkHop(timeSeconds: number, moving: boolean) {
  if (!moving) return { y: 0, sx: 1, sy: 1 };
  const h = Math.abs(Math.sin(timeSeconds * 9));
  return { y: -h * 7, sx: 1 + (1 - h) * 0.06 - h * 0.03, sy: 1 - (1 - h) * 0.06 + h * 0.04 };
}
export function sprintActive(shift: boolean, moving: boolean, energy: number, stamina: number, paidUntil: number, now: number) {
  return shift && moving && energy > 0 && stamina > 0 && now < paidUntil;
}
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
}export const STAMINA_MAX = 100, STAMINA_DRAIN_PER_SECOND = 35, STAMINA_RECHARGE_PER_SECOND = 25;
/** Sprint stamina drains while Shift sprinting and recharges only while idle. */
export function stepStamina(stamina: number, sprinting: boolean, idle: boolean, seconds: number) {
  const t = Math.max(0, seconds);
  const next = sprinting ? stamina - STAMINA_DRAIN_PER_SECOND * t : idle ? stamina + STAMINA_RECHARGE_PER_SECOND * t : stamina;
  return Math.min(STAMINA_MAX, Math.max(0, next));
}
