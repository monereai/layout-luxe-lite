import { expect, it } from "vitest";
import { existsSync } from "node:fs";
import { SHOP_ITEMS, equip, normalizeEquipment, type ShopState } from "@/lib/shop";
import { COMBINATION_FAMILIES } from "@/lib/shop-combinations";

it("has eight complete turn-around pictures for every shop item and the default", () => {
  for (const id of ["default", ...SHOP_ITEMS.map((item) => item.id), ...COMBINATION_FAMILIES.map((family) => `combo-${family.id}`)]) {
    for (let frame = 0; frame < 8; frame++) {
      expect(existsSync(`public/monere/looks/${id}/${frame}.webp`), `${id} frame ${frame}`).toBe(true);
    }
  }
});

it("migrates a legacy costume inside a supported combination without losing purchases or spend", () => {
  const legacy: ShopState = { spent: 800, owned: ["crown", "hero-cape", "crisp-sneakers"], equipped: { hat: "crown", costume: "hero-cape", footwear: "crisp-sneakers" } };
  const migrated = normalizeEquipment(legacy);
  expect(migrated.equipped).toEqual({ hat: "crown", outfit: "hero-cape", footwear: "crisp-sneakers" });
  expect(migrated.owned).toEqual(legacy.owned);
  expect(migrated.spent).toBe(800);
  expect(equip(migrated, "costume", null).equipped).toEqual({ hat: "crown", footwear: "crisp-sneakers" });
});
