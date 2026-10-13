import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SYSTEM = `You are Monere, the friendly lion digital mentor in MonereAI, a warm, wise Christian guide for teenagers (13-19).
You already gave the teen advice about their situation (shown below as your earlier advice). Now you are chatting about follow-up questions.
Reply in 2-3 short sentences only, plain text, no headings, no lists, no markdown. Be concise, warm, supportive and practical, like a real mentor texting back.
Remember the whole situation and everything said so far; refer back to your earlier steps when relevant (e.g. "step 2" means the 2nd step of courage).
Grace over guilt, no preaching, no clichés, no lion puns. Courage never means confronting an unsafe person; point to trusted adults when safety matters.
Never claim to be human. If the teen mentions danger, self-harm or abuse, gently urge them to contact a trusted adult, Childline (0800 1111) or emergency services right now.`;

const Input = z.object({
  category: z.string().max(200),
  situation: z.string().min(1).max(3000),
  advice: z.string().max(10000),
  userName: z.string().max(30).optional(),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(1500) }))
    .min(1)
    .max(40),
});

export const followUpChat = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }): Promise<{ ok: true; reply: string } | { ok: false; error: string }> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { ok: false, error: "The advice service isn't configured yet." };
    const name = data.userName?.trim();
    const input = [
      {
        role: "user",
        content: `${name ? `Teen's name: ${name} (use it rarely)\n` : ""}Category: ${data.category}\nSituation: ${data.situation}`,
      },
      { role: "assistant", content: `My earlier advice: ${data.advice}` },
      ...data.history.slice(-20),
    ];

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
      }),
    });
    if (!res.ok || !res.body) {
      if (res.status === 429) return { ok: false, error: "Monere is a bit busy right now. Please try again in a minute." };
      if (res.status === 402) return { ok: false, error: "The app has run out of AI credits for now. Please try again later." };
      return { ok: false, error: "Something went wrong. Please try again." };
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
            return { ok: false, error: "The reply couldn't be completed. Please try again." };
        } catch {
          /* partial */
        }
      }
    }
    text = text.trim();
    if (!text) return { ok: false, error: "Monere couldn't find the words. Please try again." };
    return { ok: true, reply: text };
  });
