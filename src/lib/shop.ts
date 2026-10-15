import { useEffect, useSyncExternalStore } from "react";
import detectiveHat from "@/assets/shop/detective-hat.webp";
import crown from "@/assets/shop/crown.webp";
import amberSnapback from "@/assets/shop/amber-snapback.webp";
import cozyBeanie from "@/assets/shop/cozy-beanie.webp";
import explorerHat from "@/assets/shop/explorer-hat.webp";
import cowboyHat from "@/assets/shop/cowboy-hat.webp";
import scholarCap from "@/assets/shop/scholar-cap.webp";
import wizardHat from "@/assets/shop/wizard-hat.webp";
import topHat from "@/assets/shop/top-hat.webp";
import halo from "@/assets/shop/halo.webp";
import sunglasses from "@/assets/shop/sunglasses.webp";
import roundSpecs from "@/assets/shop/round-specs.webp";
import heroCape from "@/assets/shop/hero-cape.webp";
import royalCape from "@/assets/shop/royal-cape.webp";
import stormCloak from "@/assets/shop/storm-cloak.webp";
import crimsonCape from "@/assets/shop/crimson-cape.webp";
import emeraldCloak from "@/assets/shop/emerald-cloak.webp";
import galaxyCape from "@/assets/shop/galaxy-cape.webp";
import flameCape from "@/assets/shop/flame-cape.webp";
import arcticCloak from "@/assets/shop/arctic-cloak.webp";
import shadowCloak from "@/assets/shop/shadow-cloak.webp";
import knightCape from "@/assets/shop/knight-cape.webp";
import phoenixWings from "@/assets/shop/phoenix-wings.webp";
import angelWings from "@/assets/shop/angel-wings.webp";
import crispSneakers from "@/assets/shop/crisp-sneakers.webp";
import trailBoots from "@/assets/shop/trail-boots.webp";
import skateClassics from "@/assets/shop/skate-classics.webp";
import soccerCleats from "@/assets/shop/soccer-cleats.webp";
import goldenSliders from "@/assets/shop/golden-sliders.webp";
import knightBoots from "@/assets/shop/knight-boots.webp";
import bowTie from "@/assets/shop/bow-tie.webp";
import cozyScarf from "@/assets/shop/cozy-scarf.webp";
import goldMedal from "@/assets/shop/gold-medal.webp";
import goldChain from "@/assets/shop/gold-chain.webp";
import bandana from "@/assets/shop/bandana.webp";
import friendshipBeads from "@/assets/shop/friendship-beads.webp";

export const SHOP_KEY = "monereai-shop";
export type ShopCategory = "hat" | "glasses" | "costume" | "footwear" | "accessory";
export type ShopItem = { id: string; name: string; category: ShopCategory; cost: number; src: string };

export const SHOP_ITEMS: ShopItem[] = [
  // Hats (10)
  { id: "amber-snapback", name: "Amber Snapback", category: "hat", cost: 120, src: amberSnapback },
  { id: "cozy-beanie", name: "Cozy Beanie", category: "hat", cost: 180, src: cozyBeanie },
  { id: "detective-hat", name: "Detective Hat", category: "hat", cost: 200, src: detectiveHat },
  { id: "explorer-hat", name: "Explorer Hat", category: "hat", cost: 220, src: explorerHat },
  { id: "cowboy-hat", name: "Cowboy Hat", category: "hat", cost: 260, src: cowboyHat },
  { id: "scholar-cap", name: "Scholar Cap", category: "hat", cost: 300, src: scholarCap },
  { id: "wizard-hat", name: "Wizard Hat", category: "hat", cost: 350, src: wizardHat },
  { id: "top-hat", name: "Top Hat", category: "hat", cost: 400, src: topHat },
  { id: "halo", name: "Golden Halo", category: "hat", cost: 500, src: halo },
  { id: "crown", name: "Golden Crown", category: "hat", cost: 600, src: crown },
  // Footwear (6)
  { id: "crisp-sneakers", name: "Crisp White Sneakers", category: "footwear", cost: 140, src: crispSneakers },
  { id: "skate-classics", name: "Retro Skate Classics", category: "footwear", cost: 200, src: skateClassics },
  { id: "trail-boots", name: "Trail Boots", category: "footwear", cost: 260, src: trailBoots },
  { id: "soccer-cleats", name: "Soccer Cleats", category: "footwear", cost: 320, src: soccerCleats },
  { id: "golden-sliders", name: "Golden Sliders", category: "footwear", cost: 400, src: goldenSliders },
  { id: "knight-boots", name: "Knight's Steel Boots", category: "footwear", cost: 500, src: knightBoots },
  // Accessories (6) — worn at the neck / chest
  { id: "bandana", name: "Blue Paisley Bandana", category: "accessory", cost: 100, src: bandana },
  { id: "bow-tie", name: "Red Bow Tie", category: "accessory", cost: 130, src: bowTie },
  { id: "friendship-beads", name: "Friendship Beads", category: "accessory", cost: 180, src: friendshipBeads },
  { id: "cozy-scarf", name: "Cozy Striped Scarf", category: "accessory", cost: 240, src: cozyScarf },
  { id: "gold-chain", name: "Gold Cross Chain", category: "accessory", cost: 380, src: goldChain },
  { id: "gold-medal", name: "Champion's Medal", category: "accessory", cost: 450, src: goldMedal },
  // Glasses
  { id: "sunglasses", name: "Sunglasses", category: "glasses", cost: 150, src: sunglasses },
  { id: "round-specs", name: "Scholar Specs", category: "glasses", cost: 250, src: roundSpecs },
  // Costumes (12)
  { id: "storm-cloak", name: "Storm Cloak", category: "costume", cost: 300, src: stormCloak },
  { id: "crimson-cape", name: "Crimson Warrior Cape", category: "costume", cost: 350, src: crimsonCape },
  { id: "emerald-cloak", name: "Emerald Forest Cloak", category: "costume", cost: 380, src: emeraldCloak },
  { id: "galaxy-cape", name: "Galaxy Cape", category: "costume", cost: 420, src: galaxyCape },
  { id: "flame-cape", name: "Flame Cape", category: "costume", cost: 450, src: flameCape },
  { id: "arctic-cloak", name: "Arctic Winter Cloak", category: "costume", cost: 480, src: arcticCloak },
  { id: "hero-cape", name: "Superhero Cape", category: "costume", cost: 500, src: heroCape },
  { id: "shadow-cloak", name: "Shadow Hood", category: "costume", cost: 520, src: shadowCloak },
  { id: "knight-cape", name: "Knight's Banner Cape", category: "costume", cost: 560, src: knightCape },
  { id: "phoenix-wings", name: "Phoenix Wings", category: "costume", cost: 620, src: phoenixWings },
  { id: "angel-wings", name: "Angel Wings", category: "costume", cost: 700, src: angelWings },
  { id: "royal-cape", name: "Royal Cape", category: "costume", cost: 800, src: royalCape },
];

