import { beforeEach, describe, expect, it } from "vitest";
import { HINT_COST, POINTS_PER_MINI, gameStateSnapshot, recordHintSpend } from "@/lib/game";
import { walletBalance } from "@/lib/shop";
import type { ShopState } from "@/lib/shop";

const EMPTY_SHOP: ShopState = { spent: 0, owned: [], equipped: {} };

describe("Monere's Hint cost", () => {
  beforeEach(() => { localStorage.clear(); });

  it("a clue costs exactly 20 points — the same as one Mini-Monere find", () => {
    expect(HINT_COST).toBe(20);
    expect(POINTS_PER_MINI).toBe(20);
  });

  it("each clue spend deducts 20 points from the wallet", () => {
    expect(useGameSnapshot().hintsSpent ?? 0).toBe(0);
    recordHintSpend();
    recordHintSpend();
    const state = useGameSnapshot();
    expect(state.hintsSpent).toBe(40);
    expect(walletBalance(100, EMPTY_SHOP, state.hintsSpent)).toBe(60);
  });
});
