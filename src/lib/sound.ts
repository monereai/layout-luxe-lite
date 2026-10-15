// Short synthesised chimes and fanfares, so no audio file needs to be downloaded.
// Must be called straight from a tap so phones allow the sound to play.

function tone(ctx: AudioContext, freq: number, at: number, dur: number, peak: number) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.frequency.value = freq;
  o.type = "triangle";
  const t = ctx.currentTime + at;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function openAudio(): AudioContext {
  const ctx = new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** "select" marks a new chapter; "win" marks a finished round or chapter. */
export function playChime(kind: "select" | "win" = "select") {
  try {
    const ctx = openAudio();
    const notes = kind === "win" ? [523.25, 659.25, 783.99, 1046.5] : [783.99, 1046.5];
    notes.forEach((f, i) => tone(ctx, f, i * 0.1, 0.35, 0.18));
  } catch {
    /* audio unavailable */
  }
}

/** A quick bubbly pop for finding something. */
export function playPop() {
  try {
    const ctx = openAudio();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    const t = ctx.currentTime;
    o.frequency.setValueAtTime(420, t);
    o.frequency.exponentialRampToValueAtTime(1200, t + 0.08);
    g.gain.setValueAtTime(0.25, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + 0.2);
  } catch {
    /* audio unavailable */
  }
}

/** A longer, brighter celebration for finishing this week's adventure. */
export function playFanfare() {
  try {
    const ctx = openAudio();
    const run = [523.25, 659.25, 783.99, 1046.5];
    run.forEach((f, i) => tone(ctx, f, i * 0.09, 0.3, 0.16));
    const chord = run.length * 0.09;
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f) => tone(ctx, f, chord, 1.1, 0.09));
    tone(ctx, 1567.98, chord + 0.2, 0.6, 0.07);
  } catch {
    /* audio unavailable */
  }
}
