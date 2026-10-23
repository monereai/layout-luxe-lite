import { createFileRoute, redirect } from "@tanstack/react-router";

// Talking with Monere is the site's main page at "/". This route only keeps
// existing /mentor links and bookmarks working with a permanent redirect.
export const Route = createFileRoute("/mentor")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Monere Mentor — MonereAI" },
      { name: "description", content: "Return to the main page to talk with Monere, your warm Christian wisdom companion." },
      { property: "og:title", content: "Monere Mentor — MonereAI" },
      { property: "og:description", content: "Talk with Monere on the main MonereAI page." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: () => {
    throw redirect({ to: "/", code: 301 });
  },
  component: () => null,
});
