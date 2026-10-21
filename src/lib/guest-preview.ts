/** Browser-only guest preview state. Points here are display-only until a signed-in account claims them (server caps the amount). */
export const GUEST_DONE_KEY = "monere_guest_completed";
export const GUEST_POINTS_KEY = "monere_guest_points";
const listeners = new Set<() => void>();

export function guestCompleted() {
  return typeof window !== "undefined" && window.localStorage.getItem(GUEST_DONE_KEY) === "true";
}
export function guestPoints() {
  if (typeof window === "undefined") return 0;
  const n = Number(window.localStorage.getItem(GUEST_POINTS_KEY));
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}
export function markGuestComplete(points: number) {
  window.localStorage.setItem(GUEST_DONE_KEY, "true");
  window.localStorage.setItem(GUEST_POINTS_KEY, String(guestPoints() + points));
  listeners.forEach((l) => l());
}
export function clearGuest() {
  window.localStorage.removeItem(GUEST_DONE_KEY);
  window.localStorage.removeItem(GUEST_POINTS_KEY);
  listeners.forEach((l) => l());
}
export function subscribeGuest(l: () => void) {
  listeners.add(l);
  return () => { listeners.delete(l); };
}
