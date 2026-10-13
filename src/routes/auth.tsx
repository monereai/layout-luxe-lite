import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { usePlan } from "@/hooks/usePlan";

function safeNext(n: unknown) {
  return typeof n === "string" && n.startsWith("/") && !n.startsWith("//") ? n : "/";
}

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { next?: string } => ({ next: typeof s["next"] === "string" ? (s["next"] as string) : undefined }),
  head: () => ({
    meta: [
      { title: "Sign in — MonereAI" },
      { name: "description", content: "Sign in to MonereAI to unlock Monere Plus and keep your access across devices." },
      { property: "og:title", content: "Sign in — MonereAI" },
      { property: "og:description", content: "Sign in to MonereAI to unlock Monere Plus and keep your access across devices." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { next } = Route.useSearch();
  const navigate = useNavigate();
  const { user, ready } = usePlan();
  const [mode, setMode] = useState<"in" | "up">("up");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const target = safeNext(next);

  useEffect(() => { if (ready && user) void navigate({ to: target as "/" , replace: true }); }, [ready, user, target, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    if (mode === "up") {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}${target}` } });
      setBusy(false);
      if (error) { toast.error(error.message); return; }
      if (!data.session) setSent(true);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) toast.error(error.message);
    }
  }

  return (
    <AppShell>
      <h1 className="font-display text-2xl font-semibold">{mode === "up" ? "Create your account" : "Welcome back"}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Your account keeps Monere Plus and pass codes with you. Your journal still stays on this device.</p>
      {sent ? (
        <div className="surface-card mt-6 p-5 text-sm">Check your email to confirm your account, then come back and sign in.</div>
      ) : (
        <form onSubmit={submit} className="mt-6 grid gap-3">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" aria-label="Email" autoComplete="email"
            className="rounded-xl border border-border bg-background/60 px-4 py-3 outline-none focus:border-primary" />
          <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (8+ characters)" aria-label="Password"
            autoComplete={mode === "up" ? "new-password" : "current-password"} className="rounded-xl border border-border bg-background/60 px-4 py-3 outline-none focus:border-primary" />
          <Button type="submit" disabled={busy} className="btn-gold mt-2 h-auto py-3.5">{busy ? "Please wait…" : mode === "up" ? "Create account" : "Sign in"}</Button>
          <button type="button" onClick={() => setMode(mode === "up" ? "in" : "up")} className="mt-1 text-sm text-muted-foreground hover:text-primary">
            {mode === "up" ? "Already have an account? Sign in" : "New here? Create an account"}
          </button>
        </form>
      )}
    </AppShell>
  );
}
