import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const runQaAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ action: z.enum(["fill", "reset_claim", "topup", "club"]) }))
  .handler(async ({ data, context }) => {
    const result = await context.supabase.rpc("qa_action", { p_action: data.action });
    if (result.error) throw new Error(result.error.message);
    return { ok: true };
  });
