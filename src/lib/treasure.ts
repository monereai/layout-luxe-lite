export type ZoneId = "meadow" | "forest" | "sky";
export type ToolId = "magnifying-glass" | "lantern";
export type Position = { x: number; y: number };
export type AdventureState = Position & { version: 2; zone: ZoneId; relics: string[]; tools: ToolId[]; gear: ToolId[]; unlocked: ZoneId[]; fragments: string[]; landmarks: string[]; gates: string[]; pet: Position; pinned: boolean; matched: number[]; first: number | null; wind: number };
export type Relic = Position & { id: string; zone: ZoneId; name: string; icon: string; lore: string; clue: string; value: number; requires?: ToolId; tool?: ToolId; hidden?: boolean };
export const WORLD_SIZE = 24;
export const TILE_SIZE = 64;
export const ZONES: { id: ZoneId; name: string; subtitle: string; icon: string; requires?: ToolId }[] = [
  { id: "meadow", name: "Monere's Meadow", subtitle: "Stage 1 · Three chests, one brave beginning.", icon: "🌼" },
  { id: "forest", name: "Whispering Forest", subtitle: "Stage 2 · Two fragments, two hidden treasures.", icon: "🌲", requires: "magnifying-glass" },
  { id: "sky", name: "Sky Isles", subtitle: "Stage 3 · One Master Chest. Four matching pairs.", icon: "☁️", requires: "lantern" },
];
export const TOOLS = [
  { id: "magnifying-glass" as const, name: "Magnifying Glass", icon: "🔎", description: "Reveals nearby hidden forest chests." },
  { id: "lantern" as const, name: "Lantern", icon: "🏮", description: "Lights the landmarks and Master Chest in Sky Isles." },
];
export const RELICS: Relic[] = [
  { id: "cat-stone", zone: "meadow", x: 11, y: 10, name: "Watchful Pebble", icon: "🪨", value: 10, clue: "Walk north from the meadow entrance. A sleeping stone keeps watch.", lore: "Pause and notice the good. Be still — Psalm 46:10.", tool: "magnifying-glass" },
  { id: "daisy-seal", zone: "meadow", x: 7, y: 6, name: "Kindness Seal", icon: "🌼", value: 15, clue: "Follow the path northwest to the cottage and its daisies.", lore: "Kind words are like honey — Proverbs 16:24." },
  { id: "bridge-coin", zone: "meadow", x: 12, y: 20, name: "Bridgekeeper's Coin", icon: "🪙", value: 20, clue: "Travel south to the bridge. Look where two banks become one.", lore: "Build bridges, not walls. Blessed are the peacemakers — Matthew 5:9." },
  { id: "oak-heart", zone: "forest", x: 12, y: 6, name: "Oakheart Lantern", icon: "🏮", value: 35, hidden: true, requires: "magnifying-glass", tool: "lantern", clue: "An elder with wooden arms keeps a light inside its heart.", lore: "Your word is a lamp — Psalm 119:105." },
  { id: "fern-scroll", zone: "forest", x: 7, y: 10, name: "Patient Scroll", icon: "📜", value: 35, hidden: true, requires: "magnifying-glass", clue: "Where green fingers curl beside the quiet bend, patience waits unseen.", lore: "Be patient with everyone — 1 Thessalonians 5:14." },
  { id: "wisdom-star", zone: "sky", x: 12, y: 10, name: "Master Chest · Star of Wisdom", icon: "⭐", value: 150, requires: "lantern", clue: "Dawn gives a sign; broken pillars echo it. Unite the sky's four twins at the sun's heart.", lore: "Wisdom is more precious than rubies — Proverbs 3:15." },
];
export const REWARD_SETS = [
  { zone: "meadow" as const, item: "explorer-hat", name: "Explorer Hat", label: "Meadow Explorer" },
  { zone: "forest" as const, item: "emerald-cloak", name: "Emerald Cloak", label: "Forest Guardian" },
  { zone: "sky" as const, item: "trail-boots", name: "Trail Boots", label: "Sky Pathfinder" },
];
export const PORTALS: Record<ZoneId, (Position & { target: ZoneId })[]> = { meadow: [{ x: 21, y: 10, target: "forest" }], forest: [{ x: 2, y: 10, target: "meadow" }, { x: 21, y: 10, target: "sky" }], sky: [{ x: 2, y: 10, target: "forest" }] };
export const LANDMARKS = [
  { id: "roots", zone: "forest" as const, x: 5, y: 5, name: "Ancient Roots", icon: "🌳", fragment: "root-fragment" },
  { id: "pool", zone: "forest" as const, x: 18, y: 19, name: "Stillwater Pool", icon: "💧", fragment: "pool-fragment" },
  { id: "dawn", zone: "sky" as const, x: 12, y: 8, name: "Dawn Circle", icon: "☀️" },
  { id: "ruins", zone: "sky" as const, x: 17, y: 7, name: "Echoing Pillars", icon: "🏛️" },
];
export const PLATES = { player: { x: 8, y: 10 }, pet: { x: 7, y: 10 } };
export const MATCH_TILES = ["☀️", "🌙", "⭐", "☁️", "⭐", "☀️", "☁️", "🌙"];
export const near = (a: Position, b: Position) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y) <= 1;
export function zoneComplete(s: AdventureState, z: ZoneId) { return RELICS.filter(r => r.zone === z).every(r => s.relics.includes(r.id)); }
export function initialAdventure(): AdventureState { return { version: 2, zone: "meadow", x: 10, y: 12, relics: [], tools: [], gear: [], unlocked: ["meadow"], fragments: [], landmarks: [], gates: [], pet: { x: 9, y: 12 }, pinned: false, matched: [], first: null, wind: 0 }; }
export function walkable(zone: ZoneId, x: number, y: number): boolean {
  if (!Number.isInteger(x) || !Number.isInteger(y) || x < 2 || x > 21 || y < 2 || y > 21) return false;
  if (zone === "meadow") return y < 21 || (x >= 11 && x <= 13);
  if (zone === "forest") return !((x >= 4 && x <= 8 && y >= 12 && y <= 15) || (x >= 14 && x <= 17 && y >= 12 && y <= 15));
  return Math.abs(x - 12) + Math.abs(y - 11) <= 17;
}
export function canStep(s: AdventureState, x: number, y: number) { return walkable(s.zone, x, y) && !(s.zone === "forest" && x === 10 && !s.gates.includes("forest-gate")); }
export function terrain(z: ZoneId, x: number, y: number): "mud" | "wind" | null { if ((z === "meadow" && x === 9 && y >= 11 && y <= 13) || (z === "forest" && x === 9 && y >= 8 && y <= 11)) return "mud"; return z === "sky" && x === 14 && y >= 9 && y <= 12 ? "wind" : null; }
export function canEnter(s: AdventureState, zone: ZoneId): boolean { return zone === "meadow" || (zone === "forest" ? zoneComplete(s, "meadow") && s.tools.includes("magnifying-glass") : zoneComplete(s, "forest") && s.tools.includes("lantern")); }
export function chestVisible(s: AdventureState, r: Relic) { return !s.relics.includes(r.id) && (!r.hidden || (near(s, r) && s.gear.includes("magnifying-glass"))); }
export function canCollect(s: AdventureState, r: Relic): boolean { return s.zone === r.zone && !s.relics.includes(r.id) && near(s, r) && (!r.requires || s.gear.includes(r.requires)) && (r.zone !== "forest" || s.fragments.length === 2) && (r.zone !== "sky" || (s.matched.length === 8 && s.landmarks.includes("ruins"))); }
export type AdventureAction = { action: "status" | "move" | "collect" | "portal" | "gear" | "inspect" | "pet" | "match"; x?: number; y?: number; id?: string; gear?: ToolId[] };
function unlock(s: AdventureState): AdventureState { return { ...s, unlocked: ZONES.filter(z => canEnter(s, z.id)).map(z => z.id) }; }
export function applyAdventure(s: AdventureState, a: AdventureAction): AdventureState {
  if (a.action === "move" && typeof a.x === "number" && typeof a.y === "number" && Math.abs(s.x - a.x) + Math.abs(s.y - a.y) === 1 && canStep(s, a.x, a.y)) {
    let x = a.x; const y = a.y; let wind = s.wind;
    if (terrain(s.zone, x, y) === "wind") { wind++; if (wind % 2 === 1) x--; }
    const pet = s.pinned ? s.pet : { x: s.x, y: s.y };
    const gates = s.zone === "forest" && x === PLATES.player.x && y === PLATES.player.y && pet.x === PLATES.pet.x && pet.y === PLATES.pet.y ? [...new Set([...s.gates, "forest-gate"])] : s.gates;
    return { ...s, x, y, pet, gates, wind };
  }
  if (a.action === "pet") return { ...s, pinned: !s.pinned };
  if (a.action === "gear") return { ...s, gear: (a.gear ?? []).filter((id, i, all) => s.tools.includes(id) && all.indexOf(id) === i) };
  if (a.action === "inspect") {
    const l = LANDMARKS.find(l => l.id === a.id && l.zone === s.zone && near(s, l));
    if (!l || s.landmarks.includes(l.id) || (l.id === "ruins" && !s.landmarks.includes("dawn"))) return s;
    return { ...s, landmarks: [...s.landmarks, l.id], fragments: l.fragment ? [...new Set([...s.fragments, l.fragment])] : s.fragments };
  }
  if (a.action === "match") {
    const tile = Number(a.id);
    if (s.zone !== "sky" || !near(s, { x: 12, y: 10 }) || !s.landmarks.includes("ruins") || !Number.isInteger(tile) || tile < 0 || tile >= 8 || s.matched.includes(tile) || s.first === tile) return s;
    if (s.first === null) return { ...s, first: tile };
    return { ...s, matched: MATCH_TILES[s.first] === MATCH_TILES[tile] ? [...s.matched, s.first, tile] : s.matched, first: null };
  }
  if (a.action === "collect") {
    const r = RELICS.find(r => r.id === a.id); if (!r || !canCollect(s, r)) return s;
    const tools = r.tool ? [...new Set([...s.tools, r.tool])] : s.tools;
    return unlock({ ...s, relics: [...s.relics, r.id], tools, gear: r.tool ? [...new Set([...s.gear, r.tool])] : s.gear });
  }
  if (a.action === "portal") { const p = PORTALS[s.zone].find(p => p.target === a.id && near(s, p)); if (p && canEnter(s, p.target)) { const x = p.target === "meadow" || s.zone === "sky" ? 20 : 3; return { ...s, zone: p.target, x, y: 10, pet: { x: x - 1, y: 10 }, pinned: false }; } }
  return s;
}
export function questClue(s: AdventureState): string {
  if (zoneComplete(s, s.zone)) return s.zone === "sky" ? "The Master Chest is open. Carry this wisdom into the world." : "Stage complete! The eastern gateway now leads onward.";
  if (s.zone === "meadow") return RELICS.find(r => r.zone === "meadow" && !s.relics.includes(r.id))?.clue ?? "";
  if (s.zone === "forest") {
    if (!s.fragments.includes("root-fragment")) return "An elder wears no crown: its fingers reach beneath the earth. Search where the forest first remembers.";
    if (!s.gates.includes("forest-gate")) return "Two friends, two stones. Let small paws rest on the western moon while the lion stands beside the eastern sun.";
    if (!s.fragments.includes("pool-fragment")) return "Beyond the twin stones, a mirror never speaks. Where the southern water rests, the other half sleeps.";
    return RELICS.find(r => r.zone === "forest" && !s.relics.includes(r.id))?.clue ?? "";
  }
  if (!s.landmarks.includes("dawn")) return "Above the sun's heart, dawn has left a circle. Read its silent sign.";
  if (!s.landmarks.includes("ruins")) return "Follow dawn's promise to the broken pillars where the eastern sky echoes.";
  return "At the sun's heart, four twins are separated. Remember their faces, reunite each pair, and wisdom will open.";
}
export function parseAdventure(value: unknown): AdventureState {
  const f = initialAdventure(); if (!value || typeof value !== "object") return f;
  const s = value as Record<string, unknown>;
  const strings = (key: string, allowed: string[]) => Array.isArray(s[key]) ? allowed.filter(id => (s[key] as unknown[]).includes(id)) : [];
  const relics = strings("relics", RELICS.map(r => r.id)); const legacy = s['version'] !== 2;
  const tools = TOOLS.filter(t => RELICS.some(r => r.tool === t.id && relics.includes(r.id))).map(t => t.id);
  const rawPet = s['pet'] as Position | undefined;
  let partial: AdventureState = { ...f, relics, tools, fragments: strings("fragments", ["root-fragment", "pool-fragment"]), landmarks: strings("landmarks", LANDMARKS.map(l => l.id)), gates: strings("gates", ["forest-gate"]), pinned: s['pinned'] === true, matched: Array.isArray(s['matched']) ? [...new Set(s['matched'].filter((n): n is number => typeof n === "number" && Number.isInteger(n) && n >= 0 && n < 8))] : [], first: typeof s['first'] === "number" && Number.isInteger(s['first']) && s['first'] >= 0 && s['first'] < 8 ? s['first'] : null, wind: typeof s['wind'] === "number" && Number.isInteger(s['wind']) && s['wind'] >= 0 ? s['wind'] : 0 };
  if (legacy && relics.some(id => ["oak-heart", "fern-scroll", "wisdom-star"].includes(id))) partial = { ...partial, fragments: ["root-fragment", "pool-fragment"], gates: ["forest-gate"] };
  if (legacy && relics.includes("wisdom-star")) partial = { ...partial, landmarks: ["roots", "pool", "dawn", "ruins"], matched: [0,1,2,3,4,5,6,7] };
  const zone = ZONES.find(z => z.id === s['zone'])?.id ?? "meadow"; const validZone = canEnter(partial, zone) ? zone : "meadow";
  const x = typeof s['x'] === "number" ? s['x'] : f.x; const y = typeof s['y'] === "number" ? s['y'] : f.y;
  partial = { ...partial, zone: validZone }; const position = canStep(partial, x, y) ? { x, y } : validZone === "meadow" ? { x: 10, y: 12 } : { x: 3, y: 10 };
  return unlock({ ...partial, ...position, pet: rawPet && canStep(partial, rawPet.x, rawPet.y) ? { x: rawPet.x, y: rawPet.y } : { x: position.x - 1, y: position.y }, gear: Array.isArray(s['gear']) ? tools.filter(t => (s['gear'] as unknown[]).includes(t)) : tools });
}
