import { describe, expect, it } from "vitest";
import { COMBINATION_FAMILIES } from "@/lib/shop-combinations";
import { SHOP_ITEMS, buy, equip, equippedItems, normalizeEquipment, unlockCombo, walletBalance } from "@/lib/shop";

const empty = { spent: 0, owned: [], equipped: {} };

describe("points shop", () => {
  it("keeps crown, hero cape and crisp sneakers equipped together", () => {
    const owned = ["crown", "hero-cape", "crisp-sneakers"];
    const next = equip(equip(equip({ ...empty, owned }, "hat", "crown"), "costume", "hero-cape"), "footwear", "crisp-sneakers");
    expect(next.equipped).toEqual({ hat: "crown", outfit: "hero-cape", footwear: "crisp-sneakers" });
    expect(equippedItems(next).map((item) => item.id)).toEqual(owned);
  });
  it("keeps every item equipped even when the combination has no picture", () => {
    const state = { ...empty, owned: ["crown", "royal-cape"], equipped: { hat: "crown" } };
    expect(equip(state, "costume", "royal-cape").equipped).toEqual({ hat: "crown", outfit: "royal-cape" });
  });
  it("rejects a glasses item placed in the hat slot", () => {
    const state = { ...empty, owned: ["sunglasses"] };
    expect(equip(state, "hat", "sunglasses")).toBe(state);
  });
  it("migrates legacy costume into the outfit slot and replaces it", () => {
    const state = { ...empty, owned: ["hero-cape", "royal-cape"], equipped: { costume: "hero-cape" } };
    expect(normalizeEquipment(state).equipped).toEqual({ outfit: "hero-cape" });
    expect(equip(state, "costume", "royal-cape").equipped).toEqual({ outfit: "royal-cape" });
  });
  it("removing one item from a combination keeps the other items", () => {
    const state = { ...empty, owned: ["crown", "hero-cape", "crisp-sneakers"], equipped: { hat: "crown", outfit: "hero-cape", footwear: "crisp-sneakers" } };
    expect(equip(state, "hat", null).equipped).toEqual({ outfit: "hero-cape", footwear: "crisp-sneakers" });
  });
  it("wallet is game points minus spent", () => {
    expect(walletBalance(700, { ...empty, spent: 200 })).toBe(500);
  });
  it("stocked with exactly 10 distinct hats, each priced and imaged", () => {
    const hats = SHOP_ITEMS.filter((i) => i.category === "hat");
    expect(hats).toHaveLength(10);
    expect(new Set(hats.map((h) => h.id)).size).toBe(10);
    expect(new Set(hats.map((h) => h.name)).size).toBe(10);
    expect(hats.every((h) => h.cost > 0 && h.src.length > 0)).toBe(true);
  });
  it("stocked with exactly 12 distinct costumes, each priced and imaged", () => {
    const costumes = SHOP_ITEMS.filter((i) => i.category === "costume");
    expect(costumes).toHaveLength(12);
    expect(new Set(costumes.map((c) => c.id)).size).toBe(12);
    expect(new Set(costumes.map((c) => c.name)).size).toBe(12);
    expect(costumes.every((c) => c.cost > 0 && c.src.length > 0)).toBe(true);
  });
  it("stocked with exactly 6 distinct footwear, each priced and imaged", () => {
    const shoes = SHOP_ITEMS.filter((i) => i.category === "footwear");
    expect(shoes).toHaveLength(6);
    expect(new Set(shoes.map((s) => s.id)).size).toBe(6);
    expect(new Set(shoes.map((s) => s.name)).size).toBe(6);
    expect(shoes.every((s) => s.cost > 0 && s.src.length > 0)).toBe(true);
  });
  it("stocked with exactly 6 distinct accessories, each priced and imaged", () => {
    const acc = SHOP_ITEMS.filter((i) => i.category === "accessory");
    expect(acc).toHaveLength(6);
    expect(new Set(acc.map((a) => a.id)).size).toBe(6);
    expect(acc.every((a) => a.cost > 0 && a.src.length > 0)).toBe(true);
  });
  it("buying the 130 pt Red Bow Tie equips it as an accessory", () => {
    const s = buy(empty, 130, "bow-tie");
    expect(s?.spent).toBe(130);
    expect(s?.equipped.accessory).toBe("bow-tie");
  });
  it("buying the 200 pt Detective Hat deducts 200 and equips it", () => {
    const s = buy(empty, 250, "detective-hat");
    expect(s?.spent).toBe(200);
    expect(s?.equipped.hat).toBe("detective-hat");
  });
  it("cannot buy without enough points", () => {
    expect(buy(empty, 199, "detective-hat")).toBeNull();
  });
  it("cannot buy the same item twice", () => {
    const s = buy(empty, 1000, "sunglasses");
    if (!s) throw new Error("Expected successful purchase");
    expect(buy(s, 1000, "sunglasses")).toBeNull();
  });
  it("cannot equip an unowned item", () => {
    expect(equip(empty, "costume", "hero-cape").equipped.costume).toBeUndefined();
  });
  it("each clothing combination costs 150 points to wear", () => {
    expect(COMBINATION_FAMILIES).toHaveLength(4);
    for (const f of COMBINATION_FAMILIES) expect(f.cost).toBe(150);
  });
  it("wearing a combination charges its 150 points once and remembers it", () => {
    const unlocked = unlockCombo({ ...empty, owned: ["crown", "hero-cape", "crisp-sneakers"] }, 150, "crown-hero-sneakers");
    expect(unlocked?.spent).toBe(150);
    expect(unlocked?.comboUnlocked).toEqual(["crown-hero-sneakers"]);
    if (!unlocked) throw new Error("Expected successful unlock");
    expect(unlockCombo(unlocked, 1000, "crown-hero-sneakers")).toBeNull();
    expect(walletBalance(150, unlocked)).toBe(0);
  });
  it("cannot wear a combination without enough points", () => {
    expect(unlockCombo(empty, 149, "crown-hero-sneakers")).toBeNull();
  });
});
