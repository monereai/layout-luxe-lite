import { describe, it, expect } from "vitest";
import { buy, SHOP_ITEMS } from "@/lib/shop";
describe("buying keeps other equipped slots", () => {
  it("buying footwear after a hat keeps the hat", () => {
    const hat = SHOP_ITEMS.find((i) => i.category === "hat")!;
    const shoe = SHOP_ITEMS.find((i) => i.category === "footwear")!;
    const a = buy({ spent: 0, owned: [], equipped: {} }, 100000, hat.id)!;
    const b = buy(a, 100000, shoe.id)!;
    expect(b.equipped.hat).toBe(hat.id);
    expect(b.equipped.footwear).toBe(shoe.id);
  });
});

import { combinationLook, itemsDrawnIn } from "@/lib/shop-combinations";
describe("footwear stays visible with other items", () => {
  it("costume + boots without combo art keeps the costume picture and layers the boots", () => {
    const sel = { hat: "viking-helmet", outfit: "storm-cloak", footwear: "knight-boots" };
    const look = combinationLook(sel);
    expect(look).toBe("storm-cloak");
    expect(itemsDrawnIn(look, sel)).not.toContain("knight-boots");
  });
  it("repaired equipment uses its own picture", () => {
    expect(combinationLook({ footwear: "rocket-boots" })).toBe("rocket-boots");
  });
  it("items without their own picture fall back to the default look", () => {
    expect(combinationLook({ hat: "viking-helmet" })).toBe("default");
  });
});
