import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { parseAdventure } from "./treasure";
import { TREE_IDS } from "./orchard";
import { isTreasureTester, TREASURE_MAINTENANCE } from "./treasureGate";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

async function verifiedTester(client: SupabaseClient<Database>, userId: string) {
  const [{ data, error }, roles] = await Promise.all([
    client.auth.getUser(),
    client.from("user_roles").select("role").eq("user_id", userId).in("role", ["admin", "tester"]),
  ]);
  return !error && !roles.error && data.user?.id === userId && isTreasureTester(data.user.email, (roles.data ?? []).map(row => row.role));
}

export const getTreasureAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => ({ tester: await verifiedTester(context.supabase, context.userId) }));

export const adventureAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ action: z.enum(["status", "restart", "move", "collect", "answer", "portal", "duel", "pick", "talk", "deliver", "dig", "bell", "stay", "switch", "call", "travel"]), x: z.number().int().optional(), y: z.number().int().optional(), id: z.string().max(60).optional(), steps: z.array(z.object({ x: z.number().int(), y: z.number().int() })).max(32).optional() }))
  .handler(async ({ data, context }) => {
    if (TREASURE_MAINTENANCE && !await verifiedTester(context.supabase, context.userId)) {
      throw new Error("Monere's adventure is temporarily under construction.");
    }
    const result = data.action === "restart" ? await context.supabase.rpc("treasure_restart") : data.action === "travel"
      ? await context.supabase.rpc("treasure_v5_travel", { p_steps: data.steps ?? [] })
      : await context.supabase.rpc("treasure_v5_action", { p_action: data.action, ...(data.x !== undefined ? { p_x: data.x } : {}), ...(data.y !== undefined ? { p_y: data.y } : {}), ...(data.id ? { p_id: data.id } : {}) });
    if (result.error) throw new Error(result.error.message);
    const value = result.data as { state?: unknown; griffin?: boolean; points?: number } | null;
    return { state: parseAdventure(value?.state), griffin: value?.griffin === true, points: typeof value?.points === "number" ? value.points : 0 };
  });

export const orchardHarvest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ tree: z.enum(TREE_IDS) }))
  .handler(async ({ data, context }) => {
    if (TREASURE_MAINTENANCE && !await verifiedTester(context.supabase, context.userId)) {
      throw new Error("Monere's adventure is temporarily under construction.");
    }
    const result = await context.supabase.rpc("orchard_harvest", { p_tree: data.tree });
    if (result.error) throw new Error(result.error.message);
    return z.object({ energy: z.number().int(), gained: z.number().int(), harvested: z.boolean() }).parse(result.data);
  });
