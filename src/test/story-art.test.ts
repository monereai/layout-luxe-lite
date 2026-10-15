import { describe, expect, it } from "vitest";
import { FALLBACK_ART, THEME_ART, fallbackArt } from "@/lib/story-art";
import { STORY_THEMES } from "@/lib/story";

describe("story fallback art", () => {
  it("has at least 5 general illustrations", () => {
    expect(Object.keys(FALLBACK_ART).length).toBeGreaterThanOrEqual(5);
  });
  it("every story topic maps to its matching background first", () => {
    for (const t of STORY_THEMES) expect(THEME_ART[t.id].length).toBeGreaterThan(0);
    expect(fallbackArt("space", 0)).toBe(FALLBACK_ART.space);
    expect(fallbackArt("kingdom", 0)).toBe(FALLBACK_ART.castle);
  });
});
