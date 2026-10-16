import { describe, expect, it } from "vitest";
import { clampCharacterZoom, INITIAL_CHARACTER_VIEW, tiltCharacter, wheelCharacterZoom, zoomCharacter } from "@/lib/character-view";

describe("Monere view controls", () => {
  it("clamps zoom to the requested 0.8x minimum", () => {
    expect(clampCharacterZoom(0.1)).toBe(0.8);
  });
  it("clamps zoom to the requested 1.5x maximum", () => {
    expect(clampCharacterZoom(3)).toBe(1.5);
  });
  it("resets to 1x scale and zero rotation", () => {
    expect(INITIAL_CHARACTER_VIEW).toEqual({ scale: 1, rotation: 0, tiltX: 0, x: 0, y: 0 });
  });
  it("limits horizontal tilt to -15 through 15 degrees", () => {
    expect(tiltCharacter(INITIAL_CHARACTER_VIEW, 360, 0).rotation).toBe(15);
    expect(tiltCharacter(INITIAL_CHARACTER_VIEW, -360, 0).rotation).toBe(-15);
    expect(tiltCharacter(INITIAL_CHARACTER_VIEW, 5, 0).rotation).toBe(5);
  });
  it("limits vertical tilt to -10 through 10 degrees", () => {
    expect(tiltCharacter(INITIAL_CHARACTER_VIEW, 0, 90).tiltX).toBe(10);
    expect(tiltCharacter(INITIAL_CHARACTER_VIEW, 0, -90).tiltX).toBe(-10);
  });
  it("normalizes wheel deltas and keeps small trackpad movements gentle", () => {
    expect(wheelCharacterZoom(1, 1, 1)).toBe(wheelCharacterZoom(1, 16, 0));
    expect(wheelCharacterZoom(1, -1, 0)).toBeLessThan(1.01);
  });
  it("keeps the point under the zoom cursor stationary", () => {
    const view = zoomCharacter(INITIAL_CHARACTER_VIEW, 1.5, { x: 60, y: 40 });
    expect(view.x + 60 * view.scale).toBe(60);
    expect(view.y + 40 * view.scale).toBe(40);
  });
});