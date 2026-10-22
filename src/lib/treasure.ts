// The Rescue of the Golden Griffin — pure rules shared by the browser and mirrored in SQL (treasure_v3_action).
export type ZoneId = "meadow" | "wood" | "ravine" | "lair";
export type Position = { x: number; y: number };
export type AdventureState = Position & { version: 3; zone: ZoneId; scrolls: ZoneId[]; gates: ZoneId[]; duel: number; rescued: boolean };
export const WORLD_SIZE = 24;
export const TILE_SIZE = 64;
export const ZONES: { id: ZoneId; name: string; subtitle: string; icon: string }[] = [
  { id: "meadow", name: "Monere's Meadow", subtitle: "Scroll 1 · Where the journey begins.", icon: "🌼" },
  { id: "wood", name: "Lonely Wood", subtitle: "Scroll 2 · Razor fled through these trees.", icon: "🌲" },
  { id: "ravine", name: "Shadow Ravine", subtitle: "Scroll 3 · Cross the only bridge.", icon: "🏜️" },
  { id: "lair", name: "Razor's Lair", subtitle: "Scroll 4 · The Riddle Duel awaits.", icon: "🦴" },
];
export const SCROLLS: Record<ZoneId, Position & { name: string; lore: string }> = {
  meadow: { x: 7, y: 6, name: "Scroll of Courage", lore: "Be strong and courageous — Joshua 1:9." },
  wood: { x: 12, y: 6, name: "Scroll of Friendship", lore: "A friend loves at all times — Proverbs 17:17." },
  ravine: { x: 6, y: 17, name: "Scroll of Trust", lore: "Trust in the Lord with all your heart — Proverbs 3:5." },
  lair: { x: 5, y: 15, name: "Scroll of Wisdom", lore: "Wisdom is more precious than rubies — Proverbs 3:15." },
};
export const SCROLL_CLUES: Record<ZoneId, string> = {
  meadow: "Razor dropped something by the cottage daisies to the northwest. Find the first scroll!",
  wood: "Deep in Lonely Wood, an old oak to the north guards a rolled-up secret.",
  ravine: "Cross the rope bridge. The third scroll lies in the southwest canyon.",
  lair: "Search the western corner of the entry hall for the final scroll.",
};
export const GATES: Record<ZoneId, { riddle: string; options: string[]; answer: number }> = {
  meadow: { riddle: "I have hands, but I cannot clap. I have a face, but I cannot smile. What am I?", options: ["A Clock", "A Mirror", "A Book"], answer: 0 },
  wood: { riddle: "What gets wetter and wetter the more it dries?", options: ["A Sponge", "A Towel", "A Cloud"], answer: 1 },
  ravine: { riddle: "I have keys, but no locks. I have space, but no room. You can enter, but you can't go outside. What am I?", options: ["A Door", "A Keyboard", "A Treasure Chest"], answer: 1 },
  lair: { riddle: "What belongs to you, but other people use it far more than you do?", options: ["Your Shoes", "Your Toys", "Your Name"], answer: 2 },
};
export const DUEL = [
  { riddle: "I fly without wings and cry without eyes. Wherever I go, darkness flies. What am I?", tiles: ["A Bird", "A Cloud", "An Airplane"], answer: 1 },
  { riddle: "I am tall when I am young, and I am short when I am old. What am I?", tiles: ["A Tree", "A Pencil", "A Candle"], answer: 2 },
  { riddle: "What comes down, but never goes up?", tiles: ["Rain", "An Elevator", "A Ball"], answer: 0 },
];
export const DUEL_TILES: Position[] = [{ x: 10, y: 6 }, { x: 12, y: 6 }, { x: 14, y: 6 }];
export const DUEL_START: Position = { x: 12, y: 8 };
export const LAIR_DOOR: Position = { x: 12, y: 10 };
export const RAZOR: Position = { x: 8, y: 4 };
export const CAGE: Position = { x: 16, y: 4 };
export type Portal = Position & { target: ZoneId; arrive: Position; forward: boolean };
export const PORTALS: Record<ZoneId, Portal[]> = {
  meadow: [{ x: 21, y: 10, target: "wood", arrive: { x: 3, y: 10 }, forward: true }],
  wood: [{ x: 2, y: 10, target: "meadow", arrive: { x: 20, y: 10 }, forward: false }, { x: 21, y: 10, target: "ravine", arrive: { x: 3, y: 6 }, forward: true }],
  ravine: [{ x: 2, y: 6, target: "wood", arrive: { x: 20, y: 10 }, forward: false }, { x: 21, y: 17, target: "lair", arrive: { x: 12, y: 19 }, forward: true }],
  lair: [{ x: 12, y: 21, target: "ravine", arrive: { x: 20, y: 17 }, forward: false }],
};
export const near = (a: Position, b: Position) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y) <= 1;
export function initialAdventure(): AdventureState { return { version: 3, zone: "meadow", x: 10, y: 12, scrolls: [], gates: [], duel: 0, rescued: false }; }
export function walkable(zone: ZoneId, x: number, y: number): boolean {
  if (!Number.isInteger(x) || !Number.isInteger(y) || x < 2 || x > 21 || y < 2 || y > 21) return false;
  if (zone === "meadow") return y < 21 || (x >= 11 && x <= 13);
  if (zone === "wood") return !((x >= 4 && x <= 8 && y >= 12 && y <= 15) || (x >= 14 && x <= 17 && y >= 12 && y <= 15));
  if (zone === "ravine") return !(y >= 10 && y <= 13 && (x < 10 || x > 13));
  return !((y === 9 || y === 10) && x !== 12) && (y < 21 || x === 12);
}
export function canStep(s: AdventureState, x: number, y: number) { return walkable(s.zone, x, y) && !(s.zone === "lair" && (y === 9 || y === 10) && !s.gates.includes("lair")); }
export function canEnter(s: AdventureState, zone: ZoneId) { const i = ZONES.findIndex(z => z.id === zone); return i === 0 || (i > 0 && s.gates.includes(ZONES[i - 1]!.id)); }
export type AdventureAction = { action: "status" | "move" | "collect" | "answer" | "portal" | "duel"; x?: number; y?: number; id?: string };
/** Gate riddle for this zone's exit is answerable once the zone's scroll is found and Monere stands at the gate. */
export function gateHere(s: AdventureState): ZoneId | null {
  if (!s.scrolls.includes(s.zone) || s.gates.includes(s.zone)) return null;
  const at = s.zone === "lair" ? LAIR_DOOR : PORTALS[s.zone].find(p => p.forward);
  return at && near(s, at) ? s.zone : null;
}
export function duelTileAt(s: AdventureState): number { return s.zone === "lair" && s.gates.includes("lair") && !s.rescued ? DUEL_TILES.findIndex(t => t.x === s.x && t.y === s.y) : -1; }
export function applyAdventure(s: AdventureState, a: AdventureAction): AdventureState {
  if (a.action === "move") return typeof a.x === "number" && typeof a.y === "number" && Math.abs(s.x - a.x) + Math.abs(s.y - a.y) === 1 && canStep(s, a.x, a.y) ? { ...s, x: a.x, y: a.y } : s;
  if (a.action === "collect") return !s.scrolls.includes(s.zone) && near(s, SCROLLS[s.zone]) ? { ...s, scrolls: [...s.scrolls, s.zone] } : s;
  if (a.action === "answer") return gateHere(s) === a.id && a.x === GATES[s.zone].answer ? { ...s, gates: [...s.gates, s.zone] } : s;
  if (a.action === "portal") { const p = PORTALS[s.zone].find(p => p.target === a.id && near(s, p)); return p && (!p.forward || s.gates.includes(s.zone)) ? { ...s, zone: p.target, ...p.arrive } : s; }
  if (a.action === "duel") {
    const tile = duelTileAt(s); if (tile < 0 || tile !== a.x) return s;
    if (tile !== DUEL[s.duel]!.answer) return { ...s, ...DUEL_START };
    const duel = s.duel + 1; return { ...s, duel, rescued: duel === DUEL.length };
  }
  return s;
}
export function questClue(s: AdventureState): string {
  if (s.rescued) return "The Golden Griffin is free! Razor has fled. Well done, brave team.";
  if (!s.scrolls.includes(s.zone)) return SCROLL_CLUES[s.zone];
  if (!s.gates.includes(s.zone)) return s.zone === "lair" ? "Scroll found! Go to the carved inner door in the middle of the lair and answer its riddle." : "Scroll found! Walk to the eastern gate and answer the gatekeeper's riddle.";
  if (s.zone === "lair") return `Riddle Duel ${s.duel + 1}/3: ${DUEL[s.duel]!.riddle} Hop onto the right tile.`;
  return "The gate is open. Travel onward through the portal!";
}
export function parseAdventure(value: unknown): AdventureState {
  const f = initialAdventure(); if (!value || typeof value !== "object") return f;
  const s = value as Record<string, unknown>; if (s["version"] !== 3) return f;
  const ids = ZONES.map(z => z.id); const list = (k: string) => Array.isArray(s[k]) ? ids.filter(id => (s[k] as unknown[]).includes(id)) : [];
  const duel = typeof s["duel"] === "number" && Number.isInteger(s["duel"]) ? Math.max(0, Math.min(3, s["duel"])) : 0;
  let st: AdventureState = { ...f, scrolls: list("scrolls"), gates: list("gates"), duel, rescued: duel === 3 && s["rescued"] === true };
  const zone = ids.find(id => id === s["zone"]) ?? "meadow"; st = { ...st, zone: canEnter(st, zone) ? zone : "meadow" };
  const x = Number(s["x"]); const y = Number(s["y"]);
  return canStep(st, x, y) ? { ...st, x, y } : { ...st, ...(st.zone === "meadow" ? { x: 10, y: 12 } : PORTALS[ZONES[ZONES.findIndex(z => z.id === st.zone) - 1]!.id].find(p => p.forward)!.arrive) };
}
