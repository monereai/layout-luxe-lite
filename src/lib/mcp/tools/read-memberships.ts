import { defineTool } from "@lovable.dev/mcp-js";
import { MEMBERSHIPS, POINT_PACKS } from "@/lib/store-config";
export default defineTool({
  name: "read_memberships", title: "Read membership and point pack prices",
  description: "Read MonereAI's current membership prices, monthly allowances, and point packs without purchasing anything.",
  inputSchema: {}, annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => ({ content: [{ type: "text", text: [
    ...MEMBERSHIPS.map(m => `${m.name}: £${m.monthly}/month or £${m.yearly}/year; ${m.points} points and ${m.tokens} tokens monthly.`),
    ...POINT_PACKS.map(p => `${p.name}: ${p.points} points for £${p.price}.`),
    "Upgrades require confirmation and verified Stripe payment. This tool cannot purchase or grant membership.",
  ].join("\n") }] }),
});
