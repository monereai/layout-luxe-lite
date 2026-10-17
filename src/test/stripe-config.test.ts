import { describe, expect, it } from "vitest";
import { checkoutPublishableKey } from "@/lib/stripe-config";

describe("Stripe production credentials", () => {
  it("uses the requested production publishable key", () => {
    expect(checkoutPublishableKey("pk_live_managed", true)).toBe("pk_live_51TMsQ9Q94lPfyPtisLpvsHzq08N4LvXg0wLzAXq4W2kAMwEzEOGMsxXPUvL5xm5NfnVmpci0wzNKHlGZ6jqw0YFB00wJHWxBJC");
  });
  it("keeps preview payments on the configured test account", () => {
    expect(checkoutPublishableKey("pk_test_isolated", false)).toBe("pk_test_isolated");
  });
  it("does not enable live checkout before managed go-live configuration", () => {
    expect(() => checkoutPublishableKey(undefined, true)).toThrow("go-live");
    expect(() => checkoutPublishableKey("pk_test_isolated", true)).toThrow("go-live");
  });
});