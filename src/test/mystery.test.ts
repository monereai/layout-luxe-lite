import { describe, it, expect } from "vitest";
import { grantMystery, equipmentSlot, SHOP_ITEMS } from "@/lib/shop";
import { allMapsComplete } from "@/lib/game";

describe("mystery clothing reward", () => {
  it("only counts as complete when all 10 are found in every map", () => {
    expect(allMapsComplete({ a: 10, b: 9 }, ["a", "b"])).toBe(false);
    expect(allMapsComplete({ a: 10, b: 10 }, ["a", "b"])).toBe(true);
  });
  it("gives a free unowned clothing item and equips it", () => {
    const r = grantMystery({ spent: 50, owned: [], equipped: {} }, () => 0)!;
    expect(r.state.spent).toBe(50);
    expect(r.state.owned).toEqual([r.item.id]);
    expect(r.item.category).not.toBe("glasses");
    expect(r.state.equipped[equipmentSlot(r.item.category)]).toBe(r.item.id);
  });
  it("returns null when all clothing is owned", () => {
    const owned = SHOP_ITEMS.filter((i) => i.category !== "glasses").map((i) => i.id);
    expect(grantMystery({ spent: 0, owned, equipped: {} })).toBeNull();
  });
});
