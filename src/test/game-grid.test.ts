import { describe, expect, it } from "vitest";
import { COMPLETION_BONUS, DECOY_COUNT, GRID_SIZE, MINI_COUNT, POINTS_PER_MINI, makeGrid } from "@/lib/game";

describe("Find Monere grid", () => {
  it("is 8x8 with exactly 10 minis and 3 decoys", () => {
    const g = makeGrid(6);
    expect(GRID_SIZE * GRID_SIZE).toBe(64);
    expect(g).toHaveLength(64);
    expect(g.filter((t) => t.kind === "mini")).toHaveLength(MINI_COUNT);
    expect(MINI_COUNT).toBe(10);
    expect(g.filter((t) => t.kind === "decoy")).toHaveLength(DECOY_COUNT);
    expect(DECOY_COUNT).toBe(3);
  });
  it("awards 20 per mini and a 100 completion bonus", () => {
    expect(POINTS_PER_MINI).toBe(20);
    expect(COMPLETION_BONUS).toBe(100);
    expect(MINI_COUNT * POINTS_PER_MINI + COMPLETION_BONUS).toBe(300);
  });
  it("reshuffles between rounds", () => {
    const a = makeGrid(6).map((t) => t.kind).join();
    const b = makeGrid(6).map((t) => t.kind).join();
    const c = makeGrid(6).map((t) => t.kind).join();
    expect(a === b && b === c).toBe(false);
  });
});
