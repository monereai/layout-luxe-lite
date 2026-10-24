import { describe, it, expect } from "vitest";
import { stepStamina } from "./movement";
describe("sprint stamina", () => {
  it("drains while sprinting", () => expect(stepStamina(100, true, false, 1)).toBe(65));
  it("recharges when idle, capped at 100", () => { expect(stepStamina(50, false, true, 1)).toBe(75); expect(stepStamina(90, false, true, 1)).toBe(100); });
  it("holds while walking and never goes negative", () => { expect(stepStamina(40, false, false, 1)).toBe(40); expect(stepStamina(10, true, false, 1)).toBe(0); });
});
