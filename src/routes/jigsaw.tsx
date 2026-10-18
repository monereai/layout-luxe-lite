import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { JigsawGame } from "@/components/JigsawGame";
import { requireAuth } from "@/lib/require-auth";

export const Route = createFileRoute("/jigsaw")({
  staticData: { sitemap: false },
  beforeLoad: ({ location }) => requireAuth(location),
  ssr: false,
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
      <JigsawGame />
    </AppShell>
  );
}
