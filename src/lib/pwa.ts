// Single place that registers the app's service worker. Never in dev/preview/iframes.
function blocked() {
  const h = window.location.hostname;
  const ends = (d: string) => h === d || h.endsWith(`.${d}`);
  return (
    !import.meta.env.PROD ||
    window.self !== window.top ||
    h.startsWith("id-preview--") || h.startsWith("preview--") ||
    ends("lovableproject.com") || ends("lovableproject-dev.com") || ends("beta.lovable.dev") ||
    new URLSearchParams(window.location.search).get("sw") === "off"
  );
}

export async function registerAppServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (blocked()) {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.filter((r) => r.active?.scriptURL.endsWith("/sw.js")).map((r) => r.unregister()));
    return;
  }
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}
