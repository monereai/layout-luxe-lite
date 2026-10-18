import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

/**
 * Route guard for signed-in-only screens (mini-games). Guests are sent to
 * /auth with a validated `next` path so they return here after signing in.
 */
export async function requireAuth(location: { href: string }) {
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    throw redirect({ to: "/auth", search: { next: location.href } });
  }
}
