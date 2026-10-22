import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { parseAdventure } from "./treasure";
import type { ShopState } from "./shop";

export const adventureAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ action: z.enum(["status", "move", "collect", "portal", "gear", "travel", "inspect", "pet", "match"]), x: z.number().int().optional(), y: z.number().int().optional(), id: z.string().max(60).optional(), gear: z.array(z.enum(["magnifying-glass", "lantern"])).max(2).optional(), steps: z.array(z.object({ x: z.number().int(), y: z.number().int() })).max(32).optional() }))
  .handler(async ({ data, context }) => {
    const result = data.action === "travel"
      ? await context.supabase.rpc("treasure_v2_travel", { p_steps: data.steps ?? [] })
      : await context.supabase.rpc("treasure_v2_action", { p_action: data.action, ...(data.x !== undefined ? { p_x: data.x } : {}), ...(data.y !== undefined ? { p_y: data.y } : {}), ...(data.id ? { p_id: data.id } : {}), ...(data.gear ? { p_gear: data.gear } : {}) });
    if (result.error) throw new Error(result.error.message);
    const value = result.data as { state?: unknown; wardrobe?: unknown } | null;
    return { state: parseAdventure(value?.state), wardrobe: value?.wardrobe as ShopState | null };
  });