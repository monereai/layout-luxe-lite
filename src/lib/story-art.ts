import castle from "@/assets/story/castle.jpg";
import clock from "@/assets/story/clock.jpg";
import detective from "@/assets/story/detective.jpg";
import forest from "@/assets/story/forest.jpg";
import space from "@/assets/story/space.jpg";
import submarine from "@/assets/story/submarine.jpg";
import type { StoryThemeId } from "@/lib/story";

/** Ready-made illustrations shown when a live scene picture can't be made. */
export const FALLBACK_ART = { space, forest, castle, submarine, detective, clock } as const;
export type FallbackArtId = keyof typeof FALLBACK_ART;

/** Matching backgrounds per story topic; the first is the main one. */
export const THEME_ART: Record<StoryThemeId, FallbackArtId[]> = {
  space: ["space", "submarine"],
  mystery: ["detective", "forest"],
  kingdom: ["castle", "forest"],
  time: ["clock", "castle"],
};

/** Always the topic's own picture, so a Space story never shows a submarine. */
export function fallbackArt(theme: StoryThemeId, _segment = 0): string {
  return FALLBACK_ART[THEME_ART[theme][0] ?? "space"];
}
