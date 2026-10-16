import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { COMBINATION_FAMILIES, combinationLook } from "@/lib/shop-combinations";

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
        for (let frame = 0; frame < 8; frame++) {
          expect(existsSync(`public/monere/looks/${expected}/${frame}.webp`)).toBe(true);
        }
      });
    });
  }
});