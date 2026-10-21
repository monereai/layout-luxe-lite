import { describe, expect, it } from "vitest";
import { buyProperty, equipProperty, propertyName, canEnterProperty } from "@/lib/properties";

const base = { unlockedProperties: ["treehouse"], activeProperty: "treehouse", spent: 0 };

describe("properties", () => {
  it("treehouse is unlocked by default", () => expect(base.unlockedProperties).toContain("treehouse"));
  it("cannot buy without enough points", () => expect(buyProperty(base, 10, "space-station")).toBeNull());
  it("buying unlocks, equips and charges once", () => {
    const n = buyProperty(base, 1000, "beach-bungalow");
    if (!n) throw new Error("Expected habitat purchase");
    expect(n.activeProperty).toBe("beach-bungalow");
    expect(n.spent).toBe(540);
    expect(buyProperty(n, 1000, "beach-bungalow")).toBeNull();
  });
  it("cannot equip a locked property", () => expect(equipProperty(base, "cozy-bedroom").activeProperty).toBe("treehouse"));
  it("Beach Bungalow costs 540 points after the 20% increase", () => {
    expect(buyProperty(base, 539, "beach-bungalow")).toBeNull();
    expect(buyProperty(base, 540, "beach-bungalow")?.spent).toBe(540);
  });
  it("Cozy Bedroom costs 720 points after the 20% increase", () => {
    expect(buyProperty(base, 719, "cozy-bedroom")).toBeNull();
    const next = buyProperty(base, 720, "cozy-bedroom");
    expect(next?.spent).toBe(720);
    expect(next?.activeProperty).toBe("cozy-bedroom");
    expect(next?.unlockedProperties).toContain("cozy-bedroom");
  });
  it("Space Station cannot be bought with points", () => {
    expect(buyProperty(base, 99999, "space-station")).toBeNull();
  });
  it("Lion’s Den costs exactly 3,000 points and equips free once owned", () => {
    expect(buyProperty(base, 2999, "lions-den")).toBeNull();
    expect(equipProperty(base, "lions-den")).toEqual(base);
    const purchased = buyProperty(base, 3000, "lions-den");
    if (!purchased) throw new Error("Expected Lion’s Den purchase");
    expect(purchased.spent).toBe(3000);
    expect(purchased.activeProperty).toBe("lions-den");
    expect(purchased.unlockedProperties).toContain("lions-den");
    expect(buyProperty(purchased, 3000, "lions-den")).toBeNull();
    expect(equipProperty({ ...purchased, activeProperty: "treehouse" }, "lions-den", "free")).toEqual(purchased);
  });
  it.each(["free", "plus"])("%s cannot enter an old owned Space Station", (tier) => {
    const owned = { ...base, unlockedProperties: ["treehouse", "space-station"] };
    expect(canEnterProperty("space-station", tier)).toBe(false);
    expect(equipProperty(owned, "space-station", tier).activeProperty).toBe("treehouse");
  });
  it("Club enters Space Station without spending points", () => {
    expect(canEnterProperty("space-station", "club")).toBe(true);
    expect(equipProperty(base, "space-station", "club")).toEqual({ ...base, activeProperty: "space-station" });
  });
  it("names every habitat for welcome copy", () => {
    expect(propertyName("cozy-bedroom")).toBe("Cozy Bedroom");
    expect(propertyName("treehouse")).toBe("Treehouse");
    expect(propertyName("space-station")).toBe("Space Station");
    expect(propertyName("beach-bungalow")).toBe("Beach Bungalow");
  });
  it("falls back to the treehouse for an unknown habitat", () => expect(propertyName("ghost-flat")).toBe("Treehouse"));
});
