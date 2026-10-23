import type { Position, ZoneId } from "./treasure";

export const MAZE = [
  "###############", "#o....#.#....o#", "#.##.#...#.##.#", "#....#.#.#....#",
  "###.##.#.##.###", "#......#......#", "#.###.....###.#", "#...#.#.#.#...#",
  "#.#...#.#...#.#", "#.###.....###.#", "#......#......#", "#o...#...#...o#", "###############",
] as const;
export const MAZE_TICK_MS = 200;
export const POWER_MS = 5000;
export const DOT_ENERGY = 2, SUN_ENERGY = 10;
export const MAZE_START = { x: 7, y: 11 };
export const MAP_ENTRANCES: Record<ZoneId, Position> = { meadow: { x: 10, y: 12 }, wood: { x: 3, y: 10 }, ravine: { x: 3, y: 6 }, lair: { x: 12, y: 19 } };
export type MazeDirection = "up" | "down" | "left" | "right" | "idle";
export type MazeState = { player: Position; chasers: Position[]; collected: number[]; energy: number; tick: number; powerUntil: number; ended: "expelled" | "complete" | null };
export const cellId = (p: Position) => p.y * 15 + p.x;
export const mazeWalkable = (p: Position) => MAZE[p.y]?.[p.x] !== undefined && MAZE[p.y]?.[p.x] !== "#";
export const mazeCells = MAZE.flatMap((row, y) => [...row].flatMap((c, x) => c === "#" ? [] : [{ x, y, sun: c === "o" }]));
export const newMaze = (): MazeState => ({ player: { ...MAZE_START }, chasers: [{ x: 7, y: 1 }, { x: 1, y: 5 }, { x: 13, y: 5 }], collected: [cellId(MAZE_START)], energy: 0, tick: 0, powerUntil: 0, ended: null });
const delta: Record<MazeDirection, Position> = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 }, idle: { x: 0, y: 0 } };
const equal = (a: Position, b: Position) => a.x === b.x && a.y === b.y;
const neighbors = (p: Position) => ["up", "left", "down", "right"].map(d => delta[d as MazeDirection]).map(d => ({ x: p.x + d.x, y: p.y + d.y })).filter(mazeWalkable);
/** Breadth-first corridor distances drive both pursuit and retreat. */
function distances(p: Position) {
  const out = new Map<number, number>([[cellId(p), 0]]); const queue = [p];
  for (let i = 0; i < queue.length; i++) { const cur = queue[i]; if (!cur) continue; for (const n of neighbors(cur)) if (!out.has(cellId(n))) { out.set(cellId(n), (out.get(cellId(cur)) ?? 0) + 1); queue.push(n); } }
  return out;
}
export const powerActive = (s: MazeState) => s.tick < s.powerUntil;
/** Deterministic fixed-step simulation, replayed server-side; never accepts a client reward total. */
export function mazeStep(s: MazeState, direction: MazeDirection): MazeState {
  if (s.ended) return s;
  const tick = s.tick + 1, d = delta[direction]; const next = { x: s.player.x + d.x, y: s.player.y + d.y };
  const player = mazeWalkable(next) ? next : s.player;
  const id = cellId(player), fresh = !s.collected.includes(id), sun = MAZE[player.y]?.[player.x] === "o";
  const collected = fresh ? [...s.collected, id] : s.collected;
  const energy = s.energy + (fresh ? sun ? SUN_ENERGY : DOT_ENERGY : 0);
  const powerUntil = fresh && sun ? tick + POWER_MS / MAZE_TICK_MS : s.powerUntil;
  const powered = tick < powerUntil;
  let caught = !powered && s.chasers.some(c => equal(c, player));
  const dist = distances(player);
  const chasers = s.chasers.map((c, i) => {
    if (tick % 3 !== i) return c;
    const candidates = neighbors(c).sort((a, b) => powered ? (dist.get(cellId(b)) ?? 0) - (dist.get(cellId(a)) ?? 0) : (dist.get(cellId(a)) ?? 999) - (dist.get(cellId(b)) ?? 999));
    return candidates[0] ?? c;
  });
  caught ||= !powered && chasers.some(c => equal(c, player));
  return { player, chasers, collected, energy, tick, powerUntil, ended: caught ? "expelled" : collected.length === mazeCells.length ? "complete" : null };
}
export function replayMaze(trace: MazeDirection[]) {
  let s = newMaze();
  for (const d of trace) { if (s.ended) throw new Error("The harvest has already ended."); s = mazeStep(s, d); }
  return s;
}
export const depositEnergy = (current: number, collected: number) => Math.max(0, Math.min(collected, 100 - current));