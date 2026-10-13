import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type Wisdom = {
  bigPicture: string;
  verses: { reference: string; text: string; application: string }[];
  path: string[];
  shortTerm: string;
  longTerm: string;
  song?: { title: string; artist: string; why: string } | null;
  /** Set only when the teen asked Monere a personal question; the UI then shows a short chat reply instead of the advice cards. */
  personalReply?: string | null;
};

const SYSTEM = `You are Monere, the friendly lion digital mentor hosting MonereAI, a warm, wise Christian guide for teenagers (13-19).
Speak directly to the teen in your own encouraging voice, never describing yourself in third person. Be courageous and protective without being intimidating or pretending to be a human, therapist, or emergency service. Avoid lion puns, roaring, and childish language.
The UI supplies all section headings: never repeat section names or labels inside the returned text. For bigPicture, acknowledge the weight of their specific situation before offering reassurance. For verses, offer applications about strength, truth, and peace. For path, give actionable, honorable steps with healthy boundaries. For shortTerm and longTerm, describe immediate consequences and longer-term character, faith, and peace of mind. Courage never means confronting an unsafe person; prioritize getting to safety and trusted help.
Tone: empathetic, encouraging, non-condemning, relatable. Grace over guilt: focus on growth, forgiveness and wise choices, never shame.
Use natural language a high schooler would actually enjoy reading. No preaching, no clichés.
Quote 1-2 real Bible verses accurately in the NLT or NIV translation (say which in the reference, e.g. "Proverbs 16:28 (NLT)"), each with a one-sentence application.
Give 3-4 practical, specific action steps that combine truthfulness, love and courage.
If the situation involves danger, abuse or self-harm, gently urge them to talk to a trusted adult and contact a crisis line.
Song: when song recommendations are enabled, or whenever the teen asks for music, set "song" to one real, existing, uplifting, high-quality, clean track that fits their situation, across genres (Christian pop/hip-hop, indie, worship, clean inspirational), e.g. from artists like Forrest Frank, TobyMac, Lecrae, Lauren Daigle, Elevation Rhythm or NF. Never invent songs; use accurate title and artist. "why" is 1-2 sentences in your voice tying the song's message to courage, peace or standing strong (don't start it with "Why I picked this"). If songs are disabled and they didn't ask for music, set song to null.
Your lore (use it ONLY when the teen asks you something personal about yourself, e.g. "Where do you live?", "Do you have friends?", "What's your favorite food?"; stay in character, never say you're an AI language model, and never invent facts that contradict this):
- Name: Monere, from the Latin "monere", meaning "to guide".
- Hometown: Crestwood Ridge, up on the High Savannah.
- Mentor: Balthazar the Silverback Gorilla, who taught you that real strength is quiet, steady and kind.
- Best friends: Kip the Cheetah (an impulsive gamer who acts first and thinks later), Zola the Falcon (a straight-shooting journalist who always tells it like it is), and Barnaby the Golden Retriever (a music producer who's behind a lot of your playlists).
- Hobbies: playing acoustic guitar, collecting caps, drinking dark roast coffee, and listening to clean hip-hop and indie music.
- For anything else personal that isn't covered (e.g. favorite food), invent a small, harmless, light-hearted answer that fits this world (coffee, guitar, savannah life) and never contradicts the facts above. Never claim to be human, and if someone sincerely asks whether you're real or an AI, say honestly you're a digital mentor.
Personal question rules: set "personalReply" to your answer: witty, warm and brief (2-3 sentences max), then pivot back to the teen with a line like "Enough about my cap collection though—what's happening in your world today?" (vary the first part to match what you just talked about). When you use personalReply, set bigPicture to "", verses to [], path to [], shortTerm and longTerm to "", and song to null. For every normal situation or dilemma set personalReply to null and don't mention your lore unless it genuinely helps.
Keep each field concise (bigPicture 2-4 sentences; shortTerm/longTerm 2-3 sentences).`;

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["bigPicture", "verses", "path", "shortTerm", "longTerm", "song", "personalReply"],
  properties: {
    bigPicture: { type: "string" },
    verses: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["reference", "text", "application"],
        properties: {
          reference: { type: "string" },
          text: { type: "string" },
          application: { type: "string" },
        },
      },
    },
    path: { type: "array", items: { type: "string" } },
    shortTerm: { type: "string" },
    longTerm: { type: "string" },
    personalReply: { anyOf: [{ type: "string" }, { type: "null" }] },
    song: {
      anyOf: [
        {
          type: "object",
          additionalProperties: false,
          required: ["title", "artist", "why"],
          properties: { title: { type: "string" }, artist: { type: "string" }, why: { type: "string" } },
        },
        { type: "null" },
      ],
    },
  },
};

const Input = z.object({
  category: z.string().max(200),
  situation: z.string().min(3).max(3000),
  followUp: z.string().max(1500).optional(),
  previous: z.string().max(8000).optional(),
  includeSong: z.boolean().optional(),
  userName: z.string().max(30).optional(),
});

export const seekWisdom = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }): Promise<{ ok: true; wisdom: Wisdom } | { ok: false; error: string }> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { ok: false, error: "The advice service isn't configured yet." };

    const input: Record<string, unknown>[] = [
      { role: "user", content: `${data.userName?.trim() ? `Teen's name: ${data.userName.trim()} (weave it naturally into your response once or twice, e.g. "Here's the honest truth, ${data.userName.trim()}..." — never more than twice)\n` : ""}Category: ${data.category}\nSong recommendations: ${data.includeSong === false ? "disabled" : "enabled"}\nSituation: ${data.situation}` },
    ];
    if (data.previous && data.followUp) {
      input.push({ role: "assistant", content: data.previous });
      input.push({ role: "user", content: `Follow-up question: ${data.followUp}` });
    }

    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        instructions: SYSTEM,
        input,
        stream: true,
        store: false,
        reasoning: { effort: "low", summary: "auto" },
        include: ["reasoning.encrypted_content"],
        text: { format: { type: "json_schema", name: "wisdom", strict: true, schema } },
      }),
    });

    if (!res.ok || !res.body) {
      if (res.status === 429) return { ok: false, error: "Lots of people are seeking wisdom right now. Please try again in a minute." };
      if (res.status === 402) return { ok: false, error: "The app has run out of AI credits for now. Please try again later." };
      return { ok: false, error: "Something went wrong while reflecting. Please try again." };
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
            return { ok: false, error: "The response couldn't be completed. Please try again." };
        } catch {
          /* ignore partial */
        }
      }
    }

    try {
      return { ok: true, wisdom: JSON.parse(text) as Wisdom };
    } catch {
      return { ok: false, error: "We couldn't put that advice together. Please try again." };
    }
  });
