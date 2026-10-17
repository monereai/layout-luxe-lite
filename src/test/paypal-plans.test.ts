import { describe, expect, it } from "vitest";
import {
  CLUB_MONTHLY_PLAN_ID,
  CLUB_YEARLY_PLAN_ID,
  MEMBERSHIPS,
  PLUS_MONTHLY_PLAN_ID,
  PLUS_YEARLY_PLAN_ID,
  planInfo,
} from "@/lib/paypal-config";

describe("membership plan wiring", () => {
  it("maps every PayPal plan id to its tier, billing period and monthly grants", () => {
    expect(planInfo(PLUS_MONTHLY_PLAN_ID)).toEqual({ tier: "plus", interval: "monthly", points: 100, tokens: 25 });
    expect(planInfo(PLUS_YEARLY_PLAN_ID)).toEqual({ tier: "plus", interval: "yearly", points: 100, tokens: 25 });
    expect(planInfo(CLUB_MONTHLY_PLAN_ID)).toEqual({ tier: "club", interval: "monthly", points: 250, tokens: 75 });
    expect(planInfo(CLUB_YEARLY_PLAN_ID)).toEqual({ tier: "club", interval: "yearly", points: 250, tokens: 75 });
  });

  it("keeps the agreed membership prices", () => {
    const plus = MEMBERSHIPS.find((m) => m.tier === "plus")!;
    const club = MEMBERSHIPS.find((m) => m.tier === "club")!;
    expect([plus.monthly, plus.yearly]).toEqual(["2.99", "24.99"]);
    expect([club.monthly, club.yearly]).toEqual(["4.99", "44.99"]);
  });

  it("gives every membership card a real plan so none can show 'Coming soon'", () => {
    for (const m of MEMBERSHIPS) {
      expect(m.plans.monthly).toMatch(/^P-/);
      expect(m.plans.yearly).toMatch(/^P-/);
    }
  });
});
