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
