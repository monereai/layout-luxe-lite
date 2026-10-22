import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { parseAdventure } from "./treasure";

export const adventureAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ action: z.enum(["status", "move", "collect", "answer", "portal", "duel", "pick", "talk", "deliver", "dig", "bell", "stay", "switch", "call", "travel"]), x: z.number().int().optional(), y: z.number().int().optional(), id: z.string().max(60).optional(), steps: z.array(z.object({ x: z.number().int(), y: z.number().int() })).max(32).optional() }))
  .handler(async ({ data, context }) => {
    const result = data.action === "travel"
      ? await context.supabase.rpc("treasure_v5_travel", { p_steps: data.steps ?? [] })
      : await context.supabase.rpc("treasure_v5_action", { p_action: data.action, ...(data.x !== undefined ? { p_x: data.x } : {}), ...(data.y !== undefined ? { p_y: data.y } : {}), ...(data.id ? { p_id: data.id } : {}) });
    if (result.error) throw new Error(result.error.message);
    const value = result.data as { state?: unknown; griffin?: boolean; points?: number } | null;
    return { state: parseAdventure(value?.state), griffin: value?.griffin === true, points: typeof value?.points === "number" ? value.points : 0 };
  });
