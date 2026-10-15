import { describe, expect, it } from "vitest";
import { FALLBACK_ART, SCENE_WAIT_MS, THEME_ART, fallbackArt, raceSceneBackup } from "@/lib/story-art";
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
  it("waits at most 10 seconds for a painted scene", () => {
    expect(SCENE_WAIT_MS).toBe(10000);
  });
  it("shows the ready-made backup while the painted scene is still pending", async () => {
    const started = Date.now();
    const src = await raceSceneBackup("backup.jpg", new Promise<string>(() => {}), 20);
    expect(src).toBe("backup.jpg");
    expect(Date.now() - started).toBeLessThan(500);
  });
  it("shows the painted scene when it finishes in time", async () => {
    const painted = new Promise<string>((resolve) => setTimeout(() => resolve("painted.jpg"), 5));
    expect(await raceSceneBackup("backup.jpg", painted, 2000)).toBe("painted.jpg");
  });
});

import { sceneFallbackArt } from "@/lib/story-art";
import { describe as d2, expect as e2, it as i2 } from "vitest";

d2("sceneFallbackArt", () => {
  i2("picks a picture from the segment's own scene, not the title picture", () => {
    e2(sceneFallbackArt("mystery", 2, "You and Monere row toward the old boathouse as ripples spread")).toBe(FALLBACK_ART.submarine);
    e2(sceneFallbackArt("mystery", 1, "Deep in the whispering forest, a trail of footprints")).toBe(FALLBACK_ART.forest);
  });
  i2("alternates themed pictures by segment when the scene has no keywords", () => {
    e2(sceneFallbackArt("kingdom", 0, "")).toBe(FALLBACK_ART.castle);
    e2(sceneFallbackArt("kingdom", 1, "")).toBe(FALLBACK_ART.forest);
  });
});
