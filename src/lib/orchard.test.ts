import { describe, expect, it } from "vitest";
import { ELEMENTAL_GATES, FREE_MAZE_ENTRIES_PER_DAY, MAP_TREES, TREE_IDS, canOpenGate, harvestGain, sideWalkable, takeGuestMazeEntry } from "./orchard";
import { walkable, ZONES } from "./treasure";

describe("energy orchards", () => {
  it("Crystal maze entry needs no Energy", () => { expect(canOpenGate(0, "caverns")).toBe(true); expect(canOpenGate(49, "caverns")).toBe(true); });
  it("the Leaf Gate is removed, so no elemental gate leads to the grove", () => { expect(ELEMENTAL_GATES.some(g => g.target === "grove")).toBe(false); expect(ELEMENTAL_GATES.map(g => g.target)).toEqual(["caverns"]); });
  it("trees give 25 energy capped at 100", () => { expect(harvestGain(10)).toBe(25); expect(harvestGain(90)).toBe(10); expect(harvestGain(100)).toBe(0); });
  it("trees block walking", () => { expect(sideWalkable("grove", { x: 3, y: 1 })).toBe(false); expect(sideWalkable("grove", { x: 2, y: 1 })).toBe(true); });
  it("every main land has a harvestable tree on a walkable tile", () => {
    for (const z of ZONES) {
      const tree = MAP_TREES.find(t => t.zone === z.id);
      expect(tree, z.id).toBeDefined();
      expect(walkable(z.id, tree!.at.x, tree!.at.y)).toBe(true);
    }
    expect(MAP_TREES.map(t => t.id).every(id => TREE_IDS.includes(id))).toBe(true);
  });
});

describe("free maze entry limit", () => {
  const fakeStorage = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) }; };
  it("allows exactly 2 guest entries per UTC day, then refuses", () => {
    const s = fakeStorage();
    expect(takeGuestMazeEntry("2026-10-24", s)).toBe(true);
    expect(takeGuestMazeEntry("2026-10-24", s)).toBe(true);
    expect(takeGuestMazeEntry("2026-10-24", s)).toBe(false);
    expect(FREE_MAZE_ENTRIES_PER_DAY).toBe(2);
  });
  it("resets on a new UTC day", () => {
    const s = fakeStorage();
    takeGuestMazeEntry("2026-10-24", s); takeGuestMazeEntry("2026-10-24", s);
    expect(takeGuestMazeEntry("2026-10-25", s)).toBe(true);
  });
});

import { SIDE_ZONES as SZ, sideWalkable as sw, sideHazard as sh } from "./orchard";
test("side land entrances are safe and every tree is reachable", () => {
  for (const z of ["grove", "caverns"] as const) {
    expect(sw(z, SZ[z].start) && !sh(z, SZ[z].start)).toBe(true);
    for (const t of SZ[z].trees) expect(([[1,0],[-1,0],[0,1],[0,-1]] as const).some(([dx,dy]) => sw(z, { x: t.at.x+dx, y: t.at.y+dy }) && !sh(z, { x: t.at.x+dx, y: t.at.y+dy }))).toBe(true);
  }
});
