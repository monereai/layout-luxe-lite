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
    const [profile, live, sandbox] = await Promise.all([
      client.from("profiles").select("monere_energy,monere_points,last_energy_claim_date,subscription_tier").eq("user_id", userId).maybeSingle(),
      client.rpc("is_premium", { check_env: "live" }),
      client.rpc("is_premium", { check_env: "sandbox" }),
    ]);
    if (profile.error || live.error || sandbox.error) throw new ToolError("Could not read your account status. Try again.");
    if (!profile.data) throw new ToolError("Your account profile is not available yet.");
    const premium = live.data === true || sandbox.data === true;
    const membership = premium ? profile.data.subscription_tier === "monere_club" ? "club" : "plus" : "free";
    const status = { energy: profile.data.monere_energy, savedAccountPoints: profile.data.monere_points, membership, lastDailyClaimDate: profile.data.last_energy_claim_date };
    return { content: [{ type: "text", text: `Energy: ${status.energy}%. Saved account points: ${status.savedAccountPoints} (not the device's spendable wallet). Membership: ${status.membership}. Last daily claim: ${status.lastDailyClaimDate ?? "none"}.` }], structuredContent: { status } };
  },
});
