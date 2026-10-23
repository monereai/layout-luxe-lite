import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { TreasureGame } from "@/components/treasure/TreasureGame";
import { TreasureConstructionGate } from "@/components/treasure/TreasureConstructionGate";
import { DailyDilemmaModal } from "@/components/DailyDilemmaModal";
import { usePaymentReturn } from "@/hooks/usePaymentReturn";
import { TREASURE_MAINTENANCE } from "@/lib/treasureGate";
import { useTreasureAccess } from "@/hooks/useTreasureAccess";

export const Route = createFileRoute("/treasure")({
  staticData: { sitemap: !TREASURE_MAINTENANCE },
  validateSearch: (s: Record<string, unknown>): { dilemma?: number | undefined } => ({ dilemma: s["dilemma"] === "1" || s["dilemma"] === 1 ? 1 : undefined }),
  head: () => ({ meta: [
    { title: TREASURE_MAINTENANCE ? "Adventure Under Construction — MonereAI" : "The Rescue of the Golden Griffin — MonereAI" },
    { name: "description", content: TREASURE_MAINTENANCE ? "Monere is getting ready for his adventure. The Rescue of the Golden Griffin is temporarily closed for improvements." : "Explore four lands with Monere, find hidden scrolls, solve riddles and rescue the Golden Griffin from Razor." },
    { property: "og:title", content: TREASURE_MAINTENANCE ? "Adventure Under Construction — MonereAI" : "The Rescue of the Golden Griffin — MonereAI" },
    { property: "og:description", content: TREASURE_MAINTENANCE ? "Monere's adventure will be back soon. Return to the main dashboard while improvements are underway." : "Join Monere on a four-land adventure to rescue the Golden Griffin." },
    ...(TREASURE_MAINTENANCE ? [{ name: "robots", content: "noindex, nofollow" }] : []),
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: AdventureHome,
});
function AdventureHome() {
  const { allowed, checking } = useTreasureAccess();
  usePaymentReturn();
  const { dilemma } = Route.useSearch();
  const [open, setOpen] = useState(false);
  useEffect(() => { if (allowed && dilemma === 1) setOpen(true); }, [dilemma, allowed]);
  return (
    <AppShell adventure>
      {checking ? <p role="status" className="text-center text-muted-foreground">Checking adventure access…</p> : allowed ? <TreasureGame /> : <TreasureConstructionGate />}
      {allowed && <DailyDilemmaModal open={open} onOpenChange={setOpen} />}
    </AppShell>
  );
}