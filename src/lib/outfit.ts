import { useEffect, useSyncExternalStore } from "react";

export const OUTFIT_KEY = "monereai-outfit";

export const TOPS = [
  { id: "navy", name: "Navy Classic Hoodie", detail: "A timeless mentor staple" },
  { id: "black", name: "Oversized Black Streetwear Hoodie", detail: "Relaxed and bold" },
  { id: "zip", name: "Amber Zip-Up Track Jacket", detail: "Sporty everyday energy" },
  { id: "denim", name: "Denim Jacket", detail: "Laid-back and dependable" },
  { id: "tee", name: "Vintage Savannah Graphic Tee", detail: "A nod to Crestwood Ridge" },
] as const;

export const HATS = [
  { id: "cap", name: "Forward Cap", detail: "This week: Courage starts with one honest step" },
  { id: "snap", name: "Backward Snapback", detail: "Easy-going streetwear" },
  { id: "beanie", name: "Knit Beanie", detail: "Warm and casual" },
  { id: "bucket", name: "Streetwear Bucket Hat", detail: "A confident finish" },
] as const;

export const SHOES = [
  { id: "hightop", name: "Retro High-Top Sneakers", detail: "Amber and white" },
  { id: "skate", name: "Fresh Skate Shoes", detail: "Built for everyday movement" },
  { id: "runner", name: "Athletic Runners", detail: "Light, active, ready" },
  { id: "canvas", name: "Classic Canvas Low-Tops", detail: "Simple and versatile" },
] as const;

export type TopId = (typeof TOPS)[number]["id"];
export type HatId = (typeof HATS)[number]["id"];
export type ShoeId = (typeof SHOES)[number]["id"];
export type OutfitSelection = { top: TopId; hat: HatId; shoe: ShoeId };

const DEFAULT_SELECTION: OutfitSelection = { top: "navy", hat: "cap", shoe: "hightop" };
// Plain static URLs (public/wardrobe) — not module imports, so one slow or failed
// picture can never block the app from loading.
function imageFor(selection: OutfitSelection) {
  return `/wardrobe/${selection.top}-${selection.hat}-${selection.shoe}.webp`;
}

function isTop(value: unknown): value is TopId {
  return TOPS.some((item) => item.id === value);
}
function isHat(value: unknown): value is HatId {
  return HATS.some((item) => item.id === value);
}
function isShoe(value: unknown): value is ShoeId {
  return SHOES.some((item) => item.id === value);
}

function parseSaved(raw: string | null): OutfitSelection {
  if (!raw) return DEFAULT_SELECTION;
  const legacy: Record<string, OutfitSelection> = {
    default: DEFAULT_SELECTION,
    streetwear: { top: "black", hat: "snap", shoe: "skate" },
    denim: { top: "denim", hat: "beanie", shoe: "canvas" },
    tracksuit: { top: "zip", hat: "cap", shoe: "runner" },
  };
  if (legacy[raw]) return legacy[raw];
  try {
    const parsed = JSON.parse(raw) as Partial<OutfitSelection>;
    if (isTop(parsed.top) && isHat(parsed.hat) && isShoe(parsed.shoe)) return parsed as OutfitSelection;
  } catch {
    // Ignore invalid or older values.
  }
  return DEFAULT_SELECTION;
}

let current = DEFAULT_SELECTION;
let loaded = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

export function setOutfit(next: OutfitSelection) {
  current = next;
  try {
    window.localStorage.setItem(OUTFIT_KEY, JSON.stringify(next));
  } catch {
    // Continue with the in-session selection when storage is unavailable.
  }
  emit();
}

function loadOnce() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const saved = parseSaved(window.localStorage.getItem(OUTFIT_KEY));
    if (JSON.stringify(saved) !== JSON.stringify(current)) {
      current = saved;
      emit();
    }
  } catch {
    // Keep defaults when storage is unavailable.
  }
}

export function getOutfit(selection: OutfitSelection) {
  const isDefault = selection.top === "navy" && selection.hat === "cap" && selection.shoe === "hightop";
  return {
    ...selection,
    id: isDefault ? "default" : `${selection.top}-${selection.hat}-${selection.shoe}`,
    name: `${TOPS.find((item) => item.id === selection.top)?.name ?? "Outfit"}, ${HATS.find((item) => item.id === selection.hat)?.name ?? "Headwear"}`,
    src: imageFor(selection),
  };
}

export function useOutfit() {
  const selection = useSyncExternalStore(
    (callback) => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    () => current,
    () => DEFAULT_SELECTION,
  );
  useEffect(() => loadOnce(), []);
  return { outfit: getOutfit(selection), selection, setOutfit };
}
