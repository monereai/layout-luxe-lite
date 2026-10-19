import { useEffect } from "react";
import { toast } from "sonner";
import { usePlan } from "@/hooks/usePlan";
import { supabase } from "@/integrations/supabase/client";
import { normalizeEquipment, saveShop, setShopAccountSaver, shopSnapshot, type ShopState } from "@/lib/shop";
import type { Json } from "@/integrations/supabase/types";

export function WardrobeSync() {
  const { user, ready } = usePlan();
  const userId = user?.id;
  useEffect(() => {
    setShopAccountSaver(undefined);
    if (!ready) return;
    if (!userId) {
      if (localStorage.getItem("monereai-wardrobe-owner")) saveShop({ spent: 0, owned: [], equipped: {} }, true);
      return;
    }
    let cancelled = false;
    let queue = Promise.resolve();
    const load = async () => {
      const owner = localStorage.getItem("monereai-wardrobe-owner");
      const local = !owner || owner === userId ? shopSnapshot() : { spent: 0, owned: [], equipped: {} };
      if (owner && owner !== userId) saveShop({ spent: 0, owned: [], equipped: {} }, true);
      const { data, error } = await supabase.from("user_wardrobes").select("shop_state").eq("user_id", userId).maybeSingle();
      if (cancelled) return;
      if (error) throw error;
      const saved = data?.shop_state as ShopState | undefined;
      const next = saved && Array.isArray(saved.owned) && saved.equipped ? normalizeEquipment(saved) : local;
      const saver = (state: ShopState) => {
        const write = queue.catch(() => {}).then(async () => {
          if (cancelled) throw new Error("Account changed");
          const { error } = await supabase.from("user_wardrobes").upsert({ user_id: userId, shop_state: state as unknown as Json, updated_at: new Date().toISOString() });
          if (error || cancelled) throw new Error("Your outfit could not be saved. Please try again.");
        });
        queue = write;
        return write;
      };
      // Migrate device purchases only for the first account save, without changing any currency or pets.
      if (!saved) await saver(next);
      if (cancelled) return;
      localStorage.setItem("monereai-wardrobe-owner", userId);
      saveShop(next, true);
      setShopAccountSaver(saver);
    };
    void load().catch(() => { if (!cancelled) toast.error("Your wardrobe could not load. Please refresh before changing outfits."); });
    return () => { cancelled = true; setShopAccountSaver(undefined); };
  }, [userId, ready]);
  return null;
}