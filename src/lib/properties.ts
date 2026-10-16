import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Property = { id: string; name: string; cost: number; src: string | null };

export const PROPERTIES: Property[] = [
  { id: "treehouse", name: "Treehouse", cost: 0, src: null },
  { id: "beach-bungalow", name: "Beach Bungalow", cost: 300, src: "/properties/beach-bungalow.jpg" },
  { id: "cozy-bedroom", name: "Cozy Bedroom", cost: 400, src: "/properties/cozy-bedroom.jpg" },
  { id: "space-station", name: "Space Station", cost: 600, src: "/properties/space-station.jpg" },
];

export type PropertyState = { unlockedProperties: string[]; activeProperty: string; spent: number };
const KEY = "monere.properties.v1";
const DEFAULT: PropertyState = { unlockedProperties: ["treehouse"], activeProperty: "treehouse", spent: 0 };

function read(): PropertyState {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const p = JSON.parse(window.localStorage.getItem(KEY) || "null");
    if (p && Array.isArray(p.unlockedProperties)) {
      const unlocked = Array.from(new Set(["treehouse", ...p.unlockedProperties.filter((id: string) => PROPERTIES.some((x) => x.id === id))]));
      return { unlockedProperties: unlocked, activeProperty: unlocked.includes(p.activeProperty) ? p.activeProperty : "treehouse", spent: Number(p.spent) || 0 };
    }
  } catch { /* ignore */ }
  return DEFAULT;
}

let state: PropertyState = read();
const subs = new Set<(s: PropertyState) => void>();

async function sync(s: PropertyState) {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  await supabase.from("user_properties").upsert({
    user_id: data.user.id, unlocked_properties: s.unlockedProperties, active_property: s.activeProperty, updated_at: new Date().toISOString(),
  });
}

export function saveProperties(next: PropertyState, remote = true) {
  state = next;
  window.localStorage.setItem(KEY, JSON.stringify(next));
  subs.forEach((f) => f(next));
  if (remote) sync(next).catch(() => {});
}

/** Pure purchase rule: returns null when already owned or unaffordable. */
export function buyProperty(s: PropertyState, wallet: number, id: string): PropertyState | null {
  const p = PROPERTIES.find((x) => x.id === id);
  if (!p || s.unlockedProperties.includes(id) || wallet < p.cost) return null;
  return { unlockedProperties: [...s.unlockedProperties, id], activeProperty: id, spent: s.spent + p.cost };
}

export function equipProperty(s: PropertyState, id: string): PropertyState {
  return s.unlockedProperties.includes(id) ? { ...s, activeProperty: id } : s;
}

let pulled = false;
async function pull() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  const { data: row } = await supabase.from("user_properties").select("*").eq("user_id", data.user.id).maybeSingle();
  if (!row) { sync(state).catch(() => {}); return; }
  const unlocked = Array.from(new Set([...state.unlockedProperties, ...row.unlocked_properties]));
  saveProperties({ ...state, unlockedProperties: unlocked, activeProperty: unlocked.includes(row.active_property) ? row.active_property : state.activeProperty }, false);
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
