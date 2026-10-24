export type HuntSpot = { zone: "meadow" | "wood" | "ravine"; x: number; y: number; clue: string };
/** All spots are outside gear-locked terrain; three key fragments never gate explorer gear. */
export const HUNT_POOL: HuntSpot[] = [
  { zone: "meadow", x: 4, y: 5, clue: "among the north-west meadow bushes" },
  { zone: "meadow", x: 8, y: 16, clue: "in the south-west meadow grass" },
  { zone: "meadow", x: 18, y: 15, clue: "beside the south-east meadow flowers" },
  { zone: "meadow", x: 17, y: 7, clue: "east of Barnaby in the meadow" },
  { zone: "wood", x: 5, y: 7, clue: "among the trees west of Pippa" },
  { zone: "wood", x: 12, y: 8, clue: "in a hollow log east of Pippa" },
  { zone: "wood", x: 10, y: 5, clue: "under the northern woodland leaves" },
  { zone: "wood", x: 19, y: 9, clue: "near the eastern woodland trail" },
  { zone: "ravine", x: 5, y: 7, clue: "beneath stones near the ravine entrance" },
  { zone: "ravine", x: 9, y: 8, clue: "north-west of the ravine bridge" },
  { zone: "ravine", x: 18, y: 18, clue: "among rocks south-east of the ravine bridge" },
  { zone: "ravine", x: 14, y: 16, clue: "east of the ravine bridge" },
];
export function drawHuntSpots(random: () => number = Math.random, previous: number[] = [], unlocked: readonly string[] = ["meadow", "wood", "ravine"]): number[] {
  const pool = HUNT_POOL.map((_, i) => i).filter(i => unlocked.includes(HUNT_POOL[i]?.zone ?? "") && !previous.includes(i));
  if (pool.length < 3) pool.push(...HUNT_POOL.map((_, i) => i).filter(i => unlocked.includes(HUNT_POOL[i]?.zone ?? "") && !pool.includes(i)));
  const result: number[] = [];
  while (result.length < 3 && pool.length) { const index = Math.min(pool.length - 1, Math.max(0, Math.floor(random() * pool.length))); const picked = pool.splice(index, 1)[0]; if (picked !== undefined) result.push(picked); }
  return result;
}
export function validHuntSpots(value: unknown): number[] | null {
  return Array.isArray(value) && value.length === 3 && new Set(value).size === 3 && value.every(v => Number.isInteger(v) && v >= 0 && v < HUNT_POOL.length) ? [...value] : null;
}