import { expect, it } from "vitest";
import { existsSync } from "node:fs";
import { SHOP_ITEMS, equip, normalizeEquipment, type ShopState } from "@/lib/shop";

it("has eight complete turn-around pictures for every shop item and the default", () => {
  for (const id of ["default", ...SHOP_ITEMS.map((item) => item.id)]) {
    for (let frame = 0; frame < 8; frame++) {
      expect(existsSync(`public/monere/looks/${id}/${frame}.webp`), `${id} frame ${frame}`).toBe(true);
    }
  }
});

it("migrates combined legacy equipment to one look without losing purchases or spend", () => {
  const legacy: ShopState = { spent: 800, owned: ["crown", "hero-cape", "sunglasses"], equipped: { hat: "crown", costume: "hero-cape", glasses: "sunglasses" } };
  const migrated = normalizeEquipment(legacy);
  expect(migrated.equipped).toEqual({ glasses: "sunglasses" });
  expect(migrated.owned).toEqual(legacy.owned);
  expect(migrated.spent).toBe(800);
  expect(equip(migrated, "costume", "hero-cape").equipped).toEqual({ outfit: "hero-cape" });
});
