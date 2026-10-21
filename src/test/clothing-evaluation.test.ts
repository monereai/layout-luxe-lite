import { afterEach, expect, it, vi } from "vitest";
import { clothingCost, equip, persistShop, saveShop, setShopAccountAction, shopSnapshot } from "@/lib/shop";

afterEach(() => { setShopAccountAction(undefined); saveShop({ spent: 0, owned: [], equipped: {} }); });

it("owned items cost 0 even with a missing or invalid price", () => {
  expect(clothingCost("astro-suit", undefined, ["astro-suit"])).toBe(0);
  expect(clothingCost("astro-suit", "broken", ["astro-suit"])).toBe(0);
});
it("default clothing costs 0", () => { expect(clothingCost("default", undefined)).toBe(0); });
it("falls back to the 800-point catalog price instead of granting an unpriced item", () => {
  for (const price of [undefined, null, "", "800 pts", NaN, -1]) expect(clothingCost("astro-suit", price)).toBe(800);
  expect(clothingCost("astro-suit", "800")).toBe(800);
});
it("rejects missing or unknown clothing IDs", () => {
  for (const id of [42, "", "unknown"]) expect(() => clothingCost(id, 0)).toThrow();
});
it("queues equips against the latest saved state without charging owned clothing", async () => {
  saveShop({ spent: 0, owned: ["party-hat", "astro-suit"], equipped: {} });
  const action = vi.fn(async (request) => ({ ...shopSnapshot(), equipped: request.equipped }));
  setShopAccountAction(action);
  await Promise.all([
    persistShop((current) => equip(current, "hat", "party-hat")),
    persistShop((current) => equip(current, "costume", "astro-suit")),
  ]);
  expect(shopSnapshot().equipped).toEqual({ hat: "party-hat", outfit: "astro-suit" });
  expect(shopSnapshot().spent).toBe(0);
  expect(JSON.parse(localStorage.getItem("monereai-shop") ?? "{}").equipped).toEqual({ hat: "party-hat", outfit: "astro-suit" });
});
it("failed equips leave the saved outfit unchanged", async () => {
  saveShop({ spent: 0, owned: ["party-hat"], equipped: { hat: "party-hat" } });
  setShopAccountAction(async () => { throw new Error("Save failed"); });
  await expect(persistShop((current) => equip(current, "hat", null))).rejects.toThrow("Save failed");
  expect(shopSnapshot().equipped).toEqual({ hat: "party-hat" });
});