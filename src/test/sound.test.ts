import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { playChime, playFanfare } from "@/lib/sound";

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
  it("plays a bigger fanfare than the win chime when the adventure finishes", () => {
    playChime("win");
    const winNotes = started.length;
    started = [];
    playFanfare();
    expect(started.length).toBeGreaterThan(winNotes);
  });
  it("says nothing when the device has no audio", () => {
    globalThis.AudioContext = undefined as unknown as typeof AudioContext;
    expect(() => playChime("select")).not.toThrow();
    expect(started.length).toBe(0);
  });
});
