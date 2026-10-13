import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { MonereMentor } from "@/components/MonereMentor";
import { Button } from "@/components/ui/button";
import { usePlan } from "@/hooks/usePlan";

export const Route = createFileRoute("/checkout/return")({
  validateSearch: (s: Record<string, unknown>): { session_id?: string } => ({ session_id: typeof s["session_id"] === "string" ? (s["session_id"] as string) : undefined }),
  head: () => ({
    meta: [
      { title: "Welcome to Monere Plus — MonereAI" },
      { name: "description", content: "Your Monere Plus trial is starting." },
      { property: "og:title", content: "Welcome to Monere Plus — MonereAI" },
      { property: "og:description", content: "Your Monere Plus trial is starting." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Return,
});

function Return() {
  const { premium, refresh, user } = usePlan();
  const [tries, setTries] = useState(0);
  useEffect(() => {
    if (premium || !user || tries > 10) return;
    const t = setTimeout(() => { void refresh(); setTries((n) => n + 1); }, 2000);
    return () => clearTimeout(t);
  }, [premium, user, tries, refresh]);

  return (
    <AppShell>
      <MonereMentor mode="results" />
      <h1 className="mt-6 font-display text-2xl font-semibold">{premium ? "You're in — welcome to Monere Plus!" : "Setting up your Monere Plus…"}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {premium ? "Unlimited advice and song previews are unlocked. Let's keep going." : tries > 10 ? "This is taking longer than usual. It will unlock shortly — try refreshing in a minute." : "Just a moment while we confirm your trial."}
      </p>
      <Button asChild className="btn-gold mt-6 h-auto py-4"><Link to="/">Talk to Monere</Link></Button>
    </AppShell>
  );
}
