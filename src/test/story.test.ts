import { describe, expect, it } from "vitest";
import { STORY_THEMES, storyTheme } from "@/lib/story";

describe("story mode", () => {
  it("offers exactly four distinct story themes", () => {
    expect(STORY_THEMES).toHaveLength(4);
    expect(new Set(STORY_THEMES.map((t) => t.id)).size).toBe(4);
    expect(new Set(STORY_THEMES.map((t) => t.name)).size).toBe(4);
  });

  it("every theme has a title, blurb and narrator seed", () => {
    expect(STORY_THEMES.every((t) => t.name.length > 0 && t.blurb.length > 0 && t.seed.length > 0 && t.emoji.length > 0)).toBe(true);
  });

  it("looks up a theme by id and rejects nothing else", () => {
    expect(storyTheme("mystery")?.name).toBe("Mystery Detective");
    expect(storyTheme("space")?.id).toBe("space");
  });

});
