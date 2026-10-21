import { createFileRoute } from "@tanstack/react-router";
import { generateImage, imageSettings } from "@/lib/image-gateway.server";

const STYLE =
  "Rich, vibrant, magical cartoon illustration, 2D storybook style, featuring a friendly lion cub mascot with a small backpack in the scene. Wide 16:9 composition, no text or lettering.";
const BUCKET = "story-images";
const CACHE = "private, max-age=86400";

async function sceneKey(scene: string) {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(scene.toLowerCase().replace(/\s+/g, " "))));
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}
const toB64 = (buf: ArrayBuffer) => {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
};
const fromB64 = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

function imageResponse(b64: string, stream: boolean) {
  if (!stream) return Response.json({ data: [{ b64_json: b64 }] }, { headers: { "Cache-Control": CACHE } });
  const event = `event: image_generation.completed\ndata: ${JSON.stringify({ type: "image_generation.completed", b64_json: b64 })}\n\n`;
  return new Response(event, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" } });
}

export const Route = createFileRoute("/api/story-image")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
        if (!token) return new Response("Sign in required", { status: 401 });
        const { createClient } = await import("@supabase/supabase-js");
        const sb = createClient(process.env["SUPABASE_URL"]!, process.env["SUPABASE_PUBLISHABLE_KEY"]!, { auth: { persistSession: false } });
        const { data: claims, error: authError } = await sb.auth.getClaims(token);
        if (authError || !claims?.claims?.sub) return new Response("Sign in required", { status: 401 });
        let body: { scene?: unknown; stream?: unknown };
        try {
          body = await request.json();
        } catch {
          return new Response("Invalid request", { status: 400 });
        }
        const scene = typeof body.scene === "string" ? body.scene.trim().slice(0, 400) : "";
        if (!scene) return new Response("A scene is required", { status: 400 });
        const stream = body.stream !== false;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const key = await sceneKey(scene);

        // Reuse a picture already painted for this exact scene — no new AI cost.
        const { data: hit } = await supabaseAdmin.from("story_images").select("path").eq("scene_hash", key).maybeSingle();
        if (hit) {
          const { data: file } = await supabaseAdmin.storage.from(BUCKET).download(hit.path);
          if (file) return imageResponse(toB64(await file.arrayBuffer()), stream);
        }

        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        const upstream = await generateImage({ ...imageSettings, apiKey }, `${STYLE} ${scene}`, stream, undefined, { quality: "low", size: "1536x1024" });
        const save = async (b64: string) => {
          const path = `${key}.png`;
          const { error } = await supabaseAdmin.storage.from(BUCKET).upload(path, fromB64(b64), { contentType: "image/png", upsert: true });
          if (!error) await supabaseAdmin.from("story_images").upsert({ scene_hash: key, path });
        };
        if (!upstream.ok || !upstream.body) return new Response(upstream.body, { status: upstream.status });

        if (!stream) {
          const json = (await upstream.json()) as { data?: { b64_json?: string }[] };
          const b64 = json.data?.[0]?.b64_json;
          if (b64) await save(b64).catch(() => {});
          return Response.json(json, { headers: { "Cache-Control": CACHE } });
        }

        // Pass the live stream through and keep the finished picture once it arrives.
        const decoder = new TextDecoder();
        let text = "";
        const capture = new TransformStream<Uint8Array, Uint8Array>({
          transform(chunk, ctl) { text += decoder.decode(chunk, { stream: true }); ctl.enqueue(chunk); },
          async flush() {
            const m = text.match(/"type"\s*:\s*"image_generation\.completed"[^\n]*/);
            const b64 = m?.[0].match(/"b64_json"\s*:\s*"([^"]+)"/)?.[1];
            if (b64) await save(b64).catch(() => {});
          },
        });
        return new Response(upstream.body.pipeThrough(capture), {
          status: upstream.status,
          headers: { "Content-Type": upstream.headers.get("Content-Type") ?? "text/event-stream", "Cache-Control": "no-cache" },
        });
      },
    },
  },
});
