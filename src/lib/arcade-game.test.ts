import { expect, it } from "vitest";
import { ARCADE_MAX_MISSES, ARCADE_MAX_TICKS, ARCADE_SPAWN_EVERY, ARCADE_WIN_CATCHES, arcadeStep, fruitLane, newArcade, replayArcade, type ArcadeInput } from "./arcade-game";

/** Greedy pilot: steer under the lowest falling fruit every tick. */
function winningTrace(): ArcadeInput[] {
  let s = newArcade();
  const trace: ArcadeInput[] = [];
  while (!s.won && !s.lost && trace.length < ARCADE_MAX_TICKS) {
    const target = s.fruits.length ? s.fruits.reduce((a, b) => (b.y > a.y ? b : a)).x : s.x;
    const input: ArcadeInput = target > s.x + 4 ? "right" : target < s.x - 4 ? "left" : "idle";
    trace.push(input);
    s = arcadeStep(s, input);
  }
  return trace;
}

it("fruits spawn on a fixed cadence at deterministic lanes", () => {
  let s = newArcade();
  for (let i = 0; i < ARCADE_SPAWN_EVERY; i++) s = arcadeStep(s, "idle");
  expect(s.fruits).toHaveLength(1);
  expect(s.fruits[0]!.x).toBe(fruitLane(0));
  for (let i = 0; i < ARCADE_SPAWN_EVERY; i++) s = arcadeStep(s, "idle");
  expect(s.spawned).toBe(2);
  expect(s.fruits[1]!.x).toBe(fruitLane(1));
});

it("a fruit is caught when Monere stands under it at the catch line", () => {
  let s = { ...newArcade(), x: 300, fruits: [{ x: 310, y: 446, kind: 0 }] };
  s = arcadeStep(s, "idle");
  expect(s.catches).toBe(1);
  expect(s.fruits).toHaveLength(0);
});

it("a fruit is missed when it falls past away from Monere", () => {
  let s = { ...newArcade(), x: 60, fruits: [{ x: 500, y: 506, kind: 0 }] };
  s = arcadeStep(s, "idle");
  expect(s.misses).toBe(1);
});

it("movement is clamped to the arcade floor", () => {
  let s = newArcade();
  for (let i = 0; i < 100; i++) s = arcadeStep(s, "left");
  expect(s.x).toBe(40);
  for (let i = 0; i < 200; i++) s = arcadeStep(s, "right");
  expect(s.x).toBe(560);
});

it("catching ten fruits wins the round", () => {
  const trace = winningTrace();
  const s = replayArcade(trace);
  expect(s.won).toBe(true);
  expect(s.catches).toBe(ARCADE_WIN_CATCHES);
  expect(s.lost).toBe(false);
});

it("missing five fruits loses the round and freezes the state", () => {
  let s = newArcade();
  const trace: ArcadeInput[] = [];
  while (!s.lost && trace.length < ARCADE_MAX_TICKS) { trace.push("idle"); s = arcadeStep(s, "idle"); }
  expect(s.lost).toBe(true);
  expect(s.misses).toBe(ARCADE_MAX_MISSES);
  const frozen = arcadeStep(s, "right");
  expect(frozen.tick).toBe(s.tick);
});

it("replaying the same trace always produces the same result", () => {
  const trace = winningTrace();
  expect(replayArcade(trace)).toEqual(replayArcade(trace));
});
