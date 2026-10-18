import { describe, expect, it } from "vitest";
import { oauthReturnPath } from "@/lib/oauth-return-path";
describe("OAuth sign-in return boundary", () => {
  it("preserves the consent authorization and fragment", () => {
    expect(oauthReturnPath("/.lovable/oauth/consent?authorization_id=request-1#review")).toBe("/.lovable/oauth/consent?authorization_id=request-1#review");
  });
  it.each(["https://outside.invalid", "//outside.invalid", "/\\outside.invalid", "/\noutside.invalid", undefined, 0])("rejects unsafe return %s", value => {
    expect(oauthReturnPath(value)).toBe("/");
  });
});
