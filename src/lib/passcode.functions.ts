import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const redeemPassCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ code: z.string().trim().min(3).max(40) }).parse(d))
  .handler(async ({ data, context }): Promise<{ ok: true; organization: string } | { ok: false }> => {
    const { data: rows, error } = await context.supabase.rpc("redeem_org_code", { p_code: data.code });
    const row = Array.isArray(rows) ? rows[0] : null;
    if (error || !row?.ok) return { ok: false };
    return { ok: true, organization: row.organization_name ?? "your group" };
  });
