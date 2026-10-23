import { describe, expect, it, vi } from "vitest";
import { validCloudConfig } from "@/lib/cloud-config";
import { createOfflineClient } from "@/lib/cloud-client";

describe("Cloud boot safeguard", () => {
  it.each([[undefined, undefined], ["", ""], ["https://your-project.example", "your-key"], ["not-a-url", "sb_publishable_abcdefghijklmnop"], ["https://service.test", "placeholder"], ["https://service.test", "sb_secret_abcdefghijklmnop"]])("rejects missing, invalid or placeholder configuration", (url, key) => {
    expect(validCloudConfig(url, key)).toBe(false);
  });
  it("accepts valid public configuration", () => { expect(validCloudConfig("https://service.test", "sb_publishable_abcdefghijklmnop")).toBe(true); });
  it("mounts signed out and denies reads and writes without network requests", async () => {
    const network = vi.spyOn(globalThis, "fetch");
    const client = createOfflineClient();
    expect((await client.auth.getSession()).data.session).toBeNull();
    expect((await client.auth.getUser()).data.user).toBeNull();
    expect((await client.from("profiles").select("user_id")).error?.code).toBe("CLOUD_UNAVAILABLE");
    expect((await client.auth.signInWithPassword({ email: "test@example.test", password: "not-a-real-password" })).error).toBeTruthy();
    expect(network).not.toHaveBeenCalled(); network.mockRestore();
  });
});