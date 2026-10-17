import { describe, expect, it } from "vitest";
import { MEMBERSHIPS, POINT_PACKS, membershipPrice, packPrice } from "@/lib/store-config";

describe("Stripe store catalog", () => {
  it("maps every membership price to its tier and monthly grants", () => {
    expect(membershipPrice("plus_monthly")).toEqual({ tier: "plus", interval: "monthly", points: 100, tokens: 25 });
    expect(membershipPrice("plus_yearly")).toEqual({ tier: "plus", interval: "yearly", points: 100, tokens: 25 });
    expect(membershipPrice("club_monthly")).toEqual({ tier: "club", interval: "monthly", points: 250, tokens: 75 });
    expect(membershipPrice("club_yearly")).toEqual({ tier: "club", interval: "yearly", points: 250, tokens: 75 });
  });

  it("keeps the agreed membership prices", () => {
    const plus = MEMBERSHIPS.find((m) => m.tier === "plus")!;
    const club = MEMBERSHIPS.find((m) => m.tier === "club")!;
    expect([plus.monthly, plus.yearly]).toEqual(["2.99", "24.99"]);
    expect([club.monthly, club.yearly]).toEqual(["4.99", "44.99"]);
  });

  it("keeps point pack prices and amounts", () => {
    expect(packPrice("pocket_pack")).toMatchObject({ points: 250, price: "1.99" });
    expect(packPrice("popular_pack")).toMatchObject({ points: 600, price: "3.99" });
    expect(packPrice("mega_bundle")).toMatchObject({ points: 1000, price: "7.99" });
    expect(POINT_PACKS).toHaveLength(3);
  });
});
