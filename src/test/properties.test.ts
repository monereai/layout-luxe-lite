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
    expect(n.spent).toBe(450);
    expect(buyProperty(n, 1000, "beach-bungalow")).toBeNull();
  });
  it("cannot equip a locked property", () => expect(equipProperty(base, "cozy-bedroom").activeProperty).toBe("treehouse"));
  it("Cozy Bedroom purchases with exactly 600 available points", () => {
    expect(buyProperty(base, 599, "cozy-bedroom")).toBeNull();
    const next = buyProperty(base, 600, "cozy-bedroom");
    expect(next?.spent).toBe(600);
    expect(next?.activeProperty).toBe("cozy-bedroom");
    expect(next?.unlockedProperties).toContain("cozy-bedroom");
  });
  it("Space Station cannot be bought with points", () => {
    expect(buyProperty(base, 99999, "space-station")).toBeNull();
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
