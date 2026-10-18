import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { name: "robots", content: "noindex" },
      { title: "Reset password — MonereAI" },
      { name: "description", content: "Choose a new password for your MonereAI account." },
      { property: "og:title", content: "Reset password — MonereAI" },
      { property: "og:description", content: "Choose a new password for your MonereAI account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState<"checking" | "ok" | "expired">("checking");

  useEffect(() => {
    let done = false;
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN")) { done = true; setReady("ok"); }
    });
    void supabase.auth.getSession().then(({ data }) => { if (data.session) { done = true; setReady("ok"); } });
    const t = setTimeout(() => { if (!done) setReady("expired"); }, 2500);
    return () => { clearTimeout(t); sub.subscription.unsubscribe(); };
  }, []);

  // Recovery links arrive as /reset-password#access_token=...&type=recovery —
  // the Supabase client picks the session up from the URL automatically.

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (ready !== "ok") return;
    setBusy(true);
    // Recovery sessions are exempt from the current-password requirement.
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated — you're signed in.");
    void navigate({ to: "/", replace: true });
  }

  return (
    <AppShell>
      <h1 className="font-display text-2xl font-semibold">Choose a new password</h1>
      <p className="mt-2 text-sm text-muted-foreground">Pick something you'll remember.</p>
      {ready === "expired" && (
        <div className="mt-4 rounded-xl border border-border bg-background/60 p-4 text-sm">
          This reset link has expired or was already used.{" "}
          <Link to="/auth" className="font-semibold text-primary">Request a new one</Link>
        </div>
      )}
      <form onSubmit={submit} className="mt-6 grid gap-3">
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New password (6+ characters)"
          aria-label="New password"
          autoComplete="new-password"
          className="rounded-xl border border-border bg-background/60 px-4 py-3 outline-none focus:border-primary"
        />
        <Button type="submit" disabled={busy || ready !== "ok"} className="btn-gold mt-2 h-auto py-3.5">
          {busy ? "Please wait…" : "Save new password"}
        </Button>
      </form>
      <p className="mt-4 text-xs text-muted-foreground">Tip: the link in your email is single-use. If it has expired, request a new one from the sign-in screen.</p>
    </AppShell>
  );
}
