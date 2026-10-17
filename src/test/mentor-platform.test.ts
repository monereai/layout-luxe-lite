import { describe, expect, it } from "vitest";
import { platformFacts } from "@/lib/mentor-persona";

describe("Monere platform knowledge", () => {
  it("supplies the actual Plus monthly price and grants", () => {
    expect(platformFacts().memberships.find((m) => m.tier === "plus")).toMatchObject({ monthlyGBP: 2.99, monthlyPoints: 100, monthlyTokens: 25, dailyCarePoints: 40 });
  });
  it("supplies the actual Club monthly price and grants", () => {
    expect(platformFacts().memberships.find((m) => m.tier === "club")).toMatchObject({ monthlyGBP: 4.99, monthlyPoints: 250, monthlyTokens: 75, dailyCarePoints: 60 });
  });
  it("supplies game win energy and points without inflating rewards", () => {
    expect(platformFacts()).toMatchObject({ energyMax: 100, itemEnergy: 1, winEnergy: 1, winPoints: 5, freeCarePoints: 20 });
  });
});