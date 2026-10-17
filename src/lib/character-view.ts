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

// Zoom around Monere's fixed centre, never around the pointer or pinch midpoint.
export function zoomCharacter(view: CharacterView, scale: number): CharacterView {
  return { ...view, scale: clampCharacterZoom(scale), x: 0, y: 0 };
}

export function rotateCharacter(rotation: number, deltaX: number, width: number) {
  return rotation + deltaX / Math.max(1, width) * 360;
}

export function characterFrame(rotation: number) {
  const degrees = ((rotation % 360) + 360) % 360;
  return Math.round(degrees / 45) % 8;
}