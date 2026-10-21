import { expect, it } from "vitest";
import { existsSync } from "node:fs";
import { SHOP_ITEMS, equip, normalizeEquipment, type ShopState } from "@/lib/shop";
import { COMBINATION_FAMILIES } from "@/lib/shop-combinations";
import { clothingFrames } from "@/lib/character-art";

it.each(["heart-specs", "aviator-shades", "rainbow-specs"])("uses eight angle-matched layers for %s", (id) => {
  const item = SHOP_ITEMS.find((item) => item.id === id);
  if (!item) throw new Error(`Missing glasses: ${id}`);
  for (let frame = 0; frame < 8; frame++) {
    const src = `/monere/layers/${id}/${frame}.webp`;
    expect(clothingFrames([item], frame)[0]?.src).toBe(src);
    expect(existsSync(`public${src}`)).toBe(true);
  }
});

it("keeps every extra equipped item in all eight turning frames", () => {
  const items = SHOP_ITEMS.filter((item) => ["crown", "sunglasses", "bow-tie", "crisp-sneakers", "party-hat"].includes(item.id));
  for (let frame = 0; frame < 8; frame++) {
    const pictures = clothingFrames(items, frame);
    expect(pictures.map(({ item }) => item.id).sort()).toEqual(items.map((item) => item.id).sort());
    expect(pictures.find(({ item }) => item.id === "crown")?.src).toBe(`/monere/looks/crown/${frame}.webp`);
    expect(pictures.find(({ item }) => item.id === "party-hat")?.src).toBe(items.find((item) => item.id === "party-hat")?.src);
  }
});

it("has eight complete turn-around pictures for every look that ships its own art", () => {
  // Items and combinations without their own turn-around art fall back to the
  // default Monere at display time, so only folders that exist are checked.
  for (const id of ["default", ...SHOP_ITEMS.map((item) => item.id), ...COMBINATION_FAMILIES.map((family) => `combo-${family.id}`)]) {
    if (!existsSync(`public/monere/looks/${id}`)) continue;
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
