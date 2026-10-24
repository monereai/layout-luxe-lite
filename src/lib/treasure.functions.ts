import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { parseAdventure } from "./treasure";
import { TREE_IDS } from "./orchard";
import { replayMaze, MAZE_TICK_MS } from "./harvest-maze";
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

export const spendMovementEnergy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ mode: z.enum(["sprint", "dash"]) }))
  .handler(async ({ data, context }) => {
    if (TREASURE_MAINTENANCE && !await verifiedTester(context.supabase, context.userId)) throw new Error("Monere's adventure is temporarily under construction.");
    const result = await context.supabase.rpc("treasure_movement_boost", { p_mode: data.mode });
    if (result.error) throw new Error(result.error.message);
    return z.object({ allowed: z.boolean(), energy: z.number().int().min(0).max(100) }).parse(result.data);
  });

export const startOrchardMaze = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ tree: z.enum(TREE_IDS) }))
  .handler(async ({ data, context }) => {
    if (TREASURE_MAINTENANCE && !await verifiedTester(context.supabase, context.userId)) throw new Error("Monere's adventure is temporarily under construction.");
    const result = await context.supabase.rpc("orchard_maze_start", { p_tree: data.tree });
    // SQL checks ownership, location and eligibility before the daily ledger.
    // A completed Crystal harvest still permits play, but never another payout.
    if (data.tree === "caverns-1" && result.error?.message === "This tree has been harvested today. Come back tomorrow!") return { id: "practice" };
    if (result.error) throw new Error(result.error.message);
    return z.object({ id: z.string().uuid() }).parse(result.data);
  });

export const settleOrchardMaze = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ round: z.string().uuid(), trace: z.array(z.enum(["up", "down", "left", "right", "idle"])).max(3000) }))
  .handler(async ({ data, context }) => {
    if (TREASURE_MAINTENANCE && !await verifiedTester(context.supabase, context.userId)) throw new Error("Monere's adventure is temporarily under construction.");
    const maze = replayMaze(data.trace);
    const { data: round, error } = await context.supabase.from("orchard_maze_rounds").select("started_at,settled_at").eq("id", data.round).eq("user_id", context.userId).single();
    if (error || !round) throw new Error("Harvest not found.");
    if (!round.settled_at && Date.now() - Date.parse(round.started_at) + 1000 < maze.tick * MAZE_TICK_MS) throw new Error("The harvest is moving too quickly.");
    const sync = await context.supabase.rpc("care_apply", { p_action: "sync" });
    if (sync.error) throw new Error(sync.error.message);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: ownedRound, error: ownedError } = await context.supabase.from("orchard_maze_rounds").select("tree").eq("id", data.round).eq("user_id", context.userId).single();
    if (ownedError || !ownedRound) throw new Error("Harvest not found.");
    const mainTree = ["meadow-1", "wood-1", "ravine-1", "lair-1"].includes(ownedRound.tree);
    const result = await supabaseAdmin.rpc("orchard_maze_settle", { p_user: context.userId, p_round: data.round, p_energy: maze.energy, p_ticks: maze.tick, p_expelled: maze.ended === "expelled" && mainTree });
    if (result.error) throw new Error(result.error.message);
    const value = z.object({ energy: z.number(), gained: z.number(), state: z.unknown() }).parse(result.data);
    return { ...value, state: parseAdventure(value.state) };
  });
