import type { Wisdom } from "./wisdom.functions";

export type Entry = { id: string; date: string; category: string; situation: string; wisdom: Wisdom };
const KEY = "moralsphere-journal";

export function getEntries(): Entry[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}
export function saveEntry(e: Omit<Entry, "id" | "date">) {
  const all = getEntries();
  all.unshift({ ...e, id: crypto.randomUUID(), date: new Date().toISOString() });
  localStorage.setItem(KEY, JSON.stringify(all));
}
export function deleteEntry(id: string) {
  localStorage.setItem(KEY, JSON.stringify(getEntries().filter((e) => e.id !== id)));
}
