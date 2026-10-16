export const MIN_CHARACTER_ZOOM = 0.8;
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

export function tiltCharacter(view: CharacterView, horizontal: number, vertical: number): CharacterView {
  return { ...view, rotation: Math.max(-15, Math.min(15, horizontal)), tiltX: Math.max(-10, Math.min(10, vertical)) };
}