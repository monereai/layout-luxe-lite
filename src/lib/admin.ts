import type { User } from "@supabase/supabase-js";

/** Sandbox admin account. Display-only on the client; the server re-checks the verified sign-in email. */
export const SANDBOX_ADMIN_EMAIL = "carlhillyard@icloud.com";
export const SANDBOX_POINTS = 99999;

export function isSandboxAdmin(user: Pick<User, "email"> | null | undefined) {
  return (user?.email ?? "").toLowerCase() === SANDBOX_ADMIN_EMAIL;
}
