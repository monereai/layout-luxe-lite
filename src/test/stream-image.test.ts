import { afterEach, describe, expect, it, vi } from "vitest";
import { streamImage } from "@/lib/stream-image";

afterEach(() => vi.unstubAllGlobals());

describe("story image transport", () => {
  it("renders a saved private URL with only one request", async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json({ url: "https://example.test/saved.png", cached: true }));
    vi.stubGlobal("fetch", fetch);
    const frame = vi.fn();
    await streamImage("/api/story-image", { scene: "saved scene" }, frame);
    expect(frame).toHaveBeenCalledWith("https://example.test/saved.png", true);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("surfaces an HTTP refusal without replay", async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json({ error: { message: "Your request was rejected by the safety system." } }, { status: 400 }));
    vi.stubGlobal("fetch", fetch);
    await expect(streamImage("/api/story-image", { scene: "scene" }, vi.fn())).rejects.toThrow("Your request was rejected by the safety system.");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("stops on a streamed refusal even if a completion follows", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response('event: error\ndata: {"error":{"message":"Picture refused"}}\n\nevent: image_generation.completed\ndata: {"b64_json":"invalid"}\n\n', { headers: { "Content-Type": "text/event-stream" } }));
    vi.stubGlobal("fetch", fetch);
    const frame = vi.fn();
    await expect(streamImage("/api/story-image", { scene: "scene" }, frame)).rejects.toThrow("Picture refused");
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(frame).not.toHaveBeenCalled();
  });
});