import { describe, expect, it } from "vitest";
import { PROFILE_GUIDANCE, PROFILE_OPTIONS } from "@/lib/profile";

describe("profile-tailored guidance", () => {
  it("offers exactly the two requested onboarding profiles", () => {
    expect(PROFILE_OPTIONS.map((option) => option.label)).toEqual(["Young Man", "Young Woman"]);
  });

  it("uses the requested themes for a young man", () => {
    expect(PROFILE_GUIDANCE["young-man"]).toContain("courage");
    expect(PROFILE_GUIDANCE["young-man"]).toContain("leadership");
    expect(PROFILE_GUIDANCE["young-man"]).toContain("strength");
    expect(PROFILE_GUIDANCE["young-man"]).toContain("responsibility");
  });

  it("uses the requested themes for a young woman", () => {
    expect(PROFILE_GUIDANCE["young-woman"]).toContain("dignity");
    expect(PROFILE_GUIDANCE["young-woman"]).toContain("inner strength");
    expect(PROFILE_GUIDANCE["young-woman"]).toContain("wisdom");
    expect(PROFILE_GUIDANCE["young-woman"]).toContain("grace");
  });
});
