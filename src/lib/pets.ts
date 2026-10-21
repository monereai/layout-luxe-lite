import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePlan } from "@/hooks/usePlan";
import puppy from "@/assets/pets/puppy.png";
import kitten from "@/assets/pets/kitten.png";
import goldfish from "@/assets/pets/goldfish.png";
import bunny from "@/assets/pets/bunny.png";
import parrot from "@/assets/pets/parrot.png";
import babyDragon from "@/assets/pets/baby-dragon.png";
import hedgehog from "@/assets/pets/hedgehog.png";
import turtle from "@/assets/pets/turtle.png";
import fox from "@/assets/pets/fox.png";
import owl from "@/assets/pets/owl.png";
import unicorn from "@/assets/pets/unicorn.png";
import thunderbird from "@/assets/pets/thunderbird.png";
import phoenix from "@/assets/pets/phoenix.png";

export type Pet = { id: string; name: string; description: string; cost: number; src: string };

/** Prices must match the pet_action database function, which is the real charge. */
export const PETS: Pet[] = [
  { id: "goldfish", name: "Goldfish", description: "A calm little swimmer for quiet moments.", cost: 300, src: goldfish },
  { id: "puppy", name: "Puppy", description: "Loyal, playful and always happy to see you.", cost: 300, src: puppy },
  { id: "kitten", name: "Kitten", description: "Curious, cuddly and full of mischief.", cost: 300, src: kitten },
  { id: "bunny", name: "Bunny", description: "Soft ears, gentle heart, quick feet.", cost: 800, src: bunny },
  { id: "parrot", name: "Parrot", description: "A chatty friend with brilliant feathers.", cost: 800, src: parrot },
  { id: "hedgehog", name: "Hedgehog", description: "Prickly on the outside, sweet on the inside.", cost: 300, src: hedgehog },
  { id: "turtle", name: "Turtle", description: "Slow, steady and always by your side.", cost: 300, src: turtle },
  { id: "fox", name: "Fox", description: "Clever, cosy and wonderfully curious.", cost: 800, src: fox },
  { id: "owl", name: "Owl", description: "A wise little watcher for late-night talks.", cost: 800, src: owl },
  { id: "baby-dragon", name: "Baby Dragon", description: "Small, brave and a little bit legendary.", cost: 2000, src: babyDragon },
  { id: "unicorn", name: "Unicorn", description: "A magical friend with a rainbow mane.", cost: 2000, src: unicorn },
  { id: "thunderbird", name: "Thunderbird", description: "A brave little storm with a heart of gold.", cost: 2000, src: thunderbird },
  { id: "phoenix", name: "Phoenix", description: "Warm wings that rise again with you.", cost: 2000, src: phoenix },
];

export type PetRarity = "Common" | "Rare" | "Legendary";
export const PET_RARITIES: Record<string, PetRarity> = {
  goldfish: "Common", puppy: "Common", kitten: "Common", hedgehog: "Common", turtle: "Common",
  bunny: "Rare", parrot: "Rare", fox: "Rare", owl: "Rare",
  "baby-dragon": "Legendary", unicorn: "Legendary", thunderbird: "Legendary", phoenix: "Legendary",
};

export type PetState = { owned: string[]; active: string | null };
const EMPTY: PetState = { owned: [], active: null };
let state: PetState = EMPTY;
let owner: string | null = null;
let revision = 0;
const subs = new Set<(s: PetState) => void>();
function set(next: PetState) { state = next; subs.forEach((f) => f(next)); }

/** Pure rule used by the UI before calling the server. */
export function petButtonState(s: PetState, wallet: number, pet: Pet): "equipped" | "owned" | "buy" | "unaffordable" {
  if (s.active === pet.id) return "equipped";
  if (s.owned.includes(pet.id)) return "owned";
  return wallet >= pet.cost ? "buy" : "unaffordable";
}

export async function loadPets() {
  const currentRevision = ++revision;
  const { data } = await supabase.auth.getUser();
  if (currentRevision !== revision) return;
  if (!data.user) { owner = null; set(EMPTY); return; }
  if (owner !== data.user.id) { owner = data.user.id; set(EMPTY); }
  const [{ data: row, error: inventoryError }, { data: prof, error: profileError }] = await Promise.all([
    supabase.from("user_pets").select("owned_pets").eq("user_id", data.user.id).maybeSingle(),
    supabase.from("profiles").select("equipped_pet_id").eq("user_id", data.user.id).maybeSingle(),
  ]);
  if (currentRevision !== revision) return;
  if (inventoryError || profileError) throw new Error("Could not load your companion.");
  set({ owned: row?.owned_pets ?? [], active: prof?.equipped_pet_id ?? null });
}

/** Purchases and equips are checked and charged by the server against the shared points balance. */
export async function petAction(action: "buy" | "equip" | "unequip", id: string): Promise<PetState> {
  const currentRevision = ++revision;
  const { data, error } = await supabase.rpc("pet_action", { p_action: action, p_id: id });
  if (error) throw new Error(error.message);
  const r = data as { owned: string[]; active: string | null };
  const next = { owned: r.owned ?? [], active: r.active ?? null };
  if (currentRevision === revision) set(next);
  return next;
}

export function usePets() {
  const { user, ready } = usePlan();
  const userId = user?.id ?? null;
  const [s, setS] = useState<PetState>(state);
  useEffect(() => {
    setS(state);
    subs.add(setS);
    if (ready) {
      if (!userId) { ++revision; owner = null; set(EMPTY); }
      else void loadPets().catch(() => {});
    }
    return () => { subs.delete(setS); };
  }, [userId, ready]);
  return userId && owner === userId ? s : EMPTY;
}
