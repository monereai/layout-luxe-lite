import { describe, expect, it } from "vitest";
import { COMBINATION_FAMILIES } from "@/lib/shop-combinations";
import { COMBINATIONS_BY_VALUE, SHOP_ITEMS, combinationValue } from "@/lib/shop";

describe("combinations listed by value", () => {
  it("shows every combination exactly once, cheapest set first", () => {
    expect(COMBINATIONS_BY_VALUE.map((f) => f.id).sort()).toEqual(COMBINATION_FAMILIES.map((f) => f.id).sort());
    const values = COMBINATIONS_BY_VALUE.map(combinationValue);
    expect(values).toEqual([...values].sort((a, b) => a - b));
  });

  it("prices a combination as the sum of its three pieces", () => {
    const cost = (id: string) => SHOP_ITEMS.find((item) => item.id === id)?.cost ?? 0;
    for (const family of COMBINATION_FAMILIES) {
      expect(combinationValue(family), family.name).toBe(cost(family.hat) + cost(family.outfit) + cost(family.footwear));
    }
  });
});
