import { createFileRoute, redirect } from "@tanstack/react-router";

// Talking with Monere is the site's main page at "/". This route only keeps
// existing /mentor links and bookmarks working with a permanent redirect.
export const Route = createFileRoute("/mentor")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Talk to Monere — MonereAI" },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: () => {
    throw redirect({ to: "/", code: 301 });
  },
  component: () => null,
});
