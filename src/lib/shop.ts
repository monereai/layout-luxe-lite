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

export const SHOP_KEY = "monereai-shop";
export type ShopCategory = "hat" | "glasses" | "costume";
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
  // Glasses
  { id: "sunglasses", name: "Sunglasses", category: "glasses", cost: 150, src: sunglasses },
  { id: "round-specs", name: "Scholar Specs", category: "glasses", cost: 250, src: roundSpecs },
  // Costumes
  { id: "hero-cape", name: "Superhero Cape", category: "costume", cost: 500, src: heroCape },
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
