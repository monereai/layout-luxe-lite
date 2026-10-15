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
export const STORY_MAX_TURNS = 10;

export function storyTheme(id: StoryThemeId) {
  return STORY_THEMES.find((t) => t.id === id);
}
