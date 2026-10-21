import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import lionsDen from "@/assets/habitats/lions-den.jpg";

export type Property = { id: string; name: string; cost: number; src: string | null };

export const PROPERTIES: Property[] = [
  { id: "treehouse", name: "Treehouse", cost: 0, src: null },
  { id: "beach-bungalow", name: "Beach Bungalow", cost: 540, src: "/properties/beach-bungalow.jpg" },
  { id: "cozy-bedroom", name: "Cozy Bedroom", cost: 720, src: "/properties/cozy-bedroom.jpg" },
  { id: "lions-den", name: "Lion’s Den", cost: 3000, src: lionsDen },
  { id: "space-station", name: "Space Station", cost: 0, src: "/properties/space-station.jpg" },
];

/** Display name of a habitat — always a real one so welcome copy can never name a missing place. */
export function propertyName(id: string): string {
  return PROPERTIES.find((p) => p.id === id)?.name ?? "Treehouse";
}

export function canEnterProperty(id: string, tier: string): boolean {
  return id !== "space-station" || tier === "club";
}

export type PropertyState = { unlockedProperties: string[]; activeProperty: string; spent: number };
const KEY = "monere.properties.v1";
const DEFAULT: PropertyState = { unlockedProperties: ["treehouse"], activeProperty: "treehouse", spent: 0 };

function read(): PropertyState {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const p = JSON.parse(window.localStorage.getItem(KEY) || "null");
    if (p && Array.isArray(p.unlockedProperties)) {
      const unlocked = Array.from(new Set(["treehouse", ...p.unlockedProperties.filter((id: string) => PROPERTIES.some((x) => x.id === id))]));
      return { unlockedProperties: unlocked, activeProperty: unlocked.includes(p.activeProperty) || p.activeProperty === "space-station" ? p.activeProperty : "treehouse", spent: Number(p.spent) || 0 };
    }
  } catch { /* ignore */ }
  return DEFAULT;
}

let state: PropertyState = read();
const subs = new Set<(s: PropertyState) => void>();

/** Signed-in unlocks and equips are checked and charged by the server; returns false when refused. */
export async function propertyAction(action: "buy" | "equip", id: string): Promise<{ ok: boolean; error?: string; serverSide: boolean }> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return id === "space-station" ? { ok: false, error: "Monere Club required for Space Station", serverSide: false } : { ok: true, serverSide: false };
  const { data: res, error } = await supabase.rpc("property_action", { p_action: action, p_id: id });
  if (error) return { ok: false, error: error.message, serverSide: true };
  const r = res as { unlocked: string[]; active: string };
  saveProperties({ ...state, unlockedProperties: Array.from(new Set(["treehouse", ...r.unlocked])), activeProperty: r.active }, false);
  return { ok: true, serverSide: true };
}

export function saveProperties(next: PropertyState, _remote = true) {
  state = next;
  window.localStorage.setItem(KEY, JSON.stringify(next));
  subs.forEach((f) => f(next));
}

/** Pure purchase rule: returns null when already owned or unaffordable. */
export function buyProperty(s: PropertyState, wallet: number, id: string): PropertyState | null {
  const p = PROPERTIES.find((x) => x.id === id);
  if (!p || id === "space-station" || s.unlockedProperties.includes(id) || wallet < p.cost) return null;
  return { unlockedProperties: [...s.unlockedProperties, id], activeProperty: id, spent: s.spent + p.cost };
}

export function equipProperty(s: PropertyState, id: string, tier = "free"): PropertyState {
  return canEnterProperty(id, tier) && (s.unlockedProperties.includes(id) || (id === "space-station" && tier === "club")) ? { ...s, activeProperty: id } : s;
}

let pulled = false;
async function pull() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  const { data: row } = await supabase.from("user_properties").select("*").eq("user_id", data.user.id).maybeSingle();
  if (!row) return;
  // The account's saved unlocks are the source of truth when signed in.
  const unlocked = Array.from(new Set(["treehouse", ...row.unlocked_properties]));
  saveProperties({ ...state, unlockedProperties: unlocked, activeProperty: unlocked.includes(row.active_property) || row.active_property === "space-station" ? row.active_property : "treehouse" }, false);
}

export function useProperties() {
  const [s, setS] = useState<PropertyState>(DEFAULT);
  useEffect(() => {
    setS(state);
    subs.add(setS);
    if (!pulled) { pulled = true; pull().catch(() => {}); }
    return () => { subs.delete(setS); };
  }, []);
  return s;
}
