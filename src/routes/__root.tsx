import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { getAnalyticsId, initAnalytics, trackPageView } from "@/lib/analytics";
import { registerAppServiceWorker } from "@/lib/pwa";

import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/sonner";
import { PlanProvider } from "@/hooks/usePlan";
import { useCare } from "@/hooks/useCare";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { WardrobeSync } from "@/lib/wardrobe-sync";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "google-site-verification", content: "7bL8DhthzCeSysH5IPxTMMQED5yo7D8NBg1VPw-4ghM" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "MonereAI" },
      { name: "description", content: "Guided Wisdom & Decision Integrity for Teens" },
      { name: "application-name", content: "MonereAI" },
      { name: "apple-mobile-web-app-title", content: "MonereAI" },
      { name: "theme-color", content: "#1E293B" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,600&display=swap" },
      { rel: "icon", href: "/monereai-mark.svg", type: "image/svg+xml" },
      { rel: "apple-touch-icon", href: "/icon-192.png" },
      { rel: "manifest", href: "/manifest.json" },
    ],
    scripts: [
      { id: "cookieyes", type: "text/javascript", src: "https://cdn-cookieyes.com/client_data/3cd52b1bea050b7f5a7cd58f/script.js" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useEffect(() => { void registerAppServiceWorker(); }, []);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [gaId, setGaId] = useState<string | null>(null);
  useEffect(() => {
    void getAnalyticsId().then((id) => { if (id) { initAnalytics(id); setGaId(id); } }).catch(() => {});
  }, []);
  useEffect(() => { if (gaId) trackPageView(path); }, [gaId, path]);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <PlanProvider>
        <CareSync />
        <WardrobeSync />
        <Outlet />
      </PlanProvider>
      <Toaster position="top-center" />
    </QueryClientProvider>
  );
}

function CareSync() { useCare(); return null; }
