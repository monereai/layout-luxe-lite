// Energy Orchards: optional side lands (Ancient Orchard Grove, Crystal Caverns) that lead nowhere else.
// Trees top up Monere's real pet-care Energy once per tree per UTC day (enforced by orchard_harvest SQL).
import type { Position, ZoneId } from "./treasure";

export type SideZoneId = "grove" | "caverns";
export const ENERGY_GATE_COST = 50;
export const TREE_ENERGY = 25;
export const TREE_IDS = ["meadow-1", "wood-1", "ravine-1", "lair-1", "grove-1", "grove-2", "grove-3", "caverns-1"] as const;
export type TreeId = (typeof TREE_IDS)[number];

/** Sealed elemental gates in the main lands; each opens one side land. */
export const ELEMENTAL_GATES: { zone: ZoneId; at: Position; target: SideZoneId; icon: string; name: string }[] = [
  { zone: "meadow", at: { x: 8, y: 12 }, target: "grove", icon: "🌿", name: "Leaf Gate" },
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
export const SIDE_ZONES: Record<SideZoneId, { name: string; subtitle: string; music: string; start: Position; exit: Position; trees: { id: TreeId; at: Position; icon: string }[] }> = {
  grove: { name: "Ancient Orchard Grove", subtitle: "Harvest golden fruit to restore Monere's Energy.", music: "orchard_theme.mp3", start: { x: 1, y: 3 }, exit: { x: 0, y: 3 },
    trees: [{ id: "grove-1", at: { x: 3, y: 1 }, icon: "🌳" }, { id: "grove-2", at: { x: 7, y: 2 }, icon: "🌳" }, { id: "grove-3", at: { x: 5, y: 5 }, icon: "🌳" }] },
  caverns: { name: "Crystal Caverns", subtitle: "A crystal tree glows deep in the cave.", music: "caverns_theme.mp3", start: { x: 1, y: 3 }, exit: { x: 0, y: 3 },
    trees: [{ id: "caverns-1", at: { x: 7, y: 3 }, icon: "🔮" }] },
};

const adjacent = (a: Position, b: Position) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y) <= 1;
export const gateNear = (zone: ZoneId, p: Position) => ELEMENTAL_GATES.find(g => g.zone === zone && adjacent(p, g.at));
export const mapTreeNear = (zone: ZoneId, p: Position) => MAP_TREES.find(t => t.zone === zone && adjacent(p, t.at));
export const canOpenGate = (energy: number) => energy >= ENERGY_GATE_COST;
export const harvestGain = (energy: number) => Math.max(0, Math.min(TREE_ENERGY, 100 - energy));
/** Side-land walking: inside the grid and never onto a tree. */
export const sideWalkable = (zone: SideZoneId, p: Position) => p.x >= 0 && p.y >= 0 && p.x < SIDE_COLS && p.y < SIDE_ROWS && !SIDE_ZONES[zone].trees.some(t => t.at.x === p.x && t.at.y === p.y);
export const sideAdjacent = adjacent;
