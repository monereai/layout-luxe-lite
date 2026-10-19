import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { careSchema } from '@/lib/care';
const snapStateSchema = z.object({
  id: z.string().uuid(), turn: z.number().int(), left: z.number().int().min(0).max(11), right: z.number().int().min(0).max(11),
  playerScore: z.number().int().min(0).max(3), monereScore: z.number().int().min(0).max(3), snapped: z.boolean(), completed: z.boolean(),
  rewardAvailable: z.boolean(), rewarded: z.boolean(), care: careSchema.nullable(),
});
export type SnapState = z.infer<typeof snapStateSchema>;
export const playBiblicalSnap = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ action: z.enum(['start', 'next', 'snap']), round: z.string().uuid().optional(), turn: z.number().int().nonnegative().optional() }))
  .handler(async ({ data, context }) => {
    const result = await context.supabase.rpc('biblical_snap_action', { p_action: data.action, p_round: data.round, p_turn: data.turn });
    if (result.error) throw new Error(result.error.message);
    return snapStateSchema.parse(result.data);
  });
