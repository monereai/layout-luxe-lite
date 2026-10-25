import { describe, expect, it } from "vitest";
import { isTreasureTester, TREASURE_MAINTENANCE, visibleAdventureNavigation } from "@/lib/treasureGate";

describe("Adventure access gate", () => {
  const navigation = [{ to: "/" }, { to: "/treasure" }, { to: "/shop" }, { to: "/pet-shop" }];

  it("opens adventure access to the public", () => {
    expect(TREASURE_MAINTENANCE).toBe(false);
    expect(visibleAdventureNavigation(navigation)).toEqual(navigation);
  });

  it("removes the adventure from visitor navigation without hiding the shops", () => {
    expect(visibleAdventureNavigation(navigation, true)).toEqual([{ to: "/" }, { to: "/shop" }, { to: "/pet-shop" }]);
  });

  it("preserves the original navigation for reopening", () => {
    expect(visibleAdventureNavigation(navigation, false)).toEqual(navigation);
    expect(navigation.map(item => item.to)).toContain("/treasure");
  });
  it("allows Carl's verified protected account during maintenance", () => {
    expect(isTreasureTester("carlhillyard@icloud.com", ["admin"])).toBe(true);
    expect(visibleAdventureNavigation(navigation, true, true)).toEqual(navigation);
  });
  it("does not allow another admin or tester account", () => {
    expect(isTreasureTester("qa@example.com", ["admin", "tester"])).toBe(false);
  });
  it("does not trust Carl's email without a protected role", () => {
    expect(isTreasureTester("carlhillyard@icloud.com", ["user"])).toBe(false);
  });
  it("keeps guests locked out", () => {
    expect(isTreasureTester(undefined, [])).toBe(false);
  });
});