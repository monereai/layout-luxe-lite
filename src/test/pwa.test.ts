import { describe, expect, it } from "vitest";
import { isAppWorkerBlocked } from "@/lib/pwa";

describe("app-worker preview safety", () => {
  it.each(["id-preview--app.lovable.app", "preview-v2--app.gpt-eng.com", "id-preview-123--app.gptengineer.run", "project--app-dev.lovable.app", "app.lovableproject.com", "beta.lovable.dev"])("blocks %s even in production", host => {
    expect(isAppWorkerBlocked(host, true, false, "")).toBe(true);
  });
  it("keeps published domains eligible", () => {
    expect(isAppWorkerBlocked("monereai.com", true, false, "")).toBe(false);
    expect(isAppWorkerBlocked("preview-v2--shop.example.com", true, false, "")).toBe(false);
  });
  it("blocks development, iframes and the kill switch", () => {
    expect(isAppWorkerBlocked("monereai.com", false, false, "")).toBe(true);
    expect(isAppWorkerBlocked("monereai.com", true, true, "")).toBe(true);
    expect(isAppWorkerBlocked("monereai.com", true, false, "?sw=off")).toBe(true);
  });
});