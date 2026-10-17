import { describe, expect, it } from "vitest";
import { INITIAL_ENERGY, MINI_ENERGY, GAME_ENERGY, GAME_POINTS, FULL_ENERGY_BONUS, SNACK_COST, SNACK_ENERGY, addEnergy, drainEnergy, canClaimCare, dailyAllowance, careSchema } from "@/lib/care";
import { gameStateSnapshot, recordComplete, recordJigsaw, recordMini } from "@/lib/game";

describe("Frugal care economy", () => {
  it("starts at 50 energy", () => expect(INITIAL_ENERGY).toBe(50));
  it("each Mini-Monere gives one energy", () => {
    expect(MINI_ENERGY).toBe(1);
    expect(addEnergy(50, MINI_ENERGY)).toBe(51);
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
  it("a win gives 15 energy and only 5 points", () => {
    expect(GAME_ENERGY).toBe(15); expect(GAME_POINTS).toBe(5);
    expect(addEnergy(50, GAME_ENERGY)).toBe(65);
  });
  it("caps energy at 100 without banking excess", () => {
    expect(addEnergy(95, GAME_ENERGY)).toBe(100);
    expect(addEnergy(100, GAME_ENERGY)).toBe(100);
    expect(addEnergy(drainEnergy(100, 0, 3_600_000).energy, GAME_ENERGY)).toBe(100);
  });
  it("requires full energy to claim", () => {
    expect(canClaimCare(99, false, null, "2026-10-17")).toBe(false);
    expect(canClaimCare(100, false, null, "2026-10-17")).toBe(true);
  });
  it("allows just one claim per UTC date then unlocks tomorrow", () => {
    expect(canClaimCare(100, true, "2026-10-17", "2026-10-17")).toBe(false);
    expect(canClaimCare(100, true, "2026-10-17", "2026-10-18")).toBe(true);
  });
  it("pays exactly 20 free, 40 plus or 60 club", () => {
    expect(dailyAllowance("free")).toBe(20); expect(dailyAllowance("plus")).toBe(40); expect(dailyAllowance("club")).toBe(60);
  });
  it("reaching full energy credits a 20 point bonus", () => {
    expect(FULL_ENERGY_BONUS).toBe(20);
    const state = careSchema.parse({ energy: 100, lastDrain: "x", claimed: false, claimDate: null, tokens: 0, allowance: 20, pointsAwarded: 20, energyAwarded: 0, today: "2026-10-17", fullBonus: 20 });
    expect(state.fullBonus).toBe(20);
    expect(() => careSchema.parse({ energy: 100, lastDrain: "x", claimed: false, claimDate: null, tokens: 0, allowance: 20, pointsAwarded: 0, energyAwarded: 0, today: "2026-10-17" })).toThrow();
  });
  it("a snack costs 10 separate tokens for 50 capped energy", () => {
    expect(SNACK_COST).toBe(10); expect(SNACK_ENERGY).toBe(50);
    expect(addEnergy(20, SNACK_ENERGY)).toBe(70); expect(addEnergy(80, SNACK_ENERGY)).toBe(100);
  });
  it("local game progression never duplicates account point rewards", () => {
    const before = gameStateSnapshot().points;
    recordMini("jungle"); recordComplete(); recordJigsaw(3);
    expect(gameStateSnapshot().points).toBe(before);
  });
});