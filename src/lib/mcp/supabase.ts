import { createClient } from "@supabase/supabase-js";
import type { ToolContext } from "@lovable.dev/mcp-js";
import type { Database } from "@/integrations/supabase/types";
function configuredEnv(names: string[]) {
  for (const name of names) { const value = process.env[name]?.trim(); if (value) return value; }
  return undefined;
}
function projectUrl() {
  const url = configuredEnv(["SUPABASE_URL", "VITE_SUPABASE_URL"]);
  if (!url) throw new Error("Account service is not configured.");
  return url;
}
function publishableKey() {
  const direct = configuredEnv(["SUPABASE_PUBLISHABLE_KEY", "VITE_SUPABASE_PUBLISHABLE_KEY"]);
  if (direct) return direct;
  const dictionary = process.env["SUPABASE_PUBLISHABLE_KEYS"];
  if (dictionary) {
    try {
      const parsed: unknown = JSON.parse(dictionary);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const keys = parsed as Record<string, unknown>;
        const key = [keys["default"], ...Object.values(keys)].find((v): v is string => typeof v === "string" && v.trim().startsWith("sb_publishable_"));
        if (key) return key.trim();
      }
    } catch { /* Keep legacy fallback available. */ }
  }
  const legacy = configuredEnv(["SUPABASE_ANON_KEY", "VITE_SUPABASE_ANON_KEY"]);
  if (!legacy) throw new Error("Account service is not configured.");
  return legacy;
}
export function supabaseForUser(ctx: ToolContext) {
  const token = ctx.getToken();
  if (!ctx.isAuthenticated() || !token || !ctx.getUserId()) throw new Error("Sign in and approve this connection first.");
  const key = publishableKey();
  return createClient<Database>(projectUrl(), key, {
    global: { headers: { Authorization: `Bearer ${token}` }, fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (headers.get("Authorization") === `Bearer ${key}` && key.startsWith("sb_")) headers.delete("Authorization");
      headers.set("apikey", key);
      return fetch(input, { ...init, headers });
    } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
