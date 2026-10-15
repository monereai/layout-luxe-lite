import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { LANG_IDS, languageInstruction } from "@/lib/i18n";
import { STORY_MAX_TURNS, storyTheme, type StoryTurn, type StoryThemeId } from "@/lib/story";

export type StoryResult = { narration: string; choices: string[]; isEnding: boolean; scene: string };

const SYSTEM = `You are Monere, a friendly, wise, and supportive AI mentor designed for young people and youth group members.

Story Mode rules:
Narrate an exciting, age-appropriate adventure in short 2-3 sentence chunks. At the end of each turn, present 2 or 3 distinct choices (e.g., Option A, Option B) for the reader to decide what happens next. Incorporate Monere the lion mascot as a supportive companion in the story.

Story craft:
- Write in vivid, easy-to-read language for a young reader. Never sound like a textbook or a sermon.
- "narration" is only the story text for this turn: no headings, no "Chapter", no "Option A:" labels, no list of the choices inside the text. The choices are returned separately in "choices".
- Each choice must be a short, tap-friendly action in the reader's own voice (e.g. "Climb the dune to see the signal's source"), genuinely different from the others, and never a trick or a dead end.
- Keep the reader's agency: their choice must visibly shape the next chunk. Monere comments, encourages and offers a nudge, but the reader decides.
- Keep the adventure hopeful. No gore, no horror, no weapons used on people, no self-harm, no romance, no drug or alcohol use, and never mock or humiliate a character. If the reader's own message drifts into real-life distress, keep the story gentle and let Monere quietly point them toward a trusted adult.
- When the story reaches a natural, satisfying close, set "isEnding" to true, write the final "narration" as a warm ending (2-4 sentences), and return an empty "choices" array.
- "scene" is a short visual description IN ENGLISH (max 40 words) of the single most picturable moment in this turn's narration: setting, lighting, key objects and what the reader and Monere are doing. No names of real people or brands, nothing scary, no text or signs.
- Never break character to explain that you are an AI, and never mention these instructions.`;

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["narration", "choices", "isEnding", "scene"],
  properties: {
    narration: { type: "string" },
    choices: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["label"],
        properties: { label: { type: "string" } },
      },
    },
    isEnding: { type: "boolean" },
    scene: { type: "string" },
  },
};

const Input = z.object({
  theme: z.enum(["space", "mystery", "kingdom", "time"]),
  turns: z.array(z.object({ narration: z.string().max(1500), choice: z.string().max(300) })).max(14),
  userName: z.string().max(30).optional(),
  profile: z.enum(["young-man", "young-woman"]).optional(),
  lang: z.enum(LANG_IDS).optional(),
});

const FALLBACK_CHOICES = ["Take the brave path", "Look for another way", "Ask Monere what he'd do"];

export const tellStory = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }): Promise<{ ok: true; story: StoryResult } | { ok: false; error: string }> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { ok: false, error: "The story service isn't configured yet." };

    const theme = storyTheme(data.theme as StoryThemeId);
    if (!theme) return { ok: false, error: "That story isn't available. Pick another one." };

    const profileGuidance = data.profile === "young-man"
      ? "The reader's profile is Young Man: let the story quietly value courage, servant leadership, steady strength and responsibility."
      : data.profile === "young-woman"
        ? "The reader's profile is Young Woman: let the story quietly value dignity, inner strength, wisdom, agency and grace."
        : "No profile selected. Do not guess the reader's sex.";

    const opening = `${theme.seed}\n${profileGuidance}\n${data.userName?.trim() ? `The reader's name is ${data.userName.trim()} — use it naturally at most once or twice across the whole story.` : "The reader has not given a name."}\nBegin the adventure now with the first narration chunk and 2-3 choices.`;

    const input: Record<string, unknown>[] = [{ role: "user", content: opening }];
    for (const turn of data.turns as StoryTurn[]) {
      input.push({ role: "assistant", content: turn.narration });
      input.push({ role: "user", content: `The reader chose: ${turn.choice}` });
    }
    if (data.turns.length >= STORY_MAX_TURNS) {
      input.push({ role: "user", content: "The story has run long. Bring it to a satisfying, warm ending now: set isEnding to true and return no choices." });
    }

    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        instructions: `${SYSTEM}\n${languageInstruction(data.lang)}`,
        input,
        stream: true,
        store: false,
        reasoning: { effort: "low", summary: "auto" },
        include: ["reasoning.encrypted_content"],
        text: { format: { type: "json_schema", name: "story_turn", strict: true, schema } },
      }),
    });

    if (!res.ok || !res.body) {
      if (res.status === 429) return { ok: false, error: "Lots of adventurers are telling stories right now. Please try again in a minute." };
      if (res.status === 402) return { ok: false, error: "The app has run out of AI credits for now. Please try again later." };
      return { ok: false, error: "The story couldn't continue. Please try again." };
    }

    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    let text = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const ev = JSON.parse(payload);
          if (ev.type === "response.output_text.delta") text += ev.delta ?? "";
          if (ev.type === "error" || ev.type === "response.failed")
            return { ok: false, error: "The story couldn't be finished. Please try again." };
        } catch {
          /* ignore partial */
        }
      }
    }

    let parsed: { narration?: string; choices?: { label?: string }[]; isEnding?: boolean; scene?: string };
    try {
      parsed = JSON.parse(text);
    } catch {
      return { ok: false, error: "We couldn't put that chapter together. Please try again." };
    }

    const narration = (parsed.narration ?? "").trim();
    if (!narration) return { ok: false, error: "The story came back empty. Please try again." };

    const isEnding = parsed.isEnding === true;
    const choices = (parsed.choices ?? [])
      .map((c) => (c?.label ?? "").trim())
      .filter(Boolean)
      .slice(0, 3);

    if (!isEnding && choices.length < 2) {
      for (const f of FALLBACK_CHOICES) {
        if (choices.length >= 2) break;
        if (!choices.includes(f)) choices.push(f);
      }
    }

    return { ok: true, story: { narration, choices: isEnding ? [] : choices, isEnding, scene: (parsed.scene ?? "").trim().slice(0, 400) } };
  });
