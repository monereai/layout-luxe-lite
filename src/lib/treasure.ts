import { HUNT_POOL, drawHuntSpots, validHuntSpots } from "./chapter-hunts";
// The Rescue of the Golden Griffin — pure rules shared by the browser and mirrored in SQL (treasure_v5_action).
export type ZoneId = "meadow" | "wood" | "ravine" | "lair" | "garden";
export type Position = { x: number; y: number };
export type Gear = "lantern" | "boots" | "goggles";
export type AdventureState = Position & { version: 3; zone: ZoneId; scrolls: ZoneId[]; gates: ZoneId[]; duel: number; rescued: boolean;
  gear: Gear[]; items: string[]; quests: string[]; met: string[]; dug: string[]; lily: number; pet: Position | null; fog: Partial<Record<ZoneId, number[]>>; riddles: RiddleSlot[]; huntSpots?: number[] | null; huntDate?: string };
export const WORLD_SIZE = 24;
export const TILE_SIZE = 64;
export const GARDEN_PORTAL = { x: 12, y: 28 };
export const worldRows = (zone: ZoneId) => zone === "meadow" ? 32 : 24;
export const gardenOpen = (s: AdventureState) => s.quests.includes("vernon");
export const portalOpen = (s: AdventureState, p: Portal) => p.target === "garden" ? gardenOpen(s) : !p.forward || s.gates.includes(s.zone);
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
  garden: { x: 12, y: 12, name: "Vernon’s Garden", lore: "From small seeds, kindness grows." },
  lair: { x: 5, y: 15, name: "Scroll of Wisdom", lore: "Wisdom is more precious than rubies — Proverbs 3:15." },
};
export const SCROLL_CLUES: Record<ZoneId, string> = {
  garden: "Explore Vernon’s garden, then return through the southern arch.",
  meadow: "Razor tucked a scroll into the meadow's bushes. Search the greenery closely.",
  wood: "A scroll hides in a hollow log among the trees. Only a close look will reveal it.",
  ravine: "The canyon's scroll lies beneath a pile of rocks. Search carefully on both sides of the bridge.",
  lair: "The last scroll is buried under rubble on a ledge across the chasm. Only the Goggles of Truth reveal the invisible path to it.",
};
/** Landscape prop that conceals each zone's scroll until Monere is close. */
export const SCROLL_COVERS: Record<ZoneId, string> = { meadow: "🌿", wood: "🪵", ravine: "🪨", lair: "🪨", garden: "🌸" };
/** Master riddle pool (mirrored in SQL treasure_v5_riddle_answers). `answer` indexes the unshuffled options. */
export type PoolRiddle = { riddle: string; options: [string, string, string]; answer: number; hint: string };
export const RIDDLE_POOL: PoolRiddle[] = [
  { riddle: "I have hands, but I cannot clap. I have a face, but I cannot smile. What am I?", options: ["A Clock", "A Mirror", "A Book"], answer: 0, hint: "The answer keeps time, tick-tock!" },
  { riddle: "What gets wetter and wetter the more it dries?", options: ["A Sponge", "A Towel", "A Cloud"], answer: 1, hint: "You use it after a bath." },
  { riddle: "I have keys, but no locks. I have space, but no room. You can enter, but you can't go outside. What am I?", options: ["A Door", "A Keyboard", "A Treasure Chest"], answer: 1, hint: "You type on it." },
  { riddle: "What belongs to you, but other people use it far more than you do?", options: ["Your Shoes", "Your Toys", "Your Name"], answer: 2, hint: "Friends call you by it." },
  { riddle: "I fly without wings and cry without eyes. Wherever I go, darkness flies. What am I?", options: ["A Bird", "A Cloud", "An Airplane"], answer: 1, hint: "Look up on a rainy day." },
  { riddle: "I am tall when I am young, and I am short when I am old. What am I?", options: ["A Tree", "A Pencil", "A Candle"], answer: 2, hint: "It melts as it glows." },
  { riddle: "What comes down, but never goes up?", options: ["Rain", "An Elevator", "A Ball"], answer: 0, hint: "Bring an umbrella!" },
  { riddle: "Which planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter"], answer: 1, hint: "It's the fourth planet from the Sun." },
  { riddle: "How many legs does a spider have?", options: ["Six", "Eight", "Ten"], answer: 1, hint: "Two more than an insect." },
  { riddle: "What has a neck but no head?", options: ["A Bottle", "A Snake", "A Chair"], answer: 0, hint: "You can pour from it." },
  { riddle: "What do bees make?", options: ["Milk", "Honey", "Silk"], answer: 1, hint: "It's sweet and sticky." },
  { riddle: "What is full of holes but still holds water?", options: ["A Bucket", "A Sponge", "A Net"], answer: 1, hint: "You squeeze it when washing up." },
  { riddle: "Which is the largest ocean on Earth?", options: ["Atlantic", "Indian", "Pacific"], answer: 2, hint: "Its name means peaceful." },
  { riddle: "What has to be broken before you can use it?", options: ["An Egg", "A Window", "A Pencil"], answer: 0, hint: "Think breakfast!" },
  { riddle: "Which gas do plants take in that we breathe out?", options: ["Oxygen", "Carbon Dioxide", "Helium"], answer: 1, hint: "Its short name is CO₂." },
  { riddle: "What can travel around the world while staying in a corner?", options: ["A Stamp", "A Spider", "A Shadow"], answer: 0, hint: "You find it on a letter." },
];
/** Slots 0–3 are the zone gates (meadow, wood, ravine, lair); 4–6 are Razor's duel. `o` maps shown position → pool option. */
export type RiddleSlot = { i: number; o: number[] };
export const RIDDLE_SLOTS = 7;
export const defaultRiddles = (): RiddleSlot[] => Array.from({ length: RIDDLE_SLOTS }, (_, i) => ({ i, o: [0, 1, 2] }));
/** Picks fresh riddles; riddles from `previous` (the last playthrough) are skipped so a replay never repeats them. */
export function randomRiddles(rand: () => number = Math.random, previous: RiddleSlot[] = []): RiddleSlot[] {
  const shuffle = <T,>(a: T[]) => { const b = [...a]; for (let k = b.length - 1; k > 0; k--) { const j = Math.floor(rand() * (k + 1)); [b[k], b[j]] = [b[j]!, b[k]!]; } return b; };
  const old = new Set(previous.map(r => r.i));
  const fresh = RIDDLE_POOL.map((_, i) => i).filter(i => !old.has(i));
  const ids = fresh.length >= RIDDLE_SLOTS ? shuffle(fresh) : [...shuffle(fresh), ...shuffle([...old])];
  return ids.slice(0, RIDDLE_SLOTS).map(i => ({ i, o: shuffle([0, 1, 2]) }));
}
export function validRiddles(v: unknown): RiddleSlot[] | null {
  if (!Array.isArray(v) || v.length !== RIDDLE_SLOTS) return null;
  const out: RiddleSlot[] = []; const used = new Set<number>();
  for (const r of v) {
    const i = (r as RiddleSlot)?.i; const o = (r as RiddleSlot)?.o;
    if (!Number.isInteger(i) || i < 0 || i >= RIDDLE_POOL.length || used.has(i) || !Array.isArray(o) || o.length !== 3 || [...o].sort().join() !== "0,1,2") return null;
    used.add(i); out.push({ i, o: [...o] });
  }
  return out;
}
export type ShownRiddle = { riddle: string; options: string[]; answer: number; hint: string };
export function riddleAt(s: AdventureState, slot: number): ShownRiddle {
  const r = s.riddles[slot] ?? { i: slot, o: [0, 1, 2] }; const p = RIDDLE_POOL[r.i]!;
  return { riddle: p.riddle, options: r.o.map(k => p.options[k]!), answer: r.o.indexOf(p.answer), hint: p.hint };
}
export const gateRiddle = (s: AdventureState, zone: ZoneId) => riddleAt(s, ZONES.findIndex(z => z.id === zone));
export const duelRiddle = (s: AdventureState, round = s.duel) => riddleAt(s, 4 + Math.min(round, 2));
export const DUEL_ROUNDS = 3;
export const DUEL_TILES: Position[] = [{ x: 10, y: 6 }, { x: 12, y: 6 }, { x: 14, y: 6 }];
export const DUEL_START: Position = { x: 12, y: 8 };
export const LAIR_DOOR: Position = { x: 12, y: 10 };
export const RAZOR: Position = { x: 8, y: 4 };
export const CAGE: Position = { x: 16, y: 4 };
export type Portal = Position & { target: ZoneId; arrive: Position; forward: boolean };
export const PORTALS: Record<ZoneId, Portal[]> = {
  meadow: [{ x: 21, y: 10, target: "wood", arrive: { x: 3, y: 10 }, forward: true }, { ...GARDEN_PORTAL, target: "garden", arrive: { x: 12, y: 20 }, forward: false }],
  garden: [{ x: 12, y: 21, target: "meadow", arrive: { x: 12, y: 27 }, forward: false }],
  wood: [{ x: 2, y: 10, target: "meadow", arrive: { x: 20, y: 10 }, forward: false }, { x: 21, y: 10, target: "ravine", arrive: { x: 3, y: 6 }, forward: true }],
  ravine: [{ x: 2, y: 6, target: "wood", arrive: { x: 20, y: 10 }, forward: false }, { x: 21, y: 17, target: "lair", arrive: { x: 12, y: 19 }, forward: true }],
  lair: [{ x: 12, y: 21, target: "ravine", arrive: { x: 20, y: 17 }, forward: false }],
};
export const near = (a: Position, b: Position) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y) <= 1;
export function initialAdventure(): AdventureState { return reveal({ version: 3, zone: "meadow", x: 10, y: 12, scrolls: [], gates: [], duel: 0, rescued: false, gear: [], items: [], quests: [], met: [], dug: [], lily: 0, pet: null, fog: {}, riddles: defaultRiddles() }); }
export function walkable(zone: ZoneId, x: number, y: number): boolean {
  if (zone === "meadow" && Number.isInteger(x) && Number.isInteger(y) && y >= 21 && y <= 29) return y <= 23 ? x >= 11 && x <= 13 : x >= 4 && x <= 19;
  if (!Number.isInteger(x) || !Number.isInteger(y) || x < 2 || x > 21 || y < 2 || y > 21) return false;
  if (zone === "garden") return !((x >= 9 && x <= 14 && y >= 9 && y <= 14) || (x <= 4 && y >= 5 && y <= 16) || (x >= 17 && y <= 5));
  if (zone === "meadow") return y < 21 || (x >= 11 && x <= 13);
  if (zone === "wood") return !((x >= 4 && x <= 8 && y >= 12 && y <= 15) || (x >= 14 && x <= 17 && y >= 12 && y <= 15));
  if (zone === "ravine") return !(y >= 10 && y <= 13 && (x < 10 || x > 13));
  return !((y === 9 || y === 10) && x !== 12) && (y < 21 || x === 12);
}
export function canStep(s: AdventureState, x: number, y: number) {
  if (!walkable(s.zone, x, y) || (s.zone === "lair" && (y === 9 || y === 10) && !s.gates.includes("lair"))) return false;
  if (s.zone === "wood") {
    if (inCave(x, y) && !s.gear.includes("lantern")) return false;
    if (y === 17) return x === LILY_ROWS[0][s.lily];
    if (y === 18) return x === LILY_ROWS[1][s.lily];
  }
  if (s.zone === "ravine" && onCliff(x, y) && !s.gear.includes("boots")) return false;
  if (s.zone === "lair") {
    if (inChasm(x, y)) return onPlatform(x, y) || (isHiddenPath(x, y) && s.gear.includes("goggles"));
    if (isTrap(x, y) && s.gear.includes("goggles")) return false;
  }
  return true;
}
export function canEnter(s: AdventureState, zone: ZoneId) { if (zone === "garden") return gardenOpen(s); const i = ZONES.findIndex(z => z.id === zone); return i === 0 || (i > 0 && s.gates.includes(ZONES[i - 1]!.id)); }
/** Tap navigation follows the same collision rules as keyboard movement. */
export function worldPath(s: AdventureState, target: Position): Position[] | null {
  if (!canStep(s, target.x, target.y)) return null;
  const paths: Position[][] = [[{ x: s.x, y: s.y }]];
  const seen = new Set([`${s.x},${s.y}`]);
  for (const path of paths) {
    const end = path.at(-1); if (!end) continue;
    if (end.x === target.x && end.y === target.y) return path.slice(1);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const next = { x: end.x + (dx ?? 0), y: end.y + (dy ?? 0) }; const key = `${next.x},${next.y}`;
      if (!seen.has(key) && canStep(s, next.x, next.y)) { seen.add(key); paths.push([...path, next]); }
    }
  }
  return null;
}
export type AdventureAction = { action: "status" | "refresh-hunt" | "restart" | "move" | "collect" | "answer" | "portal" | "duel" | "pick" | "talk" | "deliver" | "dig" | "bell" | "stay" | "switch" | "call"; x?: number; y?: number; id?: string };
/** Gate riddle for this zone's exit is answerable once the zone's scroll is found and Monere stands at the gate. */
export function gateHere(s: AdventureState): ZoneId | null {
  if (s.zone === "garden" || !s.scrolls.includes(s.zone) || s.gates.includes(s.zone)) return null;
  const at = s.zone === "lair" ? LAIR_DOOR : PORTALS[s.zone].find(p => p.forward);
  return at && near(s, at) ? s.zone : null;
}
export function duelTileAt(s: AdventureState): number { return s.zone === "lair" && s.gates.includes("lair") && !s.rescued ? DUEL_TILES.findIndex(t => t.x === s.x && t.y === s.y) : -1; }
export function duelLanding(s: AdventureState, lastLanding: string, blocked: boolean): string | null {
  const key = `${s.x},${s.y}`;
  return !blocked && duelTileAt(s) >= 0 && key !== lastLanding ? key : null;
}
export function applyAdventure(s: AdventureState, a: AdventureAction): AdventureState { return reveal(applyRaw(s, a)); }
function applyRaw(s: AdventureState, a: AdventureAction): AdventureState {
  if (a.action === "restart") return s.rescued && s.duel === DUEL_ROUNDS ? { ...initialAdventure(), riddles: randomRiddles(Math.random, s.riddles), huntSpots: drawHuntSpots(Math.random, s.huntSpots ?? [], ["meadow"]) } : s;
  if (a.action === "refresh-hunt") { const today = new Date().toISOString().slice(0, 10); return s.zone === "lair" && near(s, LAIR_DOOR) && s.huntDate !== today ? { ...refreshDailyHunt(s), huntDate: today } : s; }
  if (s.rescued) return s;
  if (a.action === "move") { if (typeof a.x !== "number" || typeof a.y !== "number" || Math.abs(s.x - a.x) + Math.abs(s.y - a.y) !== 1 || !canStep(s, a.x, a.y)) return s; return s.zone === "lair" && isTrap(a.x, a.y) ? { ...s, ...TRAP_RESET } : { ...s, x: a.x, y: a.y }; }
  if (a.action === "pick") { const it = ITEMS.find(i => i.id === a.id); return it && it.zone === s.zone && near(s, it) && itemVisible(s, it) && !s.items.includes(it.id) ? { ...s, items: [...s.items, it.id] } : s; }
  if (a.action === "talk" || a.action === "deliver") {
    const n = NPCS.find(n => n.id === a.id); if (!n || n.zone !== s.zone || !near(s, n)) return s;
    let next = s.met.includes(n.id) ? s : { ...s, met: [...s.met, n.id] };
    if (a.action === "deliver" && !next.quests.includes(n.id) && n.need.every(i => next.items.includes(i))) next = { ...next, quests: [...next.quests, n.id], gear: n.gear && !next.gear.includes(n.gear) ? [...next.gear, n.gear] : next.gear, items: n.item && !next.items.includes(n.item) ? [...next.items, n.item] : next.items };
    return next;
  }
  if (a.action === "dig") { const d = sessionDigs(s).find(d => d.id === a.id); if (!d || d.zone !== s.zone || !near(s, d) || s.dug.includes(d.id)) return s; return { ...s, dug: [...s.dug, d.id], items: d.item && !s.items.includes(d.item) ? [...s.items, d.item] : s.items }; }
  if (a.action === "bell") return s.zone === "wood" && near(s, BELL) ? { ...s, lily: (s.lily + 1) % 3 } : s;
  if (a.action === "stay") return s.zone === "ravine" && s.x === PLATE_PET.x && s.y === PLATE_PET.y ? { ...s, pet: { ...PLATE_PET } } : s;
  if (a.action === "switch") { if (s.zone !== "ravine" || s.x !== PLATE_HERO.x || s.y !== PLATE_HERO.y || s.pet?.x !== PLATE_PET.x) return s; return { ...s, pet: null, quests: s.quests.includes("vault") ? s.quests : [...s.quests, "vault"], items: s.items.includes(VAULT_RELIC) ? s.items : [...s.items, VAULT_RELIC] }; }
  if (a.action === "call") return { ...s, pet: null };
  if (a.action === "collect") return s.zone !== "garden" && !s.scrolls.includes(s.zone) && near(s, SCROLLS[s.zone]) ? { ...s, scrolls: [...s.scrolls, s.zone] } : s;
  if (a.action === "answer") return gateHere(s) === a.id && a.x === gateRiddle(s, s.zone).answer ? { ...s, gates: [...s.gates, s.zone] } : s;
  if (a.action === "portal") { const p = PORTALS[s.zone].find(p => p.target === a.id && near(s, p)); return p && portalOpen(s, p) ? { ...s, zone: p.target, ...p.arrive, pet: null } : s; }
  if (a.action === "duel") {
    const tile = duelTileAt(s); if (tile < 0 || tile !== a.x) return s;
    if (tile !== duelRiddle(s).answer) return { ...s, ...DUEL_START };
    const duel = s.duel + 1; return { ...s, duel, rescued: duel === DUEL_ROUNDS };
  }
  return s;
}
export function questClue(s: AdventureState): string {
  if (s.zone === "garden") return "Welcome to Vernon’s Garden! Wander among the flowers and return through the southern arch.";
  if (s.zone === "meadow" && gardenOpen(s)) return "Vernon’s garden is open! Cross the southern bridge and follow the path to the flower portal.";
  if (s.rescued) return "The Golden Griffin is free! Razor has fled. Well done, brave team.";
  if (!s.scrolls.includes(s.zone)) return `${SCROLL_CLUES[s.zone]} ${scrollWarmth(s)}`;
  if (!s.gates.includes(s.zone)) return s.zone === "lair" ? "Chapter 1 gateway: visit the carved door, then continue exploring the daily hunts." : "Scroll found! Walk to the eastern gate and answer the gatekeeper's riddle.";
  if (s.zone === "lair") return `Riddle Duel ${s.duel + 1}/3: ${duelRiddle(s).riddle} Hop onto the right tile.`;
  return "The gate is open. Travel onward through the portal!";
}
export function parseAdventure(value: unknown): AdventureState {
  const f = initialAdventure(); if (!value || typeof value !== "object") return f;
  const s = value as Record<string, unknown>; if (s["version"] !== 3) return f;
  const ids = ZONES.map(z => z.id); const list = (k: string) => Array.isArray(s[k]) ? ids.filter(id => (s[k] as unknown[]).includes(id)) : [];
  const duel = typeof s["duel"] === "number" && Number.isInteger(s["duel"]) ? Math.max(0, Math.min(3, s["duel"])) : 0;
  const strs = (k: string, allowed: readonly string[]) => Array.isArray(s[k]) ? allowed.filter(id => (s[k] as unknown[]).includes(id)) : [];
  const lily = typeof s["lily"] === "number" && [0, 1, 2].includes(s["lily"]) ? s["lily"] : 0;
  const rawPet = s["pet"] as Record<string, unknown> | null | undefined; const pet = rawPet && rawPet["x"] === PLATE_PET.x && rawPet["y"] === PLATE_PET.y ? { ...PLATE_PET } : null;
  const fog: AdventureState["fog"] = {}; const rawFog = (s["fog"] && typeof s["fog"] === "object" ? s["fog"] : {}) as Record<string, unknown>;
  for (const id of [...ids, "garden" as const]) { const v = rawFog[id]; if (Array.isArray(v)) fog[id] = v.filter((n): n is number => Number.isInteger(n) && n >= 0 && n < (worldRows(id) / 4) * 6); }
  let st: AdventureState = { ...f, scrolls: list("scrolls"), gates: list("gates"), duel, rescued: duel === 3 && s["rescued"] === true,
    gear: strs("gear", ["lantern", "boots", "goggles"]) as Gear[], items: strs("items", ALL_ITEMS), quests: strs("quests", [...NPCS.map(n => n.id), "vault"]), met: strs("met", NPCS.map(n => n.id)), dug: strs("dug", DIGS.map(d => d.id)), lily, pet, fog, riddles: validRiddles(s["riddles"]) ?? defaultRiddles(), huntSpots: validHuntSpots(s["huntSpots"]), ...(typeof s["huntDate"] === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s["huntDate"]) ? { huntDate: s["huntDate"] } : {}) };
  const zone = [...ids, "garden" as const].find(id => id === s["zone"]) ?? "meadow"; st = { ...st, zone: canEnter(st, zone) ? zone : "meadow" };
  const x = Number(s["x"]); const y = Number(s["y"]);
  if (st.zone !== "ravine") st = { ...st, pet: null };
  return reveal(canStep(st, x, y) ? { ...st, x, y } : { ...st, ...(st.zone === "garden" ? { x: 12, y: 20 } : st.zone === "meadow" ? { x: 10, y: 12 } : PORTALS[ZONES[ZONES.findIndex(z => z.id === st.zone) - 1]!.id].find(p => p.forward)!.arrive) });
}

