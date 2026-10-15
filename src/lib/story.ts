export type StoryThemeId = "space" | "mystery" | "kingdom" | "time";

export type StoryTheme = {
  id: StoryThemeId;
  name: string;
  emoji: string;
  blurb: string;
  /** Setting + hook handed to the narrator so every story opens in the right world. */
  seed: string;
};

export const STORY_THEMES: StoryTheme[] = [
  {
    id: "space",
    name: "Space Adventure",
    emoji: "🚀",
    blurb: "Blast off from the Crestwood Spaceport and chart a planet nobody has ever mapped.",
    seed: "A space adventure. The reader and Monere are a two-person crew aboard the starship Savannah's Roar, launched from the Crestwood Spaceport. They have just received a strange, friendly-looking signal from an uncharted planet with three moons. Keep the science wondrous but simple (no hard numbers), and let curiosity, teamwork and patience matter more than firepower.",
  },
  {
    id: "mystery",
    name: "Mystery Detective",
    emoji: "🕵️",
    blurb: "The trophy vanished from the youth hall minutes before the ceremony. Follow the clues.",
    seed: "A cosy, funny detective mystery. The reader is the junior detective and Monere is their partner at the Crestwood Ridge youth hall, where the golden trophy has vanished minutes before the awards ceremony. Clues are honest and kind (a muddy paw print, a torn programme, a half-finished coffee), no real crime or violence, and the resolution should protect everyone's dignity, including the person who took it.",
  },
  {
    id: "kingdom",
    name: "Magical Kingdom",
    emoji: "🏰",
    blurb: "The Kingdom of High Savannah needs a keeper of the lantern that keeps the dark out.",
    seed: "A gentle fantasy in the Kingdom of High Savannah, where a great lantern on the hill keeps the long winter dark away and its light has begun to fade. The reader is called to be its new keeper and Monere is the kingdom's guardian who walks beside them. Magic is warm and never scary; courage, honesty and mercy decide the story, not a battle.",
  },
  {
    id: "time",
    name: "Time Traveler",
    emoji: "⏳",
    blurb: "Monere's grandfather clock opens a door to yesterday — and one small choice keeps changing.",
    seed: "A time-travel adventure. In Balthazar's study stands a grandfather clock that opens a door to one hour earlier in the reader's own day, and each visit shows what one small choice would have changed. The reader and Monere can adjust the past but never force another person's heart. Keep it warm and a little funny, and let the lesson be about the choice in front of them now.",
  },
];

/** A narration already shown plus the choice the reader tapped for it. */
export type StoryTurn = { narration: string; choice: string };

/** After this many turns the narrator is asked to bring the story to a close. */
export const STORY_MAX_TURNS = 7;

export function storyTheme(id: StoryThemeId) {
  return STORY_THEMES.find((t) => t.id === id);
}

/** Weekly Interactive Adventure: one featured episode per week, new every Monday. */
export type Episode = { title: string; theme: StoryThemeId; blurb: string; seed: string };

/** Episode 1 aired the week starting Monday 21 Sep 2026 (UTC). */
export const EPISODE_EPOCH = Date.UTC(2026, 8, 21);
export const EPISODE_MIN_TURNS = 5;
export const EPISODE_MAX_TURNS = 7;
export const CHAPTER_BONUS = 100;
const WEEK = 7 * 24 * 60 * 60 * 1000;

export const EPISODES: Episode[] = [
  { title: "The Signal from Three Moons", theme: "space", blurb: "A friendly signal from an uncharted planet calls the starship Savannah's Roar.", seed: STORY_THEMES[0]!.seed },
  { title: "The Vanished Trophy", theme: "mystery", blurb: "The golden trophy disappeared minutes before the ceremony.", seed: STORY_THEMES[1]!.seed },
  { title: "The Fading Lantern", theme: "kingdom", blurb: "The great lantern of High Savannah is dimming — and it needs a keeper.", seed: STORY_THEMES[2]!.seed },
  { title: "The Mystery of the Sunken Compass", theme: "mystery", blurb: "A brass compass that points to whatever you need most has sunk in Crestwood Lake.", seed: "A cosy mystery adventure. An old brass compass that always points toward what a person truly needs has been lost in the shallow, sunlit waters of Crestwood Lake. The reader and Monere follow honest, kind clues (a soggy map, a fisherman's note, ripples near the old boathouse) by rowing boat and small friendly diving bell. No danger to anyone, no villains, and the resolution is about honesty and generosity." },
  { title: "The Clock That Ran Backwards", theme: "time", blurb: "Balthazar's grandfather clock opens a door to one hour earlier.", seed: STORY_THEMES[3]!.seed },
  { title: "The Comet Garden", theme: "space", blurb: "A comet has left glowing seeds across the moon base greenhouse.", seed: "A space adventure on a cosy moon base greenhouse where a passing comet has scattered glowing seeds that grow into surprising plants overnight. The reader and Monere must work out what the seeds need and who they belong to. Wondrous, simple science, teamwork and patience." },
  { title: "The Silent Bell Tower", theme: "kingdom", blurb: "The kingdom's bell has stopped ringing, and nobody knows why.", seed: "A gentle fantasy in the Kingdom of High Savannah, where the old bell tower that rings for every festival has fallen silent. The reader and Monere climb, ask and listen to discover why. Magic is warm, never scary; kindness and courage solve it." },
  { title: "Yesterday's Letter", theme: "time", blurb: "A letter arrives postmarked tomorrow, written in the reader's own handwriting.", seed: "A time-travel adventure. A letter arrives postmarked tomorrow, in the reader's own handwriting, asking them to help someone today. The reader and Monere follow its hints. Warm and a little funny; the lesson is about the choice in front of them now." },
];

/** Episode number (1-based) for the week containing `now`. */
export function episodeNumber(now: number = Date.now()) {
  return Math.max(1, Math.floor((now - EPISODE_EPOCH) / WEEK) + 1);
}

export function episodeFor(num: number): Episode {
  return EPISODES[(num - 1) % EPISODES.length]!;
}

/** Whole days until next Monday 00:00 UTC (1–7). */
export function daysUntilNextEpisode(now: number = Date.now()) {
  const next = EPISODE_EPOCH + episodeNumber(now) * WEEK;
  return Math.max(1, Math.ceil((next - now) / (24 * 60 * 60 * 1000)));
}
