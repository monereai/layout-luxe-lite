import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { JigsawGame } from "@/components/JigsawGame";
import { MonereCare } from "@/components/MonereCare";

export const Route = createFileRoute("/jigsaw")({
  head: () => ({
    meta: [
      { title: "Monere's Jigsaw — MonereAI" },
      { name: "description", content: "Swap the pieces of a Monere picture back together and earn Wisdom Points." },
      { property: "og:title", content: "Monere's Jigsaw — MonereAI" },
      { property: "og:description", content: "Swap the pieces of a Monere picture back together and earn Wisdom Points." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: JigsawPage,
});

function JigsawPage() {
  return (
    <AppShell>
      <MonereCare snack />
      <JigsawGame />
    </AppShell>
  );
}
