import { describe, expect, it } from "vitest";
import { PETS, petButtonState } from "@/lib/pets";

const puppy = PETS.find((p) => p.id === "puppy")!;

describe("pet shop buttons", () => {
  it("disables buying when points are short", () => {
    expect(petButtonState({ owned: [], active: null }, 299, puppy)).toBe("unaffordable");
  });
  it("allows buying with enough points", () => {
    expect(petButtonState({ owned: [], active: null }, 300, puppy)).toBe("buy");
  });
  it("shows owned pets as owned, never for sale again", () => {
    expect(petButtonState({ owned: ["puppy"], active: null }, 0, puppy)).toBe("owned");
  });
  it("shows the active pet as equipped", () => {
    expect(petButtonState({ owned: ["puppy"], active: "puppy" }, 0, puppy)).toBe("equipped");
  });
});

describe("pet prices (rarity tiers)", () => {
  it("matches the agreed tier prices", () => {
    expect(Object.fromEntries(PETS.map((p) => [p.id, p.cost]))).toEqual({ goldfish: 300, puppy: 300, kitten: 300, bunny: 800, parrot: 800, "baby-dragon": 2000 });
  });
});
