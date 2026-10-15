// Short synthesised chimes, so no audio file needs to be downloaded.
// Must be called straight from a tap so phones allow the sound to play.

/** "select" marks a new chapter; "win" marks a finished round or chapter. */
export function playChime(kind: "select" | "win" = "select") {
  try {
    const ctx = new AudioContext();
    const notes = kind === "win" ? [523.25, 659.25, 783.99, 1046.5] : [783.99, 1046.5];
    notes.forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = f;
      o.type = "triangle";
      const t = ctx.currentTime + i * 0.1;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.4);
    });
    // Leave the finished chime to the browser so the note isn't cut short.
    void ctx.state;
  } catch {
    /* audio unavailable */
  }
}
