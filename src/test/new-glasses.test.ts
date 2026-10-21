import { describe, expect, it } from "vitest";
import { buy, clothingCost, equip, normalizeEquipment, SHOP_ITEMS } from "@/lib/shop";

describe.each(["heart-specs", "aviator-shades", "rainbow-specs"])("%s glasses", (id) => {
  it("has a unique catalogue ID and costs the existing 300-point glasses price", () => {
    const items = SHOP_ITEMS.filter((item) => item.id === id);
    expect(items).toHaveLength(1);
    expect(items[0]?.category).toBe("glasses");
    expect(items[0]?.cost).toBe(300);
  });
  it("requires ownership, buys for 300 and equips without clearing other slots", () => {
    const state = { spent: 0, owned: ["party-hat"], equipped: { hat: "party-hat" } };
    expect(equip(state, "glasses", id)).toEqual(state);
    expect(buy(state, 299, id)).toBeNull();
    const bought = buy(state, 300, id);
    expect(bought?.spent).toBe(300);
    expect(bought?.equipped).toEqual({ hat: "party-hat", glasses: id });
    expect(clothingCost(id, undefined, bought?.owned)).toBe(0);
    if (!bought) throw new Error("Purchase failed");
    expect(normalizeEquipment(JSON.parse(JSON.stringify(bought))).equipped.glasses).toBe(id);
    expect(equip(equip(bought, "glasses", null), "glasses", id).spent).toBe(300);
  });
});