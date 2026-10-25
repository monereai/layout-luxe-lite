import type { AdventureState } from "./treasure";

export const CONNIE_COIN_REWARD = 20;
export const nonnegativeCount = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
/** Fruits are the unique apples held for Connie, not arcade-round catches. */
export const adventureFruitCount = (state: AdventureState) => new Set(state.items.filter(id => id.startsWith("apple-"))).size;
/** Guest completion is local only; flags and Coins are saved together. */
export function guestMiniGamePrize(state: AdventureState, kind: "garden" | "arcade", coins: number): AdventureState {
  const scroll = kind === "garden" ? "meadow" : "wood";
  return { ...state, coins: nonnegativeCount(state.coins) + nonnegativeCount(coins),
    hasScroll: kind === "garden" || state.hasScroll === true,
    connieMiniGameWon: kind === "arcade" || state.connieMiniGameWon === true,
    quests: kind === "garden" ? [...new Set([...state.quests, "vernon-garden"])] : state.quests,
    scrolls: [...new Set([...state.scrolls, scroll as "meadow" | "wood"])],
    ...(kind === "garden" ? { zone: "meadow" as const, x: 12, y: 27, pet: null } : {}) };
}