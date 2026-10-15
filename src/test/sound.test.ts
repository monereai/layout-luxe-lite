import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { playChime } from "@/lib/sound";

let started: number[] = [];
let realAudioContext: unknown;

class FakeAudioContext {
  currentTime = 0;
  state = "running";
  destination = {};
  createOscillator() {
    const node = {
      frequency: { value: 0 },
      type: "",
      connect: () => node,
      start: (t: number) => started.push(t),
      stop: () => {},
    };
    return node;
  }
  createGain() {
    return { gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, connect: () => ({ connect: () => {} }) };
  }
}

beforeEach(() => {
  started = [];
  realAudioContext = globalThis.AudioContext;
  globalThis.AudioContext = FakeAudioContext as unknown as typeof AudioContext;
});

afterEach(() => {
  globalThis.AudioContext = realAudioContext as typeof AudioContext;
});

describe("chimes", () => {
  it("plays a two-note chime when a new chapter is chosen", () => {
    playChime("select");
    expect(started.length).toBe(2);
  });
  it("plays a four-note chime for a finished round", () => {
    playChime("win");
    expect(started.length).toBe(4);
  });
  it("says nothing when the device has no audio", () => {
    globalThis.AudioContext = undefined as unknown as typeof AudioContext;
    expect(() => playChime("select")).not.toThrow();
    expect(started.length).toBe(0);
  });
});
