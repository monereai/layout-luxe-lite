import { describe, expect, it } from "vitest";
import { buyProperty, equipProperty } from "@/lib/properties";

const base = { unlockedProperties: ["treehouse"], activeProperty: "treehouse", spent: 0 };

describe("properties", () => {
  it("treehouse is unlocked by default", () => expect(base.unlockedProperties).toContain("treehouse"));
  it("cannot buy without enough points", () => expect(buyProperty(base, 10, "space-station")).toBeNull());
  it("buying unlocks, equips and charges once", () => {
    const n = buyProperty(base, 1000, "beach-bungalow")!;
    expect(n.activeProperty).toBe("beach-bungalow");
    expect(n.spent).toBe(450);
    expect(buyProperty(n, 1000, "beach-bungalow")).toBeNull();
  });
  it("cannot equip a locked property", () => expect(equipProperty(base, "cozy-bedroom").activeProperty).toBe("treehouse"));
});
