import { describe, expect, it } from "vitest";
import { DOT_ENERGY, SUN_ENERGY, MAZE_TICK_MS, POWER_MS, MAZE_START, cellId, depositEnergy, mazeCells, mazeStep, newMaze, powerActive, replayMaze } from "./harvest-maze";
describe("orchard maze rules", () => {
  it("each unique dot gives exactly 2 Energy", () => { let s = mazeStep(newMaze(), "left"); expect(s.energy).toBe(2); s = mazeStep(s, "right"); expect(s.energy).toBe(2); expect(DOT_ENERGY).toBe(2); });
  it("has exactly four Suns, each worth 10 Energy", () => { expect(mazeCells.filter(c => c.sun)).toHaveLength(4); const s = mazeStep({ ...newMaze(), player: { x: 2, y: 1 }, chasers: [] }, "left"); expect(s.energy).toBe(10); expect(SUN_ENERGY).toBe(10); });
  it("Sun power lasts exactly five seconds", () => { const s = mazeStep({ ...newMaze(), player: { x: 2, y: 1 }, chasers: [] }, "left"); expect((s.powerUntil - s.tick) * MAZE_TICK_MS).toBe(5000); expect(POWER_MS).toBe(5000); expect(powerActive({ ...s, tick: s.powerUntil - 1 })).toBe(true); expect(powerActive({ ...s, tick: s.powerUntil })).toBe(false); });
  it("a catch expels Monere without losing harvested Energy", () => { const s = mazeStep({ ...newMaze(), energy: 12, chasers: [{ x: MAZE_START.x - 1, y: MAZE_START.y }] }, "left"); expect(s.ended).toBe("expelled"); expect(s.energy).toBe(14); expect(depositEnergy(50, s.energy)).toBe(14); });
  it("power prevents expulsion and chasers retreat", () => { const s = mazeStep({ ...newMaze(), player: { x: 2, y: 1 }, chasers: [{ x: 1, y: 1 }, { x: 3, y: 1 }], powerUntil: 25 }, "idle"); expect(s.ended).toBeNull(); expect(s.chasers[1]).toEqual({ x: 4, y: 1 }); });
  it("walls block movement and rewards cannot be duplicated", () => { const s = mazeStep(newMaze(), "down"); expect(s.player).toEqual(MAZE_START); expect(s.collected).toEqual([cellId(MAZE_START)]); expect(s.energy).toBe(0); });
  it("deposits cap the shared Energy bar at 100", () => { expect(depositEnergy(96, 24)).toBe(4); expect(depositEnergy(100, 24)).toBe(0); });
  it("server replay stops at collision and rejects later moves", () => { const trace = Array(200).fill("idle"); expect(() => replayMaze(trace)).toThrow("already ended"); });
});