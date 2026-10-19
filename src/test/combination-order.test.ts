import { describe, expect, it } from "vitest";
import { COMBINATION_FAMILIES } from "@/lib/shop-combinations";
import { COMBINATIONS_BY_VALUE, combinationValue } from "@/lib/shop";

describe("combinations listed by value", () => {
  it("shows every combination exactly once, cheapest set first", () => {
    expect(COMBINATIONS_BY_VALUE.map((f) => f.id).sort()).toEqual(COMBINATION_FAMILIES.map((f) => f.id).sort());
    const values = COMBINATIONS_BY_VALUE.map(combinationValue);
    expect(values).toEqual([...values].sort((a, b) => a - b));
  });

  it("prices every set at 25% over its pieces, rounded up to the nearest 5", () => {
    expect(COMBINATIONS_BY_VALUE.map((f) => [f.name, combinationValue(f)])).toEqual([
      ["Forest Explorer", 1750],
      ["Winter Adventurer", 1750],
      ["Royal Hero", 2375],
      ["Galaxy Wizard", 2375],
      ["Party Star", 2375],
      ["Dapper Pirate", 2375],
      ["Storm Viking", 3000],
      ["Galaxy Voyager", 3000],
    ]);
  });
});
