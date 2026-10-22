export type ZoneId = "meadow" | "forest" | "sky";
export type ToolId = "magnifying-glass" | "lantern";
export type Position = { x: number; y: number };
export type AdventureState = Position & { zone: ZoneId; relics: string[]; tools: ToolId[]; gear: ToolId[]; unlocked: ZoneId[] };
export type Relic = Position & { id: string; zone: ZoneId; name: string; icon: string; lore: string; clue: string; value: number; requires?: ToolId; tool?: ToolId };
export const WORLD_SIZE = 24;
export const TILE_SIZE = 64;
export const ZONES: { id: ZoneId; name: string; subtitle: string; icon: string; requires?: ToolId }[] = [
  { id: "meadow", name: "Monere's Meadow", subtitle: "Every brave journey starts with a small step.", icon: "🌼" },
  { id: "forest", name: "Whispering Forest", subtitle: "Look closer. Light the way. Listen with care.", icon: "🌲", requires: "magnifying-glass" },
  { id: "sky", name: "Sky Isles", subtitle: "Let courage carry you higher.", icon: "☁️", requires: "lantern" },
];
export const TOOLS = [
  { id: "magnifying-glass" as const, name: "Magnifying Glass", icon: "🔎", description: "Reveals secret tracks and hidden chests. Opens Whispering Forest." },
  { id: "lantern" as const, name: "Lantern", icon: "🏮", description: "Illuminates invisible treasures and the gateway to Sky Isles." },
];
export const RELICS: Relic[] = [
  { id: "cat-stone", zone: "meadow", x: 11, y: 10, name: "Watchful Pebble", icon: "🪨", value: 10, clue: "Find the stone shaped like a sleeping cat in the Meadow.", lore: "Even a small stone can remind us to pause and notice the good around us. Be still — Psalm 46:10.", tool: "magnifying-glass" },
  { id: "daisy-seal", zone: "meadow", x: 7, y: 6, name: "Kindness Seal", icon: "🌼", value: 15, clue: "Where the cottage path meets the daisies, a kindness is waiting.", lore: "A gentle word can brighten someone's whole day. Kind words are like honey — Proverbs 16:24." },
  { id: "bridge-coin", zone: "meadow", x: 12, y: 20, name: "Bridgekeeper's Coin", icon: "🪙", value: 20, clue: "The wooden bridge joins two banks. Search just before the water.", lore: "Build bridges with others, not walls. Blessed are the peacemakers — Matthew 5:9." },
  { id: "meadow-feather", zone: "meadow", x: 18, y: 15, name: "Courage Feather", icon: "🪶", value: 20, clue: "Tiny tracks hide among the eastern flowers. Look closer with your Magnifying Glass.", lore: "Courage is taking a good step even when you feel unsure. Be strong and courageous — Joshua 1:9.", requires: "magnifying-glass" },
  { id: "garden-key", zone: "meadow", x: 5, y: 16, name: "Garden Key", icon: "🗝️", value: 25, clue: "A mossy stone in the southwest keeps a secret underneath.", lore: "Small faithful choices open important doors. Faithful in little — Luke 16:10." },
  { id: "sunflower-gem", zone: "meadow", x: 16, y: 5, name: "Gratitude Amber", icon: "💎", value: 30, clue: "Head north to the sunlit rock, where golden flowers grow.", lore: "Notice what you have, not only what you wish for. Give thanks in all circumstances — 1 Thessalonians 5:18." },
  { id: "oak-heart", zone: "forest", x: 12, y: 6, name: "Oakheart Lantern", icon: "🏮", value: 35, clue: "The ancient oak has a hollow heart. A light waits beneath its roots.", lore: "Wisdom lights the next step, not always the whole journey. Your word is a lamp — Psalm 119:105.", tool: "lantern" },
  { id: "fern-scroll", zone: "forest", x: 7, y: 10, name: "Patient Scroll", icon: "📜", value: 35, clue: "The western path bends around the ferns. Follow the quiet curve.", lore: "Good things grow with patience. Be patient with everyone — 1 Thessalonians 5:14." },
  { id: "firefly-jar", zone: "forest", x: 17, y: 8, name: "Firefly Promise", icon: "✨", value: 40, clue: "Lift your Lantern beside the eastern grove; unseen lights will answer.", lore: "Keep a promise, even when nobody is watching. Let your yes be yes — Matthew 5:37.", requires: "lantern" },
  { id: "pool-pearl", zone: "forest", x: 18, y: 19, name: "Stillwater Pearl", icon: "🫧", value: 45, clue: "Still water holds a pearl. Search at the edge of the forest pool.", lore: "Listening carefully is a gift to others. Be quick to listen — James 1:19." },
  { id: "moss-compass", zone: "forest", x: 11, y: 17, name: "True North Compass", icon: "🧭", value: 45, clue: "Use your Magnifying Glass on the mossy southern trail.", lore: "Let truth guide your direction. Trust in the Lord — Proverbs 3:5–6.", requires: "magnifying-glass" },
  { id: "root-crown", zone: "forest", x: 5, y: 5, name: "Humble Crown", icon: "👑", value: 50, clue: "A crown lies low among the northwest roots, not high on a throne.", lore: "Greatness begins with serving. Whoever wants to become great must be a servant — Mark 10:43." },
  { id: "sun-medallion", zone: "sky", x: 12, y: 10, name: "Dawn Medallion", icon: "☀️", value: 75, clue: "At the heart of the island, the sun rests in a circle of stone.", lore: "Bring light wherever you go. Let your light shine — Matthew 5:16." },
  { id: "cloud-quill", zone: "sky", x: 8, y: 6, name: "Hope Quill", icon: "🪶", value: 80, clue: "A quill drifted beside the northern pool. Follow the water's shimmer.", lore: "Hope does not give up on tomorrow. Those who hope in the Lord renew their strength — Isaiah 40:31." },
  { id: "starlight-crystal", zone: "sky", x: 18, y: 7, name: "Starlight Crystal", icon: "🔮", value: 90, clue: "Light your Lantern at the eastern ruins to reveal a crystal.", lore: "Choose what is good, even in secret. Walk as children of light — Ephesians 5:8.", requires: "lantern" },
  { id: "sky-harp", zone: "sky", x: 6, y: 15, name: "Harmony Harp", icon: "🎵", value: 90, clue: "The southwest ruins hold a song without a singer.", lore: "Different voices can make a beautiful harmony. Live in harmony — Romans 12:16." },
  { id: "eagle-sigil", zone: "sky", x: 17, y: 17, name: "Eagle's Sigil", icon: "🦅", value: 100, clue: "Small claw marks circle the southern arch. Examine them closely.", lore: "Use strength to protect, not to overpower. Speak up for those who cannot speak — Proverbs 31:8.", requires: "magnifying-glass" },
  { id: "wisdom-star", zone: "sky", x: 12, y: 20, name: "Star of Wisdom", icon: "⭐", value: 150, clue: "The last star rests at the southern lookout, above the clouds.", lore: "The greatest treasure is wisdom shared with others. Wisdom is more precious than rubies — Proverbs 3:15." },
];
export const REWARD_SETS = [
  { zone: "meadow" as const, item: "explorer-hat", name: "Explorer Hat", label: "Meadow Explorer" },
  { zone: "forest" as const, item: "emerald-cloak", name: "Emerald Cloak", label: "Forest Guardian" },
  { zone: "sky" as const, item: "trail-boots", name: "Trail Boots", label: "Sky Pathfinder" },
];
export const PORTALS: Record<ZoneId, (Position & { target: ZoneId })[]> = {
  meadow: [{ x: 21, y: 10, target: "forest" }],
  forest: [{ x: 2, y: 10, target: "meadow" }, { x: 21, y: 10, target: "sky" }],
  sky: [{ x: 2, y: 10, target: "forest" }],
};
export function initialAdventure(): AdventureState { return { zone: "meadow", x: 10, y: 12, relics: [], tools: [], gear: [], unlocked: ["meadow"] }; }
export function walkable(zone: ZoneId, x: number, y: number): boolean {
  if (!Number.isInteger(x) || !Number.isInteger(y) || x < 2 || x > 21 || y < 2 || y > 21) return false;
  if (zone === "meadow") return y < 21 || (x >= 11 && x <= 13);
  if (zone === "forest") return !((x >= 4 && x <= 8 && y >= 12 && y <= 15) || (x >= 14 && x <= 17 && y >= 12 && y <= 15));
  return Math.abs(x - 12) + Math.abs(y - 11) <= 17;
}
export function canEnter(state: AdventureState, zone: ZoneId): boolean { const requirement = ZONES.find(z => z.id === zone)?.requires; return !requirement || state.tools.includes(requirement); }
export function canCollect(state: AdventureState, relic: Relic): boolean { return state.zone === relic.zone && !state.relics.includes(relic.id) && Math.abs(state.x - relic.x) + Math.abs(state.y - relic.y) <= 1 && (!relic.requires || state.gear.includes(relic.requires)); }
export type AdventureAction = { action: "status" | "move" | "collect" | "portal" | "gear"; x?: number; y?: number; id?: string; gear?: ToolId[] };
export function applyAdventure(state: AdventureState, action: AdventureAction): AdventureState {
  if (action.action === "move" && typeof action.x === "number" && typeof action.y === "number" && Math.abs(state.x - action.x) + Math.abs(state.y - action.y) === 1 && walkable(state.zone, action.x, action.y)) return { ...state, x: action.x, y: action.y };
  if (action.action === "gear") return { ...state, gear: (action.gear ?? []).filter((id, i, all) => state.tools.includes(id) && all.indexOf(id) === i) };
  if (action.action === "collect") {
    const relic = RELICS.find(r => r.id === action.id);
    if (!relic || !canCollect(state, relic)) return state;
    const tools = relic.tool && !state.tools.includes(relic.tool) ? [...state.tools, relic.tool] : state.tools;
    return { ...state, relics: [...state.relics, relic.id], tools, gear: relic.tool ? [...new Set([...state.gear, relic.tool])] : state.gear, unlocked: ZONES.filter(z => canEnter({ ...state, tools }, z.id)).map(z => z.id) };
  }
  if (action.action === "portal") {
    const portal = PORTALS[state.zone].find(p => p.target === action.id && Math.abs(p.x - state.x) + Math.abs(p.y - state.y) <= 1);
    if (portal && canEnter(state, portal.target)) return { ...state, zone: portal.target, x: portal.target === "meadow" || (state.zone === "sky" && portal.target === "forest") ? 20 : 3, y: 10 };
  }
  return state;
}
export function parseAdventure(value: unknown): AdventureState {
  const fallback = initialAdventure();
  if (!value || typeof value !== "object") return fallback;
  const s = value as Record<string, unknown>;
  const relics = Array.isArray(s.relics) ? RELICS.filter(r => (s.relics as unknown[]).includes(r.id)).map(r => r.id) : [];
  const tools = TOOLS.filter(t => RELICS.some(r => r.tool === t.id && relics.includes(r.id))).map(t => t.id);
  const zone = ZONES.find(z => z.id === s.zone)?.id ?? "meadow";
  const partial = { ...fallback, relics, tools };
  const validZone = canEnter(partial, zone) ? zone : "meadow";
  const x = typeof s.x === "number" ? s.x : fallback.x; const y = typeof s.y === "number" ? s.y : fallback.y;
  return { ...partial, zone: validZone, ...(walkable(validZone, x, y) ? { x, y } : {}), gear: Array.isArray(s.gear) ? tools.filter(t => (s.gear as unknown[]).includes(t)) : tools, unlocked: ZONES.filter(z => canEnter(partial, z.id)).map(z => z.id) };
}