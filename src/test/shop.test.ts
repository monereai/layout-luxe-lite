import { describe, expect, it } from "vitest";
import { COMBINATION_FAMILIES } from "@/lib/shop-combinations";
import { SHOP_ITEMS, buy, buyCombination, combinationPrice, equip, equippedItems, normalizeEquipment, walletBalance } from "@/lib/shop";

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
  it("a personal balance of 1030 excludes habitat spending everywhere", () => {
    expect(walletBalance(1030, empty, 450)).toBe(580);
    expect(walletBalance(1030, { ...empty, spent: 200 }, 450)).toBe(380);
  });
  it("habitat spending cannot be spent again on clothing", () => {
    const wallet = walletBalance(1030, empty, 900);
    expect(wallet).toBe(130);
    expect(buy(empty, wallet, "detective-hat")).toBeNull();
  });
  it("stocked with exactly 12 distinct hats, each priced and imaged", () => {
    const hats = SHOP_ITEMS.filter((i) => i.category === "hat");
    expect(hats).toHaveLength(12);
    expect(new Set(hats.map((h) => h.id)).size).toBe(12);
    expect(new Set(hats.map((h) => h.name)).size).toBe(12);
    expect(hats.every((h) => h.cost > 0 && h.src.length > 0)).toBe(true);
  });
  it("stocked with exactly 14 distinct costumes, each priced and imaged", () => {
    const costumes = SHOP_ITEMS.filter((i) => i.category === "costume");
    expect(costumes).toHaveLength(14);
    expect(new Set(costumes.map((c) => c.id)).size).toBe(14);
    expect(new Set(costumes.map((c) => c.name)).size).toBe(14);
    expect(costumes.every((c) => c.cost > 0 && c.src.length > 0)).toBe(true);
  });
  it("stocked with exactly 8 distinct footwear, each priced and imaged", () => {
    const shoes = SHOP_ITEMS.filter((i) => i.category === "footwear");
    expect(shoes).toHaveLength(8);
    expect(new Set(shoes.map((s) => s.id)).size).toBe(8);
    expect(new Set(shoes.map((s) => s.name)).size).toBe(8);
    expect(shoes.every((s) => s.cost > 0 && s.src.length > 0)).toBe(true);
  });
  it("stocked with exactly 7 distinct accessories, each priced and imaged", () => {
    const acc = SHOP_ITEMS.filter((i) => i.category === "accessory");
    expect(acc).toHaveLength(7);
    expect(new Set(acc.map((a) => a.id)).size).toBe(7);
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
  it("every clothing combination is free to wear once its items are owned", () => {
    expect(COMBINATION_FAMILIES).toHaveLength(8);
    const state = { ...empty, owned: ["crown", "hero-cape", "crisp-sneakers"] };
    const worn = equip(equip(equip(state, "hat", "crown"), "costume", "hero-cape"), "footwear", "crisp-sneakers");
    expect(worn.spent).toBe(0);
    expect(worn.equipped).toEqual({ hat: "crown", outfit: "hero-cape", footwear: "crisp-sneakers" });
  });
  it("an owned item never charges again when clicked, even after being taken off", () => {
    const bought = buy(empty, 1000, "sunglasses");
    if (!bought) throw new Error("Expected successful purchase");
    const off = equip(bought, "glasses", null);
    const back = equip(off, "glasses", "sunglasses");
    expect(back.spent).toBe(bought.spent);
    expect(back.equipped.glasses).toBe("sunglasses");
    expect(equippedItems(back).map((i) => i.id)).toEqual(["sunglasses"]);
  });
  it("Buy Now charges only the combination pieces not owned yet", () => {
    const combo = { hat: "crown", outfit: "hero-cape", footwear: "crisp-sneakers" };
    const state = { ...empty, owned: ["crown"] };
    expect(combinationPrice(state, combo)).toBe(800);
    const s = buyCombination(state, 800, combo);
    expect(s?.spent).toBe(800);
    expect(s?.owned).toEqual(["crown", "hero-cape", "crisp-sneakers"]);
    expect(s?.equipped).toEqual({ hat: "crown", outfit: "hero-cape", footwear: "crisp-sneakers" });
  });
  it("Buy Now refuses when the wallet cannot cover the missing pieces", () => {
    expect(buyCombination(empty, 1549, { hat: "crown", outfit: "hero-cape", footwear: "crisp-sneakers" })).toBeNull();
  });
  it("an active combination purchase still requires the full 1550 points", () => {
    const combo = { hat: "crown", outfit: "hero-cape", footwear: "crisp-sneakers" };
    expect(buyCombination(empty, 1549, combo)).toBeNull();
    const purchased = buyCombination(empty, 1550, combo);
    expect(purchased?.spent).toBe(1550);
    expect(purchased?.equipped).toEqual({ hat: "crown", outfit: "hero-cape", footwear: "crisp-sneakers" });
    expect(empty).toEqual({ spent: 0, owned: [], equipped: {} });
  });
  it("a fully owned combination is free, so Buy Now never charges again", () => {
    const combo = { hat: "crown", outfit: "hero-cape", footwear: "crisp-sneakers" };
    const owned = { ...empty, owned: ["crown", "hero-cape", "crisp-sneakers"] };
    expect(combinationPrice(owned, combo)).toBe(0);
    expect(buyCombination(owned, 1000, combo)).toBeNull();
  });
});
