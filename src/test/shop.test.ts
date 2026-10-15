import { describe, expect, it } from "vitest";
import { SHOP_ITEMS, buy, equip, walletBalance } from "@/lib/shop";

const empty = { spent: 0, owned: [], equipped: {} };

describe("points shop", () => {
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
    const s = buy(empty, 1000, "sunglasses")!;
    expect(buy(s, 1000, "sunglasses")).toBeNull();
  });
  it("cannot equip an unowned item", () => {
    expect(equip(empty, "costume", "hero-cape").equipped.costume).toBeUndefined();
  });
});
