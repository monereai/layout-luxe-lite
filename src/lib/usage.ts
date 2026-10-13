export const FREE_DAILY_LIMIT = 3;
const KEY = "monereai-usage";

type Usage = { date: string; count: number };

export function today(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

/** Count used today, resetting automatically on a new day. */
export function usedToday(u: Usage | null, now = new Date()): number {
  return u && u.date === today(now) ? u.count : 0;
}

/** Free users may make up to FREE_DAILY_LIMIT queries per day; premium is unlimited. */
export function canAsk(used: number, premium: boolean): boolean {
  return premium || used < FREE_DAILY_LIMIT;
}

function read(): Usage | null {
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "null") as Usage | null;
  } catch {
    return null;
  }
}

export function getUsedToday() {
  return usedToday(read());
}

export function recordQuery() {
  const n = getUsedToday() + 1;
  window.localStorage.setItem(KEY, JSON.stringify({ date: today(), count: n }));
}
