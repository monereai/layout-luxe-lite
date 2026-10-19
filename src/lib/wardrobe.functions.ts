import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json } from "@/integrations/supabase/types";

const slot = z.string().max(60).nullable().optional();

/** Clothing purchases, gifts and equips are priced and checked by the database, never by the browser. */
export const wardrobeAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({
    action: z.enum(["status", "buy", "buy_combo", "equip", "gift_mystery", "gift_jigsaw", "reset"]),
    id: z.string().max(60).optional(),
    equipped: z.object({ hat: slot, outfit: slot, glasses: slot, accessory: slot, footwear: slot }).optional(),
  }))
  .handler(async ({ data, context }) => {
    const result = await context.supabase.rpc("wardrobe_action", {
      p_action: data.action,
      ...(data.id ? { p_id: data.id } : {}),
      ...(data.equipped ? { p_equipped: data.equipped as unknown as Json } : {}),
    });
    if (result.error) throw new Error(result.error.message === "Not enough points" ? "You don't have enough points for that yet." : result.error.message);
    const s = (result.data ?? {}) as Record<string, unknown>;
    return {
      spent: typeof s["spent"] === "number" ? s["spent"] : 0,
      owned: Array.isArray(s["owned"]) ? (s["owned"] as string[]) : [],
      equipped: (s["equipped"] && typeof s["equipped"] === "object" ? s["equipped"] : {}) as Record<string, string>,
      ...(typeof s["jigsawReward"] === "string" ? { jigsawReward: s["jigsawReward"] } : {}),
      ...(typeof s["mysteryGift"] === "string" ? { mysteryGift: s["mysteryGift"] } : {}),
    };
  });
