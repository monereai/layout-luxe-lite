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
      ["Winter Adventurer", 1000],
      ["Forest Explorer", 1075],
      ["Party Star", 1175],
      ["Galaxy Wizard", 1215],
      ["Dapper Pirate", 1300],
      ["Royal Hero", 1550],
      ["Storm Viking", 1565],
      ["Galaxy Voyager", 1840],
    ]);
  });
});