/** Hot/cold hint for the hidden scroll in the current zone. */
export function scrollWarmth(s: AdventureState): string {
  const t = SCROLLS[s.zone]; const d = Math.abs(t.x - s.x) + Math.abs(t.y - s.y);
  return d <= 2 ? "🔥 Burning hot!" : d <= 5 ? "♨️ Warmer…" : d <= 10 ? "🌤️ Getting warm." : "❄️ Cold.";
}
/** The scroll only appears when Monere is within this many steps. */
export const SCROLL_REVEAL = 2;

// ---------- Expanded world: gear, NPCs, side quests, digging, puzzles, fog (mirrored in SQL treasure_v4_action) ----------
export const GEAR: Record<Gear, { name: string; icon: string; use: string }> = {
  lantern: { name: "Lantern", icon: "🏮", use: "Lights the dark cave in Lonely Wood." },
  boots: { name: "Climbing Boots", icon: "🥾", use: "Climb the rocky cliffs of Shadow Ravine." },
  goggles: { name: "Goggles of Truth", icon: "🥽", use: "Reveal invisible paths and hidden traps in Razor's Lair." },
};
export type Npc = Position & { id: string; zone: ZoneId; name: string; icon: string; ask: string; thanks: string; hint: string; need: string[]; gear?: Gear; item?: string; points: number };
export const NPCS: Npc[] = [
  { id: "barnaby", zone: "meadow", x: 14, y: 8, name: "Barnaby the Owl", icon: "🦉", ask: "Hoo! The wind blew 3 of my golden feathers across the Meadow and into Lonely Wood. Find them and I'll lend you my Lantern.", thanks: "My feathers! Take this Lantern — it lights the dark cave in Lonely Wood.", hint: "A gatekeeper's riddle tip: the answer keeps time, tick-tock!", need: ["feather-1", "feather-2", "feather-3"], gear: "lantern", points: 30 },
  { id: "pippa", zone: "wood", x: 9, y: 9, name: "Pippa the Squirrel", icon: "🐿️", ask: "I lost 3 golden acorns! One rolled back to the Meadow, one is in the dark cave, and one bounced into Shadow Ravine.", thanks: "All my acorns! These Climbing Boots will get you up any cliff.", hint: "Riddle tip: think of what you grab after a bath.", need: ["acorn-1", "acorn-2", "acorn-3"], gear: "boots", points: 30 },
  { id: "rocco", zone: "ravine", x: 12, y: 4, name: "Rocco the Ram", icon: "🐏", ask: "The wind carried my silver bell all the way to Monere's Meadow. Now that I've told you where it landed, fetch it back for me?", thanks: "Ding-ding! Here are my Goggles of Truth — they show what is hidden.", hint: "Riddle tip: you tap on the answer to type.", need: ["bell"], gear: "goggles", points: 30 },
  { id: "vernon", zone: "meadow", x: 11, y: 19, name: "Vernon the Gardener", icon: "👨‍🌾", ask: "Oh dear, Razor scattered my 3 packets of magic seeds beyond the Meadow! Look for one in Lonely Wood, one in Shadow Ravine, and one in Razor's Lair. Could you bring them back for my flower bed?", thanks: "Splendid! My flower bed will bloom beautifully. Take these points for your trouble, young lion. Cross the bridge behind me and follow the southern path to the flower portal — it leads to my garden!", hint: "Riddle tip: patience grows the best answers.", need: ["seed-1", "seed-2", "seed-3"], points: 40 },
  { id: "tilly", zone: "lair", x: 17, y: 19, name: "Tilly the Tortoise", icon: "🐢", ask: "Razor broke my Ancient Key into 3 fragments and buried them across the lands. Your pet could dig them up!", thanks: "The key is whole again! Please take the Griffin Feather Crown.", hint: "Riddle tip: everyone calls you by it.", need: ["fragment-1", "fragment-2", "fragment-3"], item: "griffin-crown", points: 50 },
];
export type Item = Position & { id: string; zone: ZoneId; name: string; icon: string };
export const ITEMS: Item[] = [
  { id: "feather-1", zone: "meadow", x: 4, y: 4, name: "Golden Feather", icon: "🪶" },
  { id: "feather-2", zone: "wood", x: 4, y: 7, name: "Golden Feather", icon: "🪶" },
  { id: "feather-3", zone: "wood", x: 15, y: 9, name: "Golden Feather", icon: "🪶" },
  { id: "acorn-1", zone: "meadow", x: 8, y: 15, name: "Golden Acorn", icon: "🌰" },
  { id: "acorn-2", zone: "wood", x: 20, y: 3, name: "Golden Acorn", icon: "🌰" },
  { id: "acorn-3", zone: "ravine", x: 5, y: 8, name: "Golden Acorn", icon: "🌰" },
  { id: "bell", zone: "meadow", x: 17, y: 17, name: "Rocco's Silver Bell", icon: "🔔" },
  // Clear sandy pathways and bare stone, aligned with the bundled landscape art.
  { id: "seed-1", zone: "wood", x: 11, y: 11, name: "Magic Seed Packet", icon: "🌱" },
  { id: "seed-2", zone: "ravine", x: 12, y: 8, name: "Magic Seed Packet", icon: "🌱" },
  { id: "seed-3", zone: "lair", x: 12, y: 18, name: "Magic Seed Packet", icon: "🌱" },
];
/** Rocco's silver bell only appears once Monere has spoken to him. */
export const itemVisible = (s: AdventureState, it: Item) => it.id === "bell" ? s.met.includes("rocco") : true;
export type Dig = Position & { id: string; zone: ZoneId; item?: string; points: number };
/** Every pet dig costs this much Energy — server-verified, mirrored locally for guests. */
export const DIG_ENERGY = 25;
export const DIGS: Dig[] = [
  { id: "m-coins", zone: "meadow", x: 5, y: 17, points: 10 }, { id: "m-frag", zone: "meadow", x: 19, y: 15, item: "fragment-1", points: 0 },
  { id: "w-coins", zone: "wood", x: 10, y: 4, points: 10 }, { id: "w-relic", zone: "wood", x: 12, y: 20, item: "relic-acorn-charm", points: 0 },
  { id: "r-coins", zone: "ravine", x: 8, y: 4, points: 10 }, { id: "r-frag", zone: "ravine", x: 19, y: 19, item: "fragment-2", points: 0 },
  { id: "l-frag", zone: "lair", x: 16, y: 16, item: "fragment-3", points: 0 }, { id: "l-coins", zone: "lair", x: 19, y: 13, points: 15 },
];
export const VAULT_RELIC = "relic-sun-stone";
export function sessionDigs(s: AdventureState): Dig[] {
  const slots = validHuntSpots(s.huntSpots);
  if (!slots) return DIGS;
  const ids = ["m-frag", "r-frag", "l-frag"];
  return DIGS.map(d => { const index = ids.indexOf(d.id), spot = index >= 0 ? HUNT_POOL[slots[index] ?? -1] : undefined; return spot ? { ...d, zone: spot.zone, x: spot.x, y: spot.y } : d; });
}
export function npcClue(s: AdventureState, npc: Npc): string {
  if (npc.id !== "tilly" || !validHuntSpots(s.huntSpots)) return npc.ask;
  const hints = (s.huntSpots ?? []).map(i => HUNT_POOL[i]?.clue).filter(Boolean);
  return `Razor buried my three key fragments ${hints.join("; ")}. Ask your pet to dig them up!`;
}
export function refreshDailyHunt(s: AdventureState): AdventureState {
  return { ...s, huntSpots: drawHuntSpots(Math.random, s.huntSpots ?? [], ["meadow", ...(s.gates.includes("meadow") ? ["wood"] : []), ...(s.gates.includes("wood") ? ["ravine"] : [])]), items: s.items.filter(i => !i.startsWith("fragment-")), dug: s.dug.filter(i => !["m-frag", "r-frag", "l-frag"].includes(i)) };
}
export const TREASURES: Record<string, { name: string; icon: string; lore: string }> = {
  "fragment-1": { name: "Key Fragment I", icon: "🗝️", lore: "One third of Tilly's Ancient Key." },
  "fragment-2": { name: "Key Fragment II", icon: "🗝️", lore: "Still warm from the ravine sun." },
  "fragment-3": { name: "Key Fragment III", icon: "🗝️", lore: "Hidden right under Razor's nose." },
  "relic-acorn-charm": { name: "Acorn Charm", icon: "🍀", lore: "Small beginnings grow mighty oaks." },
  [VAULT_RELIC]: { name: "Sun Stone", icon: "☀️", lore: "Two friends together opened the vault." },
  "griffin-crown": { name: "Griffin Feather Crown", icon: "👑", lore: "A gift from Tilly for a kind heart." },
};
const ALL_ITEMS = [...ITEMS.map(i => i.id), ...Object.keys(TREASURES)];
export const BELL: Position = { x: 3, y: 16 };
/** Lily pad columns for river rows 17 and 18 at each bell phase; phase 1 lines them up. */
export const LILY_ROWS: [number[], number[]] = [[5, 10, 15], [15, 10, 5]];
export const PLATE_HERO: Position = { x: 5, y: 20 };
export const PLATE_PET: Position = { x: 8, y: 20 };
export const TRAPS: Position[] = [{ x: 12, y: 15 }, { x: 14, y: 17 }, { x: 10, y: 13 }, { x: 16, y: 14 }];
export const TRAP_RESET: Position = { x: 12, y: 19 };
export const inCave = (x: number, y: number) => x >= 18 && y <= 6;
export const onCliff = (x: number, y: number) => x >= 15 && y <= 7;
export const inChasm = (x: number, y: number) => x >= 2 && x <= 9 && y >= 12 && y <= 18;
export const onPlatform = (x: number, y: number) => x >= 4 && x <= 6 && y >= 14 && y <= 16;
/** Goggle-revealed bridge: three tiles wide so Monere and his pet cross the chasm cleanly. */
export const isHiddenPath = (x: number, y: number) => y >= 14 && y <= 16 && x >= 7 && x <= 9;
export const isTrap = (x: number, y: number) => TRAPS.some(t => t.x === x && t.y === y);
/** Fog of war: 6×6 chunks of 4×4 tiles; Monere uncovers his chunk and its neighbours. */
export function reveal(s: AdventureState): AdventureState {
  const cx = Math.floor(s.x / 4), cy = Math.floor(s.y / 4); const seen = new Set(s.fog[s.zone] ?? []); const before = seen.size;
  for (let i = Math.max(0, cx - 1); i <= Math.min(5, cx + 1); i++) for (let j = Math.max(0, cy - 1); j <= Math.min(worldRows(s.zone) / 4 - 1, cy + 1); j++) seen.add(j * 6 + i);
  return seen.size === before && s.fog[s.zone] ? s : { ...s, fog: { ...s.fog, [s.zone]: [...seen] } };
}
export const isRevealed = (s: AdventureState, zone: ZoneId, x: number, y: number) => (s.fog[zone] ?? []).includes(Math.floor(y / 4) * 6 + Math.floor(x / 4));
export type Interaction = { kind: "scroll" | "gate" | "portal" | "npc" | "item" | "dig" | "bell" | "stay" | "switch"; id?: string; label: string; icon: string };
/** The single thing Monere can do where he stands, in priority order. */
export function interactionHere(s: AdventureState): Interaction | null {
  if (s.zone !== "garden" && !s.scrolls.includes(s.zone) && near(s, SCROLLS[s.zone])) return { kind: "scroll", label: "Pick up scroll", icon: "📜" };
  const g = gateHere(s); if (g) return { kind: "gate", label: "Answer riddle", icon: "❓" };
  const it = ITEMS.find(i => i.zone === s.zone && near(s, i) && itemVisible(s, i) && !s.items.includes(i.id)); if (it) return { kind: "item", id: it.id, label: `Pick up ${it.name}`, icon: it.icon };
  const n = NPCS.find(n => n.zone === s.zone && near(s, n)); if (n) return { kind: "npc", id: n.id, label: `Talk to ${n.name.split(" ")[0]}`, icon: n.icon };
  const d = sessionDigs(s).find(d => d.zone === s.zone && near(s, d) && !s.dug.includes(d.id)); if (d) return { kind: "dig", id: d.id, label: `Pet, dig here! (${DIG_ENERGY} Energy)`, icon: "🐾" };
  if (s.zone === "wood" && near(s, BELL)) return { kind: "bell", label: "Ring the frog bell", icon: "🛎️" };
  if (s.zone === "ravine" && !s.quests.includes("vault")) {
    if (s.x === PLATE_PET.x && s.y === PLATE_PET.y && !s.pet) return { kind: "stay", label: "Ask pet to wait here", icon: "🐾" };
    if (s.x === PLATE_HERO.x && s.y === PLATE_HERO.y && s.pet) return { kind: "switch", label: "Press the plate", icon: "⚖️" };
  }
  const p = PORTALS[s.zone].find(p => near(s, p)); if (p) return { kind: "portal", id: p.target, label: p.target === "garden" ? "Enter Vernon’s Garden" : "Enter portal", icon: "🌀" };
  return null;
}
export type SideQuest = { id: string; title: string; giver: string; progress: number; total: number; done: boolean; reward: string };
export function sideQuests(s: AdventureState): SideQuest[] {
  const list: SideQuest[] = NPCS.map(n => ({ id: n.id, title: n.need.length === 1 ? `Find ${TREASURES[n.need[0]!]?.name ?? ITEMS.find(i => i.id === n.need[0])?.name}` : `Collect ${n.need.length} ${n.id === "tilly" ? "key fragments" : ITEMS.find(i => i.id === n.need[0])?.name.toLowerCase() + "s"}`, giver: n.name, progress: n.need.filter(i => s.items.includes(i)).length, total: n.need.length, done: s.quests.includes(n.id), reward: n.gear ? `${GEAR[n.gear].name} + ${n.points} points` : n.item ? `${TREASURES[n.item]!.name} + ${n.points} points` : `${n.points} points` }));
  list.push({ id: "vault", title: "Open the Stone Vault (paired plates)", giver: "Shadow Ravine", progress: s.quests.includes("vault") ? 1 : 0, total: 1, done: s.quests.includes("vault"), reward: "Sun Stone + 40 points" });
  list.push({ id: "digs", title: "Dig up every buried treasure", giver: "Your pet", progress: s.dug.length, total: DIGS.length, done: s.dug.length === DIGS.length, reward: "Points, key fragments and relics" });
  return list;
}
