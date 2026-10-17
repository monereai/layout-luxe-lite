import { createServerFn } from "@tanstack/react-start";

// The measurement ID is public by design; it's stored as a secret only for convenience.
export const getAnalyticsId = createServerFn({ method: "GET" }).handler(async () => {
  const id = (process.env["GOOGLE_ANALYTICS_MEASUREMENT_ID"] ?? "").trim();
  return /^G-[A-Z0-9]+$/i.test(id) ? id : null;
});

type W = Window & { dataLayer?: unknown[]; gtag?: (...a: unknown[]) => void };

export function initAnalytics(id: string) {
  const w = window as W;
  if (w.gtag) return;
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(s);
  w.dataLayer = w.dataLayer || [];
  w.gtag = function () {
    // eslint-disable-next-line prefer-rest-params -- gtag needs the Arguments object
    w.dataLayer!.push(arguments);
  };
  w.gtag("js", new Date());
  w.gtag("config", id, { send_page_view: false });
}

export function trackPageView(path: string) {
  (window as W).gtag?.("event", "page_view", { page_path: path, page_location: window.location.href });
}
