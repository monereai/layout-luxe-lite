import { auth, defineMcp } from "@lovable.dev/mcp-js";
import readAccountStatus from "./tools/read-account-status";
import readMemberships from "./tools/read-memberships";
const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";
export default defineMcp({
  name: "monereai", title: "MONEREAI", version: "0.1.0",
  instructions: "Read your MonereAI account status and current membership prices. Account reads act as the consenting user. Device-local journals, clothing purchases, and spendable balances are not available remotely. Tools cannot purchase, claim rewards, change tiers, or grant points.",
  auth: auth.oauth.issuer({ issuer: `https://${projectRef}.supabase.co/auth/v1`, acceptedAudiences: "authenticated" }),
  tools: [readAccountStatus, readMemberships],
});
