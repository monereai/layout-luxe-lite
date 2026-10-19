import { describe, expect, it } from "vitest";
import { INITIAL_ENERGY, MINI_ENERGY, GAME_ENERGY, GAME_POINTS, FULL_ENERGY_BONUS, addEnergy, drainEnergy, canClaimCare, dailyAllowance, energyGain, careSchema } from "@/lib/care";
import { gameStateSnapshot, recordComplete, recordJigsaw, recordMini } from "@/lib/game";

describe("Frugal care economy", () => {
  it("starts at 50 energy", () => expect(INITIAL_ENERGY).toBe(50));
  it("each Mini-Monere gives five energy", () => {
    expect(MINI_ENERGY).toBe(5);
    expect(addEnergy(50, MINI_ENERGY)).toBe(55);
  });
  it("a Mini-Monere cannot overfill energy", () => {
    expect(addEnergy(99, MINI_ENERGY)).toBe(100);
    expect(addEnergy(100, MINI_ENERGY)).toBe(100);
  });
  it("drains 10 per whole hour and preserves partial hours", () => {
    expect(drainEnergy(50, 0, 5_400_000)).toEqual({ energy: 40, lastDrain: 3_600_000 });
    expect(drainEnergy(40, 3_600_000, 7_200_000)).toEqual({ energy: 30, lastDrain: 7_200_000 });
  });
  it("never drains below zero or drains before an hour", () => {
    expect(drainEnergy(5, 0, 3_600_000).energy).toBe(0);
    expect(drainEnergy(50, 0, 3_599_999).energy).toBe(50);
  });
  it("a completion gives exactly 5 energy and a win gives 5 points", () => {
    expect(GAME_ENERGY).toBe(5); expect(GAME_POINTS).toBe(5);
    expect(addEnergy(50, GAME_ENERGY)).toBe(55);
  });
  it("caps energy at 100 without banking excess", () => {
    expect(addEnergy(99, GAME_ENERGY)).toBe(100);
    expect(addEnergy(100, GAME_ENERGY)).toBe(100);
    expect(addEnergy(drainEnergy(100, 0, 3_600_000).energy, GAME_ENERGY)).toBe(95);
  });
  it("requires full energy to claim", () => {
    expect(canClaimCare(99, false, null, "2026-10-17")).toBe(false);
    expect(canClaimCare(100, false, null, "2026-10-17")).toBe(true);
  });
  it("allows just one claim per UTC date then unlocks tomorrow", () => {
    expect(canClaimCare(100, true, "2026-10-17", "2026-10-17")).toBe(false);
    expect(canClaimCare(100, true, "2026-10-17", "2026-10-18")).toBe(true);
  });
  it("claim date still blocks a reward when a stale claimed flag is false", () => {
    expect(canClaimCare(100, false, "2026-10-17", "2026-10-17")).toBe(false);
  });
  it("pays exactly 100 free, 200 plus or 300 club", () => {
    expect(dailyAllowance("free")).toBe(100); expect(dailyAllowance("plus")).toBe(200); expect(dailyAllowance("club")).toBe(300);
  });
  it("full energy retains 100 without automatic points", () => {
    expect(FULL_ENERGY_BONUS).toBe(0);
    const state = careSchema.parse({ energy: 100, lastDrain: "x", claimed: false, claimDate: null, tokens: 0, allowance: 100, pointsAwarded: 0, energyAwarded: 0, today: "2026-10-17", fullBonus: 0 });
    expect(state.fullBonus).toBe(0);
    expect(() => careSchema.parse({ energy: 100, lastDrain: "x", claimed: false, claimDate: null, tokens: 0, allowance: 100, pointsAwarded: 0, energyAwarded: 0, today: "2026-10-17" })).toThrow();
  });
  it("local game progression never duplicates account point rewards", () => {
    const before = gameStateSnapshot().points;
    recordMini("jungle"); recordComplete(); recordJigsaw(3);
    expect(gameStateSnapshot().points).toBe(before);
  });
  it("only a real energy increase counts as a gain worth animating", () => {
    expect(energyGain(null, 50)).toBe(0);          // first reading after sign-in
    expect(energyGain(undefined, 50)).toBe(0);     // care state still loading
    expect(energyGain(50, null)).toBe(0);          // signed out mid-session
    expect(energyGain(50, 50)).toBe(0);            // refresh changed nothing
    expect(energyGain(50, 40)).toBe(0);            // hourly drain must not celebrate
    expect(energyGain(50, 55)).toBe(5);            // one Mini-Monere found
    expect(energyGain(0, 5)).toBe(5);              // first mini-game item after draining
  });
});