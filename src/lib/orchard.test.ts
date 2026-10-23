import { describe, expect, it } from "vitest";
import { canOpenGate, harvestGain, sideWalkable } from "./orchard";

describe("energy orchards", () => {
  it("gates need 50 energy", () => { expect(canOpenGate(49)).toBe(false); expect(canOpenGate(50)).toBe(true); });
  it("trees give 25 energy capped at 100", () => { expect(harvestGain(10)).toBe(25); expect(harvestGain(90)).toBe(10); expect(harvestGain(100)).toBe(0); });
  it("trees block walking", () => { expect(sideWalkable("grove", { x: 3, y: 1 })).toBe(false); expect(sideWalkable("grove", { x: 2, y: 1 })).toBe(true); });
});
