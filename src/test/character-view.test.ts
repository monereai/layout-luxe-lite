import { describe, expect, it } from "vitest";
import { clampCharacterZoom, INITIAL_CHARACTER_VIEW, characterFrame, rotateCharacter, wheelCharacterZoom, zoomCharacter } from "@/lib/character-view";

describe("Monere view controls", () => {
  it("maps every drag angle onto one of the eight centered sprites", () => {
    expect(characterFrame(15)).toBe(0);
    expect(characterFrame(60)).toBe(1);
    expect(characterFrame(90)).toBe(2);
    expect(characterFrame(180)).toBe(4);
    expect(characterFrame(-15)).toBe(0);
  });
  it("clamps zoom to the requested 0.7x minimum", () => {
    expect(clampCharacterZoom(0.1)).toBe(0.7);
  });
  it("clamps zoom to the requested 1.5x maximum", () => {
    expect(clampCharacterZoom(3)).toBe(1.5);
  });
  it("resets to 1x scale and zero rotation", () => {
    expect(INITIAL_CHARACTER_VIEW).toEqual({ scale: 1, rotation: 0, tiltX: 0, x: 0, y: 0 });
  });
  it("supports a full 360 degree drag in either direction", () => {
    expect(rotateCharacter(0, 400, 400)).toBe(360);
    expect(rotateCharacter(0, -400, 400)).toBe(-360);
  });
  it("shows side and back frames instead of flattening at 90 and 180 degrees", () => {
    expect(characterFrame(90)).toBe(2);
    expect(characterFrame(180)).toBe(4);
    expect(characterFrame(270)).toBe(6);
    expect(characterFrame(360)).toBe(0);
    expect(characterFrame(-90)).toBe(6);
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