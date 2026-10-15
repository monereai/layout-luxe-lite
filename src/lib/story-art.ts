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

const SCENE_WORDS: Record<FallbackArtId, RegExp> = {
  space: /\b(space|star|stars|planet|moon|moons|comet|rocket|ship|starship|cockpit|galaxy|orbit|signal|astronaut)\b/i,
  submarine: /\b(submarine|underwater|undersea|ocean|sea|lake|water|diving|dive|bell|boat|boathouse|ripples|sunken|fish)\b/i,
  forest: /\b(forest|woods|woodland|trees?|jungle|path|trail|garden|greenhouse|meadow|leaves)\b/i,
  castle: /\b(castle|kingdom|tower|bell tower|lantern|throne|palace|knight|royal|gate|courtyard)\b/i,
  detective: /\b(clue|clues|detective|mystery|trophy|footprints?|note|map|hall|corridor|school|library|magnifying)\b/i,
  clock: /\b(clock|time|hour|hours|letter|yesterday|tomorrow|pendulum|tick|ticking|portal|door)\b/i,
};

/**
 * Ready-made picture for ONE story segment, chosen from that segment's own scene
 * description (plot/choice), then from the story topic. This is never the
 * weekly title banner's job — the banner uses fallbackArt() on the start screen only.
 */
export function sceneFallbackArt(theme: StoryThemeId, segment: number, scene: string): string {
  const themed = THEME_ART[theme];
  const ids = Object.keys(SCENE_WORDS) as FallbackArtId[];
  const text = scene || "";
  // Prefer matches within the story's own topic, then any topic.
  const hit = themed.find((id) => SCENE_WORDS[id].test(text)) ?? ids.find((id) => SCENE_WORDS[id].test(text));
  if (hit) return FALLBACK_ART[hit];
  return FALLBACK_ART[themed[segment % themed.length] ?? "space"];
}

/** How long to wait for a painted scene before showing the ready-made picture with the chapter text. */
export const SCENE_WAIT_MS = 10000;

/**
 * Resolve with the painted scene as soon as it's ready, or with the matching
 * ready-made backup once SCENE_WAIT_MS has passed and it's still pending.
 */
export function raceSceneBackup(backup: string, painted: Promise<string>, waitMs = SCENE_WAIT_MS): Promise<string> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(backup), waitMs);
    painted.then(
      (src) => {
        clearTimeout(timer);
        resolve(src);
      },
      () => {
        clearTimeout(timer);
        resolve(backup);
      },
    );
  });
}
