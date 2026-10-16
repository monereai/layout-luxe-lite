export const MIN_CHARACTER_ZOOM = 0.7;
export const MAX_CHARACTER_ZOOM = 1.5;
export type CharacterView = { scale: number; rotation: number; tiltX: number; x: number; y: number };
export const INITIAL_CHARACTER_VIEW: CharacterView = { scale: 1, rotation: 0, tiltX: 0, x: 0, y: 0 };

export function clampCharacterZoom(scale: number) {
  return Math.min(MAX_CHARACTER_ZOOM, Math.max(MIN_CHARACTER_ZOOM, scale));
}

export function wheelCharacterZoom(scale: number, delta: number, mode: number) {
  const pixels = delta * (mode === 1 ? 16 : mode === 2 ? 100 : 1);
  return clampCharacterZoom(scale * Math.exp(-pixels * 0.0015));
}

// Points are relative to the untransformed viewport center.
export function zoomCharacter(view: CharacterView, scale: number, point: { x: number; y: number }): CharacterView {
  const next = clampCharacterZoom(scale);
  const ratio = next / view.scale;
  return { ...view, scale: next, x: point.x - (point.x - view.x) * ratio, y: point.y - (point.y - view.y) * ratio };
}

export function rotateCharacter(rotation: number, deltaX: number, width: number) {
  return rotation + deltaX / Math.max(1, width) * 360;
}

export function characterFrame(rotation: number) {
  const degrees = ((rotation % 360) + 360) % 360;
  return Math.round(degrees / 45) % 8;
}

// Sprites carry the full turn; the shared wrapper carries the angle between
// sprites, so the complete dressed figure moves without ever becoming edge-on.
export function characterFrameTilt(rotation: number) {
  return ((rotation + 22.5) % 45 + 45) % 45 - 22.5;
}