import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { careSchema } from "@/lib/care";

export const updateCare = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ action: z.enum(["sync", "claim", "snack"]) }))
  .handler(async ({ data, context }) => {
    const result = await context.supabase.rpc("care_apply", { p_action: data.action });
    if (result.error) throw new Error(result.error.message);
    return careSchema.parse(result.data);
  });
export const startCareRound = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ kind: z.enum(["find", "jigsaw"]), size: z.union([z.literal(3), z.literal(4), z.literal(5), z.literal(6), z.literal(7)]) }))
  .handler(async ({ data, context }) => {
    const result = await context.supabase.rpc("care_start_round", { p_kind: data.kind, p_size: data.size });
    if (result.error) throw new Error(result.error.message);
    return z.object({ id: z.string().uuid(), order: z.array(z.number().int()) }).parse(result.data);
  });
export const finishCareRound = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ round: z.string().uuid(), proof: z.union([z.array(z.number().int()), z.array(z.tuple([z.number().int(), z.number().int()]))]) }))
  .handler(async ({ data, context }) => {
    const result = await context.supabase.rpc("care_finish_round", { p_round: data.round, p_proof: data.proof });
    if (result.error) throw new Error(result.error.message);
    return careSchema.parse(result.data);
  });
export const rewardCareFind = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ round: z.string().uuid(), spot: z.number().int().min(0).max(48), proof: z.array(z.tuple([z.number().int(), z.number().int()])).max(10000).default([]) }))
  .handler(async ({ data, context }) => {
    const result = await context.supabase.rpc("care_reward_piece", { p_round: data.round, p_spot: data.spot, p_proof: data.proof });
    if (result.error) throw new Error(result.error.message);
    return careSchema.parse(result.data);
  });