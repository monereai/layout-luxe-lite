import { describe, expect, it } from "vitest";
import { buy, equip, walletBalance } from "@/lib/shop";

const empty = { spent: 0, owned: [], equipped: {} };

describe("points shop", () => {
  it("wallet is game points minus spent", () => {
    expect(walletBalance(700, { ...empty, spent: 200 })).toBe(500);
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