export type ShopState = { spent: number; owned: string[]; equipped: Partial<Record<ShopCategory, string>> };
const EMPTY: ShopState = { spent: 0, owned: [], equipped: {} };

/** Wallet balance = points earned in "Where's Monere?" minus points spent in the shop. */
export function walletBalance(earned: number, state: ShopState) {
  return Math.max(0, earned - state.spent);
}

/** Pure purchase rule: returns the new state, or null when not affordable / unknown / already owned. */
export function buy(state: ShopState, earned: number, itemId: string): ShopState | null {
  const item = SHOP_ITEMS.find((i) => i.id === itemId);
  if (!item || state.owned.includes(itemId)) return null;
  if (walletBalance(earned, state) < item.cost) return null;
  return { spent: state.spent + item.cost, owned: [...state.owned, itemId], equipped: { ...state.equipped, [item.category]: itemId } };
}

/** Equip an owned item (one per category) or pass null to take that category off. */
export function equip(state: ShopState, category: ShopCategory, itemId: string | null): ShopState {
  if (itemId && !state.owned.includes(itemId)) return state;
  const equipped = { ...state.equipped };
  if (itemId) equipped[category] = itemId;
  else delete equipped[category];
  return { ...state, equipped };
}

let current = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

export function saveShop(next: ShopState) {
  current = next;
  try { localStorage.setItem(SHOP_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  listeners.forEach((l) => l());
}

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const p = JSON.parse(localStorage.getItem(SHOP_KEY) ?? "null");
    if (p && typeof p.spent === "number" && Array.isArray(p.owned)) {
      current = { spent: p.spent, owned: p.owned, equipped: p.equipped ?? {} };
      listeners.forEach((l) => l());
    }
  } catch { /* ignore */ }
}

export function useShop() {
  const s = useSyncExternalStore((cb) => { listeners.add(cb); return () => listeners.delete(cb); }, () => current, () => EMPTY);
  useEffect(load, []);
  return s;
}

export function equippedItems(state: ShopState) {
  return (Object.values(state.equipped).filter(Boolean) as string[])
    .map((id) => SHOP_ITEMS.find((i) => i.id === id))
    .filter((i): i is ShopItem => !!i);
}

/** Categories that count as clothing for the "all maps complete" mystery reward. */
export const MYSTERY_CATEGORIES: ShopCategory[] = ["hat", "costume", "footwear", "accessory"];

/** Gives one random unowned clothing item for free and equips it; null when everything is owned. */
export function grantMystery(state: ShopState, rand: () => number = Math.random): { state: ShopState; item: ShopItem } | null {
  const pool = SHOP_ITEMS.filter((i) => MYSTERY_CATEGORIES.includes(i.category) && !state.owned.includes(i.id));
  if (!pool.length) return null;
  const item = pool[Math.min(pool.length - 1, Math.floor(rand() * pool.length))]!;
  return { item, state: { ...state, owned: [...state.owned, item.id], equipped: { ...state.equipped, [item.category]: item.id } } };
}
