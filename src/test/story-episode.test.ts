import { describe, expect, it } from "vitest";
import { CHAPTER_BONUS, EPISODE_MAX_TURNS, EPISODE_MIN_TURNS, daysUntilNextEpisode, episodeFor, episodeNumber } from "@/lib/story";

describe("weekly episode", () => {
  it("week of 12 Oct 2026 is Episode 4: The Mystery of the Sunken Compass", () => {
    const n = episodeNumber(Date.UTC(2026, 9, 15, 18));
    expect(n).toBe(4);
    expect(episodeFor(n).title).toBe("The Mystery of the Sunken Compass");
  });
  it("a new episode starts every Monday", () => {
    expect(episodeNumber(Date.UTC(2026, 9, 18, 23))).toBe(4);
    expect(episodeNumber(Date.UTC(2026, 9, 19, 0))).toBe(5);
    expect(daysUntilNextEpisode(Date.UTC(2026, 9, 18, 12))).toBe(1);
  });
  it("5 to 7 turns and a +100 chapter bonus", () => {
    expect([EPISODE_MIN_TURNS, EPISODE_MAX_TURNS, CHAPTER_BONUS]).toEqual([5, 7, 100]);
  });
});
