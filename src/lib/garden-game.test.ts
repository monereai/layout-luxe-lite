import { describe, it, expect } from "vitest";
import { gardenStep, newGarden, canGardenJump, JUMP_COST, GARDEN_ENERGY_REWARD, GARDEN_COIN_REWARD, replayGarden } from "./garden-game";
describe("Vernon’s garden rules", () => {
  it("jumping is free and always allowed", () => { expect(JUMP_COST).toBe(0); expect(gardenStep(newGarden(), "jump").jumps).toBe(1); });
  it("jumping is allowed at any Energy level", () => { expect(canGardenJump(0)).toBe(true); expect(canGardenJump(4)).toBe(true); expect(canGardenJump(100)).toBe(true); });
  it("reset preserves jump spending and collected stats", () => { const s = gardenStep({ ...newGarden(), level: 2, x: 300, jumps: 3, hits: 2 }, "reset"); expect(s.x).toBe(60); expect(s.level).toBe(0); expect(s.jumps).toBe(3); expect(s.hits).toBe(2); });
  it("awards 50 Energy and 20 Coins", () => { expect(GARDEN_ENERGY_REWARD).toBe(50); expect(GARDEN_COIN_REWARD).toBe(20); });
  it("spawns barrels every four and a half seconds", () => { expect(replayGarden(Array(89).fill("idle")).barrels).toHaveLength(0); expect(replayGarden(Array(90).fill("idle")).barrels).toHaveLength(1); });
  it("a hit resets position without resetting stats", () => { const s = gardenStep({ ...newGarden(), x: 300, jumps: 2, barrels: [{ x: 304, level: 0, drop: 0 }] }, "idle"); expect(s.x).toBe(60); expect(s.level).toBe(0); expect(s.jumps).toBe(2); expect(s.hits).toBe(1); });
  it("only the top hopper wins", () => { expect(gardenStep(newGarden(), "idle").won).toBe(false); expect(gardenStep({ ...newGarden(), level: 3, x: 60 }, "idle").won).toBe(true); });
});
it("jump raises Monere over hazards and lands after exactly 700ms", async () => {
  const { gardenPlayerY, GARDEN_TICK_MS } = await import("./garden-game");
  let s = gardenStep(newGarden(), "jump");
  expect(s.jump * GARDEN_TICK_MS).toBe(700);
  for (let i = 0; i < 7; i++) s = gardenStep(s, "idle");
  expect(gardenPlayerY(s)).toBe(386);
  for (let i = 0; i < 7; i++) s = gardenStep(s, "idle");
  expect(s.jump).toBe(0); expect(gardenPlayerY(s)).toBe(450);
});
