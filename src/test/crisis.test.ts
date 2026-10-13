import { describe, it, expect } from "vitest";
import { detectCrisis } from "@/lib/crisis";

describe("crisis guardrail", () => {
  it("flags self-harm mentions", () => {
    expect(detectCrisis("I keep thinking I want to hurt myself")).toBe(true);
    expect(detectCrisis("sometimes I feel suicidal")).toBe(true);
  });
  it("flags abuse mentions", () => {
    expect(detectCrisis("my stepdad hits me when he's angry")).toBe(true);
  });
  it("does not flag ordinary dilemmas", () => {
    expect(detectCrisis("My friends want me to gossip about someone")).toBe(false);
  });
});
