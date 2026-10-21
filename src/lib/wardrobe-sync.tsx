import { useEffect } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { usePlan } from "@/hooks/usePlan";
import { saveShop, setShopAccountAction, type ShopState, type WardrobeRequest } from "@/lib/shop";
import { wardrobeAction } from "@/lib/wardrobe.functions";

const EMPTY: ShopState = { spent: 0, owned: [], equipped: {} };

/** Loads the account wardrobe; every change goes through server-checked wardrobe actions. */
export function WardrobeSync() {
  const { user, ready } = usePlan();
  const userId = user?.id;
  const run = useServerFn(wardrobeAction);
  useEffect(() => {
    setShopAccountAction(undefined);
    if (!ready) return;
    if (!userId) {
      if (localStorage.getItem("monereai-wardrobe-owner")) { localStorage.removeItem("monereai-wardrobe-owner"); saveShop(EMPTY); }
      return;
    }
    let cancelled = false;
    let queue: Promise<unknown> = Promise.resolve();
    const action = (request: WardrobeRequest) => {
      const next = queue.catch(() => {}).then(async () => {
        if (cancelled) throw new Error("Account changed");
        const { equipped, ...rest } = request;
        const state = await run({ data: { ...rest, ...(equipped ? { equipped } : {}) } });
        if (cancelled) throw new Error("Account changed");
        return state as ShopState;
      });
      queue = next;
      return next;
    };
    const owner = localStorage.getItem("monereai-wardrobe-owner");
    if (owner && owner !== userId) saveShop(EMPTY);
    void action({ action: "status" }).then((state) => {
      if (cancelled) return;
      localStorage.setItem("monereai-wardrobe-owner", userId);
      saveShop(state);
      setShopAccountAction(action);
    }).catch(() => { if (!cancelled) { setShopAccountAction(undefined); toast.error("Your wardrobe could not load. Please refresh before changing outfits."); } });
    // Clicks during the initial read wait behind status instead of failing while the wardrobe loads.
    setShopAccountAction(action);
    return () => { cancelled = true; setShopAccountAction(undefined); };
  }, [userId, ready, run]);
  return null;
}
