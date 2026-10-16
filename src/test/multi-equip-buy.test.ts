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
