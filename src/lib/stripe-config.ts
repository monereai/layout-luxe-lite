/** Public Stripe key supplied for the connected production account; never a secret. */
export const LIVE_PUBLISHABLE_KEY = "pk_live_51TMsQ9Q94lPfyPtisLpvsHzq08N4LvXg0wLzAXq4W2kAMwEzEOGMsxXPUvL5xm5NfnVmpci0wzNKHlGZ6jqw0YFB00wJHWxBJC";

export function checkoutPublishableKey(managedToken: string | undefined, production: boolean): string {
  if (production) {
    if (!managedToken?.startsWith("pk_live_")) throw new Error("Complete Stripe go-live before enabling production checkout.");
    return LIVE_PUBLISHABLE_KEY;
  }
  if (!managedToken?.startsWith("pk_test_")) throw new Error("Stripe test payments are not configured for this preview.");
  return managedToken;
}