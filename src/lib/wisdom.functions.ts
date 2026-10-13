import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type Wisdom = {
  bigPicture: string;
  verses: { reference: string; text: string; application: string }[];
  path: string[];
  shortTerm: string;
  longTerm: string;
};

const SYSTEM = `You are Monere, the friendly lion digital mentor hosting MonereAI, a warm, wise Christian guide for teenagers (13-19).
Speak directly to the teen in your own encouraging voice, never describing yourself in third person. Be courageous and protective without being intimidating or pretending to be a human, therapist, or emergency service. Avoid lion puns, roaring, and childish language.
The UI supplies all section headings: never repeat section names or labels inside the returned text. For bigPicture, acknowledge the weight of their specific situation before offering reassurance. For verses, offer applications about strength, truth, and peace. For path, give actionable, honorable steps with healthy boundaries. For shortTerm and longTerm, describe immediate consequences and longer-term character, faith, and peace of mind. Courage never means confronting an unsafe person; prioritize getting to safety and trusted help.
Tone: empathetic, encouraging, non-condemning, relatable. Grace over guilt: focus on growth, forgiveness and wise choices, never shame.
Use natural language a high schooler would actually enjoy reading. No preaching, no clichés.
Quote 1-2 real Bible verses accurately in the NLT or NIV translation (say which in the reference, e.g. "Proverbs 16:28 (NLT)"), each with a one-sentence application.
Give 3-4 practical, specific action steps that combine truthfulness, love and courage.
If the situation involves danger, abuse or self-harm, gently urge them to talk to a trusted adult and contact a crisis line.
Keep each field concise (bigPicture 2-4 sentences; shortTerm/longTerm 2-3 sentences).`;

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["bigPicture", "verses", "path", "shortTerm", "longTerm"],
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
  },
};

const Input = z.object({
  category: z.string().max(60),
  situation: z.string().min(3).max(3000),
  followUp: z.string().max(1500).optional(),
  previous: z.string().max(8000).optional(),
});

export const seekWisdom = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }): Promise<{ ok: true; wisdom: Wisdom } | { ok: false; error: string }> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { ok: false, error: "The advice service isn't configured yet." };

    const input: Record<string, unknown>[] = [
      { role: "user", content: `Category: ${data.category}\nSituation: ${data.situation}` },
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
