// Energy Orchards: optional side lands (Ancient Orchard Grove, Crystal Caverns) that lead nowhere else.
// Trees top up Monere's real pet-care Energy once per tree per UTC day (enforced by orchard_harvest SQL).
import type { Position, ZoneId } from "./treasure";

export type SideZoneId = "grove" | "caverns";
export const ENERGY_GATE_COST = 50;
export const gateEnergyCost = (zone: SideZoneId) => zone === "caverns" ? 0 : ENERGY_GATE_COST;
export const TREE_ENERGY = 25;
export const TREE_IDS = ["meadow-1", "wood-1", "ravine-1", "lair-1", "grove-1", "grove-2", "grove-3", "caverns-1"] as const;
export type TreeId = (typeof TREE_IDS)[number];

/** Sealed elemental gates in the main lands; each opens one side land. The Leaf Gate was removed, so the Grove is no longer reachable. */
export const ELEMENTAL_GATES: { zone: ZoneId; at: Position; target: SideZoneId; icon: string; name: string }[] = [
  { zone: "ravine", at: { x: 4, y: 6 }, target: "caverns", icon: "💎", name: "Crystal Gate" },
];
/** Energy Trees standing in the main lands. */
export const MAP_TREES: { zone: ZoneId; at: Position; id: TreeId }[] = [
  { zone: "meadow", at: { x: 6, y: 12 }, id: "meadow-1" },
  { zone: "wood", at: { x: 11, y: 6 }, id: "wood-1" },
  { zone: "ravine", at: { x: 9, y: 16 }, id: "ravine-1" },
  { zone: "lair", at: { x: 18, y: 8 }, id: "lair-1" },
];

export const SIDE_COLS = 10, SIDE_ROWS = 7;
export const SIDE_ZONES: Record<SideZoneId, { name: string; subtitle: string; objective: string; music: string; start: Position; exit: Position; props: { at: Position; icon: string }[]; hazards: Position[]; trees: { id: TreeId; at: Position; icon: string }[] }> = {
  grove: { name: "Ancient Orchard Grove", subtitle: "Harvest golden fruit to restore Monere's Energy.", objective: "Pick fruit from the three Energy Trees", music: "orchard_theme.mp3", start: { x: 1, y: 3 }, exit: { x: 0, y: 3 },
    props: [{ at: { x: 1, y: 0 }, icon: "🌲" }, { at: { x: 9, y: 0 }, icon: "🌲" }, { at: { x: 9, y: 6 }, icon: "🌳" }, { at: { x: 2, y: 6 }, icon: "🌲" }, { at: { x: 6, y: 0 }, icon: "🌸" }], hazards: [],
    trees: [{ id: "grove-1", at: { x: 3, y: 1 }, icon: "🌳" }, { id: "grove-2", at: { x: 7, y: 2 }, icon: "🌳" }, { id: "grove-3", at: { x: 5, y: 5 }, icon: "🌳" }] },
  caverns: { name: "Crystal Caverns", subtitle: "Harvest Energy in the Crystal Maze.", objective: "Crystal Maze: gather Energy dots and Sun orbs, dodge the Shadow Chasers!", music: "caverns_theme.mp3", start: { x: 1, y: 3 }, exit: { x: 0, y: 3 },
    props: [{ at: { x: 2, y: 0 }, icon: "💎" }, { at: { x: 5, y: 0 }, icon: "🔷" }, { at: { x: 8, y: 0 }, icon: "💎" }, { at: { x: 3, y: 6 }, icon: "🔷" }, { at: { x: 8, y: 6 }, icon: "💎" }],
    hazards: [{ x: 3, y: 1 }, { x: 4, y: 2 }, { x: 5, y: 4 }, { x: 6, y: 2 }, { x: 4, y: 5 }],
    trees: [{ id: "caverns-1", at: { x: 7, y: 3 }, icon: "🔮" }] },
};

const adjacent = (a: Position, b: Position) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y) <= 1;
export const gateNear = (zone: ZoneId, p: Position) => ELEMENTAL_GATES.find(g => g.zone === zone && adjacent(p, g.at));
export const mapTreeNear = (zone: ZoneId, p: Position) => MAP_TREES.find(t => t.zone === zone && adjacent(p, t.at));
export const canOpenGate = (energy: number, zone: SideZoneId = "grove") => energy >= gateEnergyCost(zone);
export const harvestGain = (energy: number) => Math.max(0, Math.min(TREE_ENERGY, 100 - energy));
/** Free players may enter the Energy maze this many times per UTC day; Monere Plus members are unlimited (enforced by orchard_maze_start SQL). */
export const FREE_MAZE_ENTRIES_PER_DAY = 2;
const GUEST_MAZE_KEY = "monere-maze-entries";
/** Guest entry counter, keyed by UTC day so device clocks cannot extend it beyond a day rollover. Returns false when the free daily limit is reached. */
export function takeGuestMazeEntry(day: string, storage?: Pick<Storage, "getItem" | "setItem">): boolean {
  try {
    const store = storage ?? (typeof localStorage !== "undefined" ? localStorage : undefined);
    if (!store) return true;
    const saved = JSON.parse(store.getItem(GUEST_MAZE_KEY) ?? "null") as { day?: string; count?: number } | null;
    const count = saved?.day === day ? Number(saved.count) || 0 : 0;
    if (count >= FREE_MAZE_ENTRIES_PER_DAY) return false;
    store.setItem(GUEST_MAZE_KEY, JSON.stringify({ day, count: count + 1 }));
    return true;
  } catch { return true; }
}
/** Side-land walking: inside the grid and never onto a tree. */
export const sideWalkable = (zone: SideZoneId, p: Position) => p.x >= 0 && p.y >= 0 && p.x < SIDE_COLS && p.y < SIDE_ROWS && ![...SIDE_ZONES[zone].trees, ...SIDE_ZONES[zone].props].some(t => t.at.x === p.x && t.at.y === p.y);
/** Crystal shards: stepping on one sends Monere back to the entrance (display-only, no penalty). */
export const sideHazard = (zone: SideZoneId, p: Position) => SIDE_ZONES[zone].hazards.some(h => h.x === p.x && h.y === p.y);
export const sideAdjacent = adjacent;
