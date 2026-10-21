import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { eligibleRegistration, registrationAlertKey, signupSource } from "./admin-alert-data";

// Only the confirmed caller's own identity is read; no arbitrary recipient or user ID.
export const notifyRegistration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ source: z.enum(["guest conversion", "direct"]) }).parse)
  .handler(async ({ data, context }) => {
    const { data: auth, error } = await context.supabase.auth.getUser();
    if (error || !auth.user || auth.user.id !== context.userId) throw new Error("Unauthorized");
    const user = auth.user;
    if (!eligibleRegistration(user)) return { skipped: true };
    const { data: profile, error: profileError } = await context.supabase.from("profiles").select("subscription_tier").eq("user_id", context.userId).maybeSingle();
    if (profileError) throw new Error("Could not read registration details");
    const { sendAccountAlert } = await import("./admin-alerts.server");
    await sendAccountAlert({
      event: "Registration", email: user.email ?? "Not provided",
      username: user.user_metadata?.["full_name"] ?? user.user_metadata?.["name"] ?? user.user_metadata?.["username"] ?? "Not provided",
      signupAt: user.created_at, eventAt: user.email_confirmed_at ?? user.created_at,
      source: signupSource(user.user_metadata?.["signup_source"] ?? data.source),
      tier: profile?.subscription_tier ?? "free",
    }, registrationAlertKey(user.id));
    return { skipped: false };
  });