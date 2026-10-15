import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { MonereMentor } from "@/components/MonereMentor";
import { Button } from "@/components/ui/button";
import { usePlan } from "@/hooks/usePlan";
import { getStripeEnvironment } from "@/lib/stripe";
import { syncSubscription, GROUP_SEATS } from "@/utils/payments.functions";

export const Route = createFileRoute("/payment-success")({
  head: () => ({
    meta: [
      { title: "Subscription active — MonereAI" },
      { name: "description", content: "Your MonereAI subscription is confirmed." },
      { property: "og:title", content: "Subscription active — MonereAI" },
      { property: "og:description", content: "Your MonereAI subscription is confirmed." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Success,
});

function env() { try { return getStripeEnvironment(); } catch { return "live" as const; } }

function Success() {
  const { user, ready, refresh } = usePlan();
  const [state, setState] = useState<{ done: boolean; active: boolean; code: string | null; plan: string | null }>({ done: false, active: false, code: null, plan: null });

  useEffect(() => {
    if (!ready || !user) return;
    let tries = 0;
    let stop = false;
    const run = async () => {
      const r = await syncSubscription({ data: { environment: env() } }).catch(() => null);
      const active = !!r && ["active", "trialing", "past_due"].includes(r.status ?? "");
      if (active || tries >= 5) {
        if (!stop) setState({ done: true, active, code: r?.groupCode ?? null, plan: r?.plan ?? null });
        await refresh();
        return;
      }
      tries++;
      setTimeout(() => { if (!stop) void run(); }, 2000);
    };
    void run();
    return () => { stop = true; };
  }, [ready, user, refresh]);

  return (
    <AppShell hideCrisisBar>
      <MonereMentor mode="results" />
      <h1 className="mt-6 font-display text-2xl font-semibold">
        {!state.done ? "Confirming your subscription…" : state.active ? "You're in — welcome to Monere Plus!" : "We couldn't confirm it yet"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {!user && ready ? "Please sign in to finish setting up." : !state.done ? "Just a moment." : state.active ? "Unlimited advice, music and the full wardrobe are unlocked." : "Try refreshing this page in a minute."}
      </p>
      {state.code && (
        <div className="surface-card mt-5 p-4 text-center">
          <p className="text-sm text-muted-foreground">Your Youth Group code — share it with up to {GROUP_SEATS} young people:</p>
          <p className="mt-2 select-all font-display text-2xl font-bold tracking-widest text-primary">{state.code}</p>
          <p className="mt-2 text-xs text-muted-foreground">They enter it under "Have a Church or School Pass Code?"</p>
        </div>
      )}
      <Button asChild className="btn-gold mt-6 h-auto py-4"><Link to="/">Talk to Monere</Link></Button>
    </AppShell>
  );
}
