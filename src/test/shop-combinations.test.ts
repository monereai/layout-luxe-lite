import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { COMBINATION_FAMILIES, combinationLook, hasCombinationArt } from "@/lib/shop-combinations";
import { equip, type ShopState } from "@/lib/shop";

describe("complete clothing pictures", () => {
  for (const family of COMBINATION_FAMILIES) {
    it(`shows every two-piece and three-piece ${family.name} selection`, () => {
      const selections = [
        { hat: family.hat, outfit: family.outfit },
        { hat: family.hat, footwear: family.footwear },
        { outfit: family.outfit, footwear: family.footwear },
        { hat: family.hat, outfit: family.outfit, footwear: family.footwear },
      ];
      const suffixes = ["-hat-outfit", "-hat-footwear", "-outfit-footwear", ""];
      selections.forEach((selection, index) => {
        const expected = `combo-${family.id}${suffixes[index]}`;
        expect(combinationLook(selection)).toBe(expected);
        // Families without their own turnaround art fall back to the closest
        // complete look at display time, so only check frames that exist.
        if (existsSync(`public/monere/looks/${expected}`)) {
          for (let frame = 0; frame < 8; frame++) {
            expect(existsSync(`public/monere/looks/${expected}/${frame}.webp`)).toBe(true);
          }
        }
      });
    });
  }
});
describe("any selection stays equipped", () => {
  it("keeps unrelated items together and shows the closest complete look", () => {
    expect(combinationLook({ hat: "cowboy-hat", outfit: "flame-cape", footwear: "golden-sliders" })).toBe("flame-cape");
    expect(combinationLook({ hat: "top-hat", glasses: "sunglasses" })).toBe("top-hat");
    expect(combinationLook({ glasses: "round-specs", accessory: "bow-tie" })).toBe("round-specs");
  });

  it("equipping and removing items never discards other slots", () => {
    let state: ShopState = { spent: 0, owned: ["cowboy-hat", "flame-cape", "golden-sliders", "sunglasses"], equipped: {} };
    state = equip(state, "hat", "cowboy-hat");
    state = equip(state, "costume", "flame-cape");
    state = equip(state, "footwear", "golden-sliders");
    state = equip(state, "glasses", "sunglasses");
    expect(state.equipped).toEqual({ hat: "cowboy-hat", outfit: "flame-cape", footwear: "golden-sliders", glasses: "sunglasses" });
    state = equip(state, "costume", null);
    expect(state.equipped).toEqual({ hat: "cowboy-hat", footwear: "golden-sliders", glasses: "sunglasses" });
  });
});

it("only points the shop at combination art that actually exists", () => {
  for (const family of COMBINATION_FAMILIES) {
    expect(hasCombinationArt(family.id), family.name).toBe(existsSync(`public/monere/looks/combo-${family.id}/0.webp`));
  }
});
