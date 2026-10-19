import { expect, it } from "vitest";
import { equip, normalizeEquipment, SHOP_ITEMS, type ShopState } from "@/lib/shop";
import { clothingFrames } from "@/lib/character-art";
import { combinationLook } from "@/lib/shop-combinations";

const owned = ["astro-suit", "pirate-coat", "rocket-boots", "rain-boots", "shell-necklace", "halo", "galaxy-cape"];
const initial: ShopState = { spent: 456, owned, equipped: { hat: "halo", accessory: "shell-necklace", footwear: "rocket-boots" } };
for (const id of ["astro-suit", "pirate-coat"]) it(`${id} replaces only outfit`, () => {
  const result = equip(initial, "costume", id);
  expect(result.equipped).toEqual({ ...initial.equipped, outfit: id });
  expect(result.spent).toBe(456);
  expect(result.owned).toEqual(owned);
});
for (const id of ["rocket-boots", "rain-boots"]) it(`${id} keeps outfit and necklace`, () => {
  const result = equip({ ...initial, equipped: { ...initial.equipped, outfit: "astro-suit" } }, "footwear", id);
  expect(result.equipped).toEqual({ ...initial.equipped, outfit: "astro-suit", footwear: id });
});
it("shell necklace removal keeps boots and costume", () => {
  expect(equip({ ...initial, equipped: { ...initial.equipped, outfit: "pirate-coat" } }, "accessory", null).equipped).toEqual({ hat: "halo", outfit: "pirate-coat", footwear: "rocket-boots" });
});
it("accepts legacy feet alias", () => {
  expect(normalizeEquipment({ ...initial, equipped: { feet: "rain-boots" } }).equipped).toEqual({ footwear: "rain-boots" });
});
it("Galaxy Voyager retains its three independently wearable pieces", () => {
  expect(combinationLook({ hat: "halo", outfit: "galaxy-cape", footwear: "rocket-boots" })).toBe("galaxy-cape");
  const boots = SHOP_ITEMS.filter((i) => i.id === "rocket-boots");
  for (let frame = 0; frame < 8; frame++) expect(clothingFrames(boots, frame)[0]?.src).toBe(`/monere/looks/rocket-boots/${frame}.webp`);
});