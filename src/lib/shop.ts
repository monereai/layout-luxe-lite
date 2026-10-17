import { useEffect, useSyncExternalStore } from "react";
import { COMBINATION_FAMILIES, type CombinationPieces } from "@/lib/shop-combinations";
import { allJigsawsComplete, type GameState } from "@/lib/game";
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
import partyHat from "@/assets/shop/party-hat.png";
import vikingHelmet from "@/assets/shop/viking-helmet.png";
import starShades from "@/assets/shop/star-shades.png";
import pirateCoat from "@/assets/shop/pirate-coat.png";
import astroSuit from "@/assets/shop/astro-suit.png";
import rainBoots from "@/assets/shop/rain-boots.png";
import rocketBoots from "@/assets/shop/rocket-boots.png";
import shellNecklace from "@/assets/shop/shell-necklace.png";

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
  { id: "party-hat", name: "Party Hat", category: "hat", cost: 90, src: partyHat },
  { id: "viking-helmet", name: "Viking Helmet", category: "hat", cost: 450, src: vikingHelmet },
  // Footwear (6)
  { id: "crisp-sneakers", name: "Crisp White Sneakers", category: "footwear", cost: 140, src: crispSneakers },
  { id: "skate-classics", name: "Retro Skate Classics", category: "footwear", cost: 200, src: skateClassics },
  { id: "trail-boots", name: "Trail Boots", category: "footwear", cost: 260, src: trailBoots },
  { id: "soccer-cleats", name: "Soccer Cleats", category: "footwear", cost: 320, src: soccerCleats },
  { id: "golden-sliders", name: "Golden Sliders", category: "footwear", cost: 400, src: goldenSliders },
  { id: "knight-boots", name: "Knight's Steel Boots", category: "footwear", cost: 500, src: knightBoots },
  { id: "rain-boots", name: "Sunny Rain Boots", category: "footwear", cost: 160, src: rainBoots },
  { id: "rocket-boots", name: "Rocket Boots", category: "footwear", cost: 550, src: rocketBoots },
  // Accessories (6) — worn at the neck / chest
  { id: "bandana", name: "Blue Paisley Bandana", category: "accessory", cost: 100, src: bandana },
  { id: "bow-tie", name: "Red Bow Tie", category: "accessory", cost: 130, src: bowTie },
  { id: "friendship-beads", name: "Friendship Beads", category: "accessory", cost: 180, src: friendshipBeads },
  { id: "cozy-scarf", name: "Cozy Striped Scarf", category: "accessory", cost: 240, src: cozyScarf },
  { id: "gold-chain", name: "Gold Cross Chain", category: "accessory", cost: 380, src: goldChain },
  { id: "gold-medal", name: "Champion's Medal", category: "accessory", cost: 450, src: goldMedal },
  { id: "shell-necklace", name: "Shell Necklace", category: "accessory", cost: 150, src: shellNecklace },
  // Glasses
  { id: "sunglasses", name: "Sunglasses", category: "glasses", cost: 150, src: sunglasses },
  { id: "round-specs", name: "Scholar Specs", category: "glasses", cost: 250, src: roundSpecs },
  { id: "star-shades", name: "Star Shades", category: "glasses", cost: 200, src: starShades },
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
  { id: "pirate-coat", name: "Pirate Captain Coat", category: "costume", cost: 480, src: pirateCoat },
  { id: "astro-suit", name: "Astronaut Suit", category: "costume", cost: 650, src: astroSuit },
];

export type EquipmentSlot = "hat" | "outfit" | "glasses" | "accessory" | "footwear";
export function equipmentSlot(category: ShopCategory): EquipmentSlot { return category === "costume" ? "outfit" : category; }
export type ShopState = { spent: number; owned: string[]; equipped: Partial<Record<EquipmentSlot | "costume", string>>; comboUnlocked?: string[]; jigsawReward?: string };
export function normalizeEquipment(state: ShopState): ShopState {
  const equipped: ShopState["equipped"] = {};
  for (const slot of ["hat", "outfit", "glasses", "accessory", "footwear"] as const) {
    const id = state.equipped[slot] ?? (slot === "outfit" ? state.equipped.costume : undefined);
    const item = SHOP_ITEMS.find((item) => item.id === id);
    if (item && state.owned.includes(item.id) && equipmentSlot(item.category) === slot) {
      equipped[slot] = item.id;
    }
  }
  return { ...state, equipped };
}
const EMPTY: ShopState = { spent: 0, owned: [], equipped: {} };

/** Wallet balance = points earned in "Where's Monere?" minus points spent in the shop. */
export function walletBalance(earned: number, state: ShopState, habitatSpent = 0) {
  return Math.max(0, earned - state.spent - habitatSpent);
}

/** Pure purchase rule: returns the new state, or null when not affordable / unknown / already owned. */
export function buy(state: ShopState, earned: number, itemId: string): ShopState | null {
  const item = SHOP_ITEMS.find((i) => i.id === itemId);
  if (!item || state.owned.includes(itemId)) return null;
  if (walletBalance(earned, state) < item.cost) return null;
  const purchased = { ...state, spent: state.spent + item.cost, owned: [...state.owned, itemId] };
  return equip(purchased, item.category, itemId);
}

/** A ready-made set costs a quarter more than buying its pieces one by one. */
export const COMBINATION_UPLIFT = 1.25;

const pieceCost = (id: string) => SHOP_ITEMS.find((item) => item.id === id)?.cost ?? 0;

/** Set price: the pieces' combined cost plus 25%, rounded up to the nearest 5 points. */
function setPrice(piecesCost: number) {
  return piecesCost ? Math.ceil((piecesCost * COMBINATION_UPLIFT) / 5) * 5 : 0;
}

/** Points still needed for a combination: its unowned pieces plus 25%; 0 once all are owned. */
export function combinationPrice(state: ShopState, family: CombinationPieces) {
  return setPrice(
    [family.hat, family.outfit, family.footwear]
      .filter((id) => !state.owned.includes(id))
      .reduce((sum, id) => sum + pieceCost(id), 0),
  );
}

/** What a combination is worth: every piece's cost plus 25%, rounded up to the nearest 5. */
export function combinationValue(family: CombinationPieces) {
  return setPrice([family.hat, family.outfit, family.footwear].reduce((sum, id) => sum + pieceCost(id), 0));
}

/** Combinations listed by value, cheapest set first. */
export const COMBINATIONS_BY_VALUE = [...COMBINATION_FAMILIES].sort((a, b) => combinationValue(a) - combinationValue(b));

/** Buys the combination pieces the player does not own yet, then wears all three. Null when already owned or unaffordable. */
export function buyCombination(state: ShopState, wallet: number, family: CombinationPieces): ShopState | null {
  const price = combinationPrice(state, family);
  if (!price || wallet < price) return null;
  const missing = [family.hat, family.outfit, family.footwear].filter((id) => !state.owned.includes(id));
  const purchased: ShopState = { ...state, spent: state.spent + price, owned: [...state.owned, ...missing] };
  return equip(equip(equip(purchased, "hat", family.hat), "costume", family.outfit), "footwear", family.footwear);
}

/** Every selection is wearable: equipping keeps all other slots; null removes just that slot. */
export function equip(state: ShopState, category: ShopCategory, itemId: string | null): ShopState {
  const item = SHOP_ITEMS.find((item) => item.id === itemId);
  if (itemId && (!state.owned.includes(itemId) || item?.category !== category)) return state;
  const slot = equipmentSlot(category);
  const equipped = { ...normalizeEquipment(state).equipped };
  if (itemId) equipped[slot] = itemId;
  else delete equipped[slot];
  return { ...state, equipped };
}

let current = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

export function saveShop(next: ShopState) {
  current = normalizeEquipment(next);
  try { localStorage.setItem(SHOP_KEY, JSON.stringify(current)); } catch { /* ignore */ }
  listeners.forEach((l) => l());
}

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const p = JSON.parse(localStorage.getItem(SHOP_KEY) ?? "null");
    if (p && typeof p.spent === "number" && Array.isArray(p.owned)) {
      current = normalizeEquipment({
        spent: p.spent,
        owned: p.owned,
        equipped: p.equipped ?? {},
        comboUnlocked: Array.isArray(p.comboUnlocked) ? p.comboUnlocked : [],
        jigsawReward: typeof p.jigsawReward === "string" ? p.jigsawReward : undefined,
      });
      listeners.forEach((l) => l());
    }
  } catch { /* ignore */ }
}

// Load saved purchases before the first render so a fast click can never
// overwrite them with the empty starting state (which would re-charge items).
if (typeof window !== "undefined") load();


export function useShop() {
  const s = useSyncExternalStore((cb) => { listeners.add(cb); return () => listeners.delete(cb); }, () => current, () => EMPTY);
  useEffect(load, []);
  return s;
}

export function equippedItems(state: ShopState) {
  return (Object.values(normalizeEquipment(state).equipped).filter(Boolean) as string[])
    .map((id) => SHOP_ITEMS.find((i) => i.id === id))
    .filter((i): i is ShopItem => !!i);
}

/** Categories that count as clothing for the "all maps complete" mystery reward. */
export const MYSTERY_CATEGORIES: ShopCategory[] = ["hat", "costume", "footwear", "accessory"];

/** Gives one random unowned clothing item for free and equips it; null when everything is owned. */
export function grantMystery(state: ShopState, rand: () => number = Math.random): { state: ShopState; item: ShopItem } | null {
  const pool = SHOP_ITEMS.filter((i) => MYSTERY_CATEGORIES.includes(i.category) && !state.owned.includes(i.id));
  if (!pool.length) return null;
  const item = pool[Math.min(pool.length - 1, Math.floor(rand() * pool.length))];
  if (!item) return null;
  return { item, state: equip({ ...state, owned: [...state.owned, item.id] }, item.category, item.id) };
}

/** Adds a free, unowned shop item once per full jigsaw collection, without changing clothing. */
export function grantJigsawReward(state: ShopState, game: GameState, rand: () => number = Math.random): { state: ShopState; item: ShopItem | null } | null {
  if (state.jigsawReward || !allJigsawsComplete(game)) return null;
  const gift = grantMystery(state, rand);
  return {
    item: gift?.item ?? null,
    state: { ...state, owned: gift?.state.owned ?? state.owned, jigsawReward: gift?.item.id ?? "all-owned" },
  };
}

/** Ownership and the claim marker are persisted together before notifying the player. */
export function claimJigsawReward(game: GameState) {
  load();
  const gift = grantJigsawReward(current, game);
  if (gift) saveShop(gift.state);
  return gift;
}
