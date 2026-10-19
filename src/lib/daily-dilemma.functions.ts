import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { careSchema } from '@/lib/care';
const dilemmaStateSchema = z.object({
  day: z.string(), scenario: z.number().int().min(0).max(3), completed: z.boolean().nullable().transform(value => value === true),
  accepted: z.boolean(), rewarded: z.boolean(), canReset: z.boolean().default(false), serverNow: z.number(), nextAt: z.number(), care: careSchema,
});
export type DilemmaState = z.infer<typeof dilemmaStateSchema>;
export const playDailyDilemma = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ action: z.enum(['status', 'choose', 'reset']), day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), choice: z.number().int().min(0).max(2).optional() }))
  .handler(async ({ data, context }) => {
    const result = await context.supabase.rpc('daily_dilemma_action', { p_action: data.action, ...(data.day ? { p_day: data.day } : {}), ...(data.choice === undefined ? {} : { p_choice: data.choice }) });
    if (result.error) throw new Error(result.error.message);
    return dilemmaStateSchema.parse(result.data);
  });