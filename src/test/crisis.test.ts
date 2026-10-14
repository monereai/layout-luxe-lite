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

import { SAFETY } from "@/lib/safety";
import { detectCrisis as dc } from "@/lib/crisis";
describe("localized helplines", () => {
  it("routes the requested numbers per language", () => {
    expect(SAFETY.es.lines.map((l) => l.href)).toEqual(["tel:024", "tel:116111"]);
    expect(SAFETY.fr.lines.map((l) => l.href)).toEqual(["tel:3114", "tel:119"]);
    expect(SAFETY.pt.lines.map((l) => l.href)).toEqual(["tel:188", "tel:1417"]);
    expect(SAFETY.de.lines.map((l) => l.href)).toEqual(["tel:116111"]);
    expect(SAFETY.en.lines.map((l) => l.href)).toEqual(["tel:08001111", "sms:85258?body=SHOUT"]);
  });
  it("detects crisis wording in other languages", () => {
    for (const t of ["quiero morir", "je veux mourir", "quero morrer", "ich will sterben"]) expect(dc(t)).toBe(true);
  });
});
