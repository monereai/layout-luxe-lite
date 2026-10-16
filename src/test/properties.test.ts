import { describe, expect, it } from "vitest";
import { buyProperty, equipProperty } from "@/lib/properties";

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
  it("Space Station purchases with exactly 900 available points", () => {
    expect(buyProperty(base, 899, "space-station")).toBeNull();
    const next = buyProperty(base, 900, "space-station");
    expect(next?.spent).toBe(900);
    expect(next?.activeProperty).toBe("space-station");
    expect(next?.unlockedProperties).toContain("space-station");
  });
});
