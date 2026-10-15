import { createFileRoute } from "@tanstack/react-router";
import { generateImage, imageSettings } from "@/lib/image-gateway.server";

const STYLE =
  "Rich, vibrant, magical cartoon illustration, 2D storybook style, featuring a friendly lion cub mascot with a small backpack in the scene. Wide 16:9 composition, no text or lettering.";

export const Route = createFileRoute("/api/story-image")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: { scene?: unknown; stream?: unknown };
        try {
          body = await request.json();
        } catch {
          return new Response("Invalid request", { status: 400 });
        }
        const scene = typeof body.scene === "string" ? body.scene.trim().slice(0, 400) : "";
        if (!scene) return new Response("A scene is required", { status: 400 });
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        const upstream = await generateImage(
          { ...imageSettings, apiKey },
          `${STYLE} ${scene}`,
          body.stream !== false,
          undefined,
          { quality: "low", size: "1536x1024" },
        );
        return new Response(upstream.body, {
          status: upstream.status,
          headers: {
            "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
            "Cache-Control": "no-cache",
          },
        });
      },
    },
  },
});
