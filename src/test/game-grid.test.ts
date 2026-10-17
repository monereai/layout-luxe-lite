import { describe, expect, it } from "vitest";
import { COMPLETION_BONUS, MINI_COUNT, POINTS_PER_MINI, makeSpots } from "@/lib/game";

describe("Find Monere picture hunt", () => {
  it("hides exactly 10 Mini-Moneres inside the picture", () => {
    const s = makeSpots();
    expect(MINI_COUNT).toBe(10);
    expect(s).toHaveLength(10);
    for (const p of s) {
      expect(p.x).toBeGreaterThan(0);
      expect(p.x).toBeLessThan(100);
      expect(p.y).toBeGreaterThan(0);
      expect(p.y).toBeLessThan(100);
    }
  });
  it("awards no points per mini and only 5 for a completed round", () => {
    expect(POINTS_PER_MINI).toBe(0);
    expect(COMPLETION_BONUS).toBe(5);
    expect(MINI_COUNT * POINTS_PER_MINI + COMPLETION_BONUS).toBe(5);
  });
  it("reshuffles spots between rounds", () => {
    expect(JSON.stringify(makeSpots())).not.toBe(JSON.stringify(makeSpots()));
  });
  it("keeps Mini-Moneres small so they are hard to spot", () => {
    for (const p of makeSpots()) {
      expect(p.size).toBeGreaterThanOrEqual(2);
      expect(p.size).toBeLessThanOrEqual(3.2);
    }
  });
});
