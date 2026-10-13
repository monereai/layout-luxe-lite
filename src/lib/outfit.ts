import monereDefault from "@/assets/monere-lion.png";
import monereStreet from "@/assets/monere-streetwear.png";
import monereDenim from "@/assets/monere-denim.png";
import monereTrack from "@/assets/monere-tracksuit.png";
import { useEffect, useSyncExternalStore } from "react";

export const OUTFIT_KEY = "monereai-outfit";

export const OUTFITS = [
  { id: "default", name: "Default Mentor", detail: "Navy Hoodie + Amber Tee + Blue Cap", src: monereDefault },
  { id: "streetwear", name: "Streetwear Lion", detail: "Oversized Black Hoodie + Red Cap", src: monereStreet },
  { id: "denim", name: "Denim & Casual", detail: "Denim Jacket + Beanie", src: monereDenim },
  { id: "tracksuit", name: "Tracksuit Vibe", detail: "Amber Athletic Zip-Up + Forward Cap", src: monereTrack },
] as const;

export type OutfitId = (typeof OUTFITS)[number]["id"];

let current: OutfitId = "default";
let loaded = false;
const listeners = new Set<() => void>();

function emit() { listeners.forEach((l) => l()); }

export function setOutfit(id: OutfitId) {
  current = id;
  try { window.localStorage.setItem(OUTFIT_KEY, id); } catch { /* ignore */ }
  emit();
}

function loadOnce() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const saved = window.localStorage.getItem(OUTFIT_KEY);
    if (saved && OUTFITS.some((o) => o.id === saved) && saved !== current) { current = saved as OutfitId; emit(); }
  } catch { /* ignore */ }
}

export function useOutfit() {
  const id = useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => { listeners.delete(cb); }; },
    () => current,
    () => "default" as OutfitId,
  );
  useEffect(() => { loadOnce(); }, []);
  const outfit = OUTFITS.find((o) => o.id === id) ?? OUTFITS[0];
  return { outfit, setOutfit };
}
