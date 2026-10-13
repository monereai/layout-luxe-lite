import { describe, expect, it } from "vitest";
import { canAsk, usedToday, FREE_DAILY_LIMIT } from "@/lib/usage";

describe("daily free limit", () => {
  it("allows 3 free queries per day", () => {
    expect(FREE_DAILY_LIMIT).toBe(3);
    expect(canAsk(0, false)).toBe(true);
    expect(canAsk(2, false)).toBe(true);
  });
  it("blocks the 4th free query of the day", () => {
    expect(canAsk(3, false)).toBe(false);
  });
  it("premium users are unlimited", () => {
    expect(canAsk(50, true)).toBe(true);
  });
  it("resets on a new day", () => {
    const now = new Date("2026-10-14T09:00:00Z");
    expect(usedToday({ date: "2026-10-13", count: 3 }, now)).toBe(0);
    expect(usedToday({ date: "2026-10-14", count: 2 }, now)).toBe(2);
  });
});
