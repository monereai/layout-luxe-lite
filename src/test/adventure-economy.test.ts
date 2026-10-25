import { describe, expect, it } from "vitest";
import { initialAdventure, parseAdventure, DIG_ENERGY } from "@/lib/treasure";
import { adventureFruitCount, guestMiniGamePrize, CONNIE_COIN_REWARD } from "@/lib/adventure-economy";
import { saveAdventure, loadGuestAdventure } from "@/lib/adventure-storage";
import { canClaimCare } from "@/lib/care";
import { splitEnergyGain, overflowPayout } from "@/lib/orchard";
import { GARDEN_COIN_REWARD } from "@/lib/garden-game";

describe("audited adventure economy", () => {
  it("a pet dig gains 10 Energy without spending", () => {
    expect(DIG_ENERGY).toBe(10);
    expect(splitEnergyGain(40, DIG_ENERGY)).toEqual({ energy: 50, overflow: 0 });
  });
  it("100 Energy preserves the daily care claim", () => {
    const next = splitEnergyGain(90, 10);
    expect(next).toEqual({ energy: 100, overflow: 0 });
    expect(canClaimCare(next.energy, false, null, "2026-10-25")).toBe(true);
  });
  it("overflow pays 5 Points per 100 and keeps the remainder", () => {
    expect(overflowPayout(95 + splitEnergyGain(100, 10).overflow)).toEqual({ points: 5, overflow: 5 });
  });
  it("Barn victory persists 20 Coins, Lost Scroll and hasScroll", () => {
    const next = guestMiniGamePrize(initialAdventure(), "garden", GARDEN_COIN_REWARD);
    expect(next.coins).toBe(20); expect(next.hasScroll).toBe(true); expect(next.scrolls).toContain("meadow");
    const values = new Map<string, string>();
    const storage = { getItem: (k: string) => values.get(k) ?? null, setItem: (k: string, v: string) => { values.set(k, v); } };
    saveAdventure(next, undefined, storage);
    expect(loadGuestAdventure(storage).state.coins).toBe(20);
    expect(loadGuestAdventure(storage).state.hasScroll).toBe(true);
  });
  it("Connie victory grants 20 Coins and the strict win flag and Wood Scroll", () => {
    const next = guestMiniGamePrize(initialAdventure(), "arcade", CONNIE_COIN_REWARD);
    expect(next.coins).toBe(20); expect(next.connieMiniGameWon).toBe(true); expect(next.scrolls).toContain("wood");
    expect(parseAdventure(next).connieMiniGameWon).toBe(true);
  });
  it("fruit count uses unique held apples, not seeds or arcade catches", () => {
    expect(adventureFruitCount({ ...initialAdventure(), items: ["apple-1", "apple-1", "apple-2", "seed-1"] })).toBe(2);
  });
  it("rejects negative and invalid saved values", () => {
    expect(parseAdventure({ ...initialAdventure(), coins: -20 }).coins).toBe(0);
    expect(splitEnergyGain(-10, -5)).toEqual({ energy: 0, overflow: 0 });
    expect(overflowPayout(-100)).toEqual({ points: 0, overflow: 0 });
  });
});