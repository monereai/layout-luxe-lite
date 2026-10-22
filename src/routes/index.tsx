import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { TreasureGame } from "@/components/treasure/TreasureGame";
import { DailyDilemmaModal } from "@/components/DailyDilemmaModal";
import { usePaymentReturn } from "@/hooks/usePaymentReturn";

export const Route = createFileRoute("/")({
  staticData: { sitemap: true },
  validateSearch: (s: Record<string, unknown>): { dilemma?: number | undefined } => ({ dilemma: s["dilemma"] === "1" || s["dilemma"] === 1 ? 1 : undefined }),
  head: () => ({ meta: [
    { title: "Monere Treasure Hunt — MonereAI" },
    { name: "description", content: "Explore Monere's Meadow, Whispering Forest and Sky Isles. Solve riddles, discover treasures and grow in courage, kindness and Christian wisdom." },
    { property: "og:title", content: "Monere Treasure Hunt — MonereAI" },
    { property: "og:description", content: "A playful three-zone treasure adventure with Monere the lion, hidden relics, exploration tools and wardrobe rewards." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: AdventureHome,
});
function AdventureHome() {
  usePaymentReturn();
  const { dilemma } = Route.useSearch();
  const [open, setOpen] = useState(false);
  useEffect(() => { if (dilemma === 1) setOpen(true); }, [dilemma]);
  return <AppShell adventure><TreasureGame /><DailyDilemmaModal open={open} onOpenChange={setOpen} /></AppShell>;
}