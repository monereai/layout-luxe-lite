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
  it("awards 20 per mini and a 100 completion bonus", () => {
    expect(POINTS_PER_MINI).toBe(20);
    expect(COMPLETION_BONUS).toBe(100);
    expect(MINI_COUNT * POINTS_PER_MINI + COMPLETION_BONUS).toBe(300);
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
