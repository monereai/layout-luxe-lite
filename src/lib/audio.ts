// Global file-based sound helper: plays small effect files from /sounds.
// Kept separate from the synthesised chimes in sound.ts so any screen can reuse it.

let soundsMuted = false;

/** Screens with a sound toggle sync it here so playSound stays silent when muted. */
export function setSoundsMuted(muted: boolean) {
  soundsMuted = muted;
}

/**
 * Play a sound file from /sounds, e.g. playSound("bell.mp3").
 * Autoplay restrictions before the first tap are swallowed silently.
 */
export function playSound(soundName: string, volume = 0.5) {
  if (soundsMuted) return;
  try {
    const file = soundName.startsWith("/") ? soundName.slice(1) : soundName;
    const audio = new Audio(`/sounds/${file}`);
    audio.volume = Math.min(Math.max(volume, 0), 1);
    void audio.play().catch(() => { /* autoplay blocked until first interaction */ });
  } catch {
    /* audio unavailable */
  }
}

// ---- Background music: one looping track at a time, with fades ----
let musicMuted = false;
let current: { name: string; el: HTMLAudioElement; volume: number } | null = null;
let wanted: { name: string; volume: number } | null = null;

function fade(el: HTMLAudioElement, to: number, ms: number, done?: () => void) {
  const from = el.volume, start = performance.now();
  const step = () => {
    const k = Math.min((performance.now() - start) / ms, 1);
    el.volume = Math.min(Math.max(from + (to - from) * k, 0), 1);
    if (k < 1) requestAnimationFrame(step); else done?.();
  };
  requestAnimationFrame(step);
}

/** Loop /sounds/bgm/<trackName>; switching tracks fades out the previous one. */
export function playBackgroundMusic(trackName: string, volume = 0.2) {
  wanted = { name: trackName, volume };
  if (typeof window === "undefined" || musicMuted) return;
  if (current?.name === trackName) {
    if (current.el.paused) void current.el.play().catch(() => {});
    return;
  }
  stopBackgroundMusic(false);
  try {
    const el = new Audio(`/sounds/bgm/${trackName}`);
    el.loop = true; el.volume = 0;
    current = { name: trackName, el, volume };
    void el.play().then(() => fade(el, volume, 800)).catch(() => { /* waits for first interaction */ });
  } catch { /* audio unavailable */ }
}

export function stopBackgroundMusic(clearWanted = true) {
  if (clearWanted) wanted = null;
  const old = current; current = null;
  if (old) fade(old.el, 0, 600, () => { old.el.pause(); old.el.src = ""; });
}

/** Call on the player's first tap/move so browsers allow the music to start. */
export function resumeBackgroundMusic() {
  if (musicMuted || !wanted) return;
  if (current && current.name === wanted.name) {
    if (current.el.paused) void current.el.play().then(() => fade(current!.el, wanted!.volume, 800)).catch(() => {});
  } else playBackgroundMusic(wanted.name, wanted.volume);
}

export function setMusicMuted(muted: boolean) {
  musicMuted = muted;
  if (muted) { const w = wanted; stopBackgroundMusic(); wanted = w; }
  else resumeBackgroundMusic();
}
export const isMusicMuted = () => musicMuted;
