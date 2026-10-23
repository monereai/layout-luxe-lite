import { describe, expect, it } from "vitest";
import { TREASURE_MAINTENANCE, visibleAdventureNavigation } from "@/lib/treasureGate";

describe("Temporary adventure closure", () => {
  const navigation = [{ to: "/" }, { to: "/treasure" }, { to: "/shop" }, { to: "/pet-shop" }];

  it("keeps public adventure access closed during repairs", () => {
    expect(TREASURE_MAINTENANCE).toBe(true);
  });

  it("removes only the adventure from dashboard navigation", () => {
    expect(visibleAdventureNavigation(navigation).map(item => item.to)).toEqual(["/", "/shop", "/pet-shop"]);
  });

  it("preserves the original navigation for reopening", () => {
    expect(visibleAdventureNavigation(navigation, false)).toEqual(navigation);
    expect(navigation.map(item => item.to)).toContain("/treasure");
  });
});