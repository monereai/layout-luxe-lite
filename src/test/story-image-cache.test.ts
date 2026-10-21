import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  generate: vi.fn(), lookup: vi.fn(), upload: vi.fn(), save: vi.fn(), sign: vi.fn(),
}));
vi.mock("@tanstack/react-router", () => ({ createFileRoute: () => (config: unknown) => config }));
vi.mock("@/lib/image-gateway.server", () => ({ generateImage: mocks.generate, imageSettings: {} }));
vi.mock("@supabase/supabase-js", () => ({ createClient: () => ({ auth: { getClaims: async () => ({ data: { claims: { sub: "qa-user" } } }) } }) }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: {
  from: () => ({ select: () => ({ eq: () => ({ maybeSingle: mocks.lookup }) }), upsert: mocks.save }),
  storage: { from: () => ({ upload: mocks.upload, createSignedUrl: mocks.sign }) },
} }));

import { Route } from "@/routes/api/story-image";
const handler = (Route as unknown as { server: { handlers: { POST: (args: { request: Request }) => Promise<Response> } } }).server.handlers.POST;
function request() {
  return new Request("http://localhost/api/story-image", { method: "POST", headers: { Authorization: "Bearer qa-token", "Content-Type": "application/json" }, body: JSON.stringify({ scene: "A forest scene", stream: true }) });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("LOVABLE_API_KEY", "test-key");
  vi.stubEnv("SUPABASE_URL", "https://example.test");
  vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "test-key");
});

describe("story image saved-picture reuse", () => {
  it("saves the first completed image and returns a URL on the second request without generating again", async () => {
    let path: string | undefined;
    mocks.lookup.mockImplementation(async () => ({ data: path ? { path } : null }));
    mocks.upload.mockResolvedValue({ error: null });
    mocks.save.mockImplementation(async (row: { path: string }) => { path = row.path; return { error: null }; });
    mocks.sign.mockResolvedValue({ data: { signedUrl: "https://example.test/saved.png" } });
    mocks.generate.mockResolvedValue(new Response('event: image_generation.completed\ndata: {"type":"image_generation.completed","b64_json":"aW1hZ2U="}\n\n', { headers: { "Content-Type": "text/event-stream" } }));
    const first = await handler({ request: request() });
    await first.text();
    expect(first.headers.get("X-Story-Image-Cache")).toBe("MISS");
    expect(mocks.upload).toHaveBeenCalledTimes(1);
    const second = await handler({ request: request() });
    expect(await second.json()).toEqual({ url: "https://example.test/saved.png", cached: true });
    expect(second.headers.get("X-Story-Image-Cache")).toBe("HIT");
    expect(mocks.generate).toHaveBeenCalledTimes(1);
  });

  it("never caches an image from a refused stream", async () => {
    mocks.lookup.mockResolvedValue({ data: null });
    mocks.generate.mockResolvedValue(new Response('event: image_generation.completed\ndata: {"b64_json":"aW1hZ2U="}\n\nevent: error\ndata: {"type":"error","error":{"message":"Picture refused"}}\n\n'));
    const result = await handler({ request: request() });
    await result.text();
    expect(mocks.upload).not.toHaveBeenCalled();
    expect(mocks.save).not.toHaveBeenCalled();
    expect(mocks.generate).toHaveBeenCalledTimes(1);
  });

  it("does not regenerate a known saved scene when storage URL creation fails", async () => {
    mocks.lookup.mockResolvedValue({ data: { path: "saved.png" } });
    mocks.sign.mockResolvedValue({ data: null });
    const response = await handler({ request: request() });
    expect(response.status).toBe(503);
    expect(mocks.generate).not.toHaveBeenCalled();
  });
});