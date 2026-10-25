// Single place that registers the app's service worker. Never in dev/preview/iframes.
export function isAppWorkerBlocked(hostname: string, production: boolean, iframe: boolean, search: string) {
  const h = hostname.toLowerCase();
  const ends = (d: string) => h === d || h.endsWith(`.${d}`);
  const previewDomain = ["lovable.app", "gpt-eng.com", "gptengineer.run"].some(ends);
  const label = h.split(".")[0] ?? "";
  return (
    !production || iframe ||
    (previewDomain && (/^(?:id-preview|preview)(?:-[a-z0-9]+)?--.+$/.test(label) || /^project--.+-dev$/.test(label))) ||
    ends("lovableproject.com") || ends("lovableproject-dev.com") || ends("beta.lovable.dev") ||
    new URLSearchParams(search).get("sw") === "off"
  );
}

export async function registerAppServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (isAppWorkerBlocked(window.location.hostname, import.meta.env.PROD, window.self !== window.top, window.location.search)) {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.filter((r) => [r.active, r.waiting, r.installing].some(worker => worker && new URL(worker.scriptURL).pathname === "/sw.js")).map((r) => r.unregister()));
    return;
  }
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}
