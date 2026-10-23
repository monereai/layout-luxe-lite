import { supabase as managedClient } from "../integrations/supabase/client";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { validCloudConfig } from "./cloud-config";

/** Non-persistent, signed-out client: requests never leave the application. */
export function createOfflineClient() {
  return createClient<Database>("https://offline.invalid", "sb_publishable_local_offline_unavailable", {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: async () => new Response(JSON.stringify({ message: "Account services are unavailable until Cloud is configured.", code: "CLOUD_UNAVAILABLE" }), { status: 503, headers: { "Content-Type": "application/json" } }) },
  });
}

let offline: ReturnType<typeof createOfflineClient> | undefined;
export const supabase = new Proxy({} as typeof managedClient, {
  get(_, prop) {
    const configured = validCloudConfig(import.meta.env["VITE_SUPABASE_URL"], import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"]);
    const client = configured ? managedClient : (offline ??= createOfflineClient());
    const value = Reflect.get(client, prop);
    return typeof value === "function" ? value.bind(client) : value;
  },
});