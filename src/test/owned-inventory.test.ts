import { describe, expect, it } from "vitest";
import { ownedCollection } from "@/components/OwnedInventory";
import type { PropertyState } from "@/lib/properties";
import type { ShopState } from "@/lib/shop";

const shop = (owned: string[], equipped: ShopState["equipped"] = {}): ShopState => ({ spent: 0, owned, equipped });
const habitats = (unlocked: string[], active = "treehouse"): PropertyState => ({
  unlockedProperties: unlocked,
  activeProperty: active,
  spent: 0,
});

describe("owned collection listing", () => {
  it("lists every owned item once, grouped by category", () => {
    const { groups, total } = ownedCollection(shop(["crown", "crisp-sneakers", "bandana"]), habitats(["treehouse"]));
    expect(total).toBe(3);
    expect(groups.map((g) => g.label)).toEqual(["Hats", "Footwear", "Extras"]);
    expect(groups.flatMap((g) => g.items.map((i) => i.id))).toEqual(["crown", "crisp-sneakers", "bandana"]);
  });

  it("ignores ids that are not in the shop", () => {
    const { groups, total } = ownedCollection(shop(["ghost-hat", "crown"]), habitats(["treehouse"]));
    expect(total).toBe(1);
    expect(groups.flatMap((g) => g.items.map((i) => i.id))).toEqual(["crown"]);
  });

  it("shows nothing when nothing is owned", () => {
    const { groups, total } = ownedCollection(shop([]), habitats([]));
    expect(total).toBe(0);
    expect(groups).toHaveLength(0);
  });

  it("lists unlocked habitats and keeps the free treehouse", () => {
    const { habitats: list } = ownedCollection(shop([]), habitats(["treehouse", "beach-bungalow"]));
    expect(list.map((p) => p.id)).toEqual(["treehouse", "beach-bungalow"]);
  });

  it("gives Club members the Space Station without a purchase", () => {
    const free = ownedCollection(shop([]), habitats(["treehouse"]), false).habitats.map((p) => p.id);
    const club = ownedCollection(shop([]), habitats(["treehouse"]), true).habitats.map((p) => p.id);
    expect(free).not.toContain("space-station");
    expect(club).toContain("space-station");
  });
});
