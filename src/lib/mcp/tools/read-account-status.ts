import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";
export default defineTool({
  name: "read_account_status", title: "Read Monere account status",
  description: "Read your saved energy, account points, and effective membership; device-local purchases and journal entries are not included.",
  inputSchema: {}, annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    const userId = ctx.getUserId();
    if (!userId) throw new ToolError("Sign in first.");
    const client = supabaseForUser(ctx);
    const [profile, tier] = await Promise.all([
      client.from("profiles").select("monere_energy,monere_points,last_energy_claim_date").eq("user_id", userId).maybeSingle(),
      client.rpc("account_tier", { p_user: userId }),
    ]);
    if (profile.error || tier.error) throw new ToolError("Could not read your account status. Try again.");
    if (!profile.data) throw new ToolError("Your account profile is not available yet.");
    const status = { energy: profile.data.monere_energy, savedAccountPoints: profile.data.monere_points, membership: tier.data, lastDailyClaimDate: profile.data.last_energy_claim_date };
    return { content: [{ type: "text", text: `Energy: ${status.energy}%. Saved account points: ${status.savedAccountPoints} (not the device's spendable wallet). Membership: ${status.membership}. Last daily claim: ${status.lastDailyClaimDate ?? "none"}.` }], structuredContent: { status } };
  },
});
