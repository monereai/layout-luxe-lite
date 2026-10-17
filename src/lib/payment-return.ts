const LIVE_PAYMENT_ORIGIN = "https://monereai.com";

/** Never transfer a signed-in checkout to another origin: browser sessions are origin-scoped. */
export function paymentReturnUrl(origin: string, environment: "sandbox" | "live"): string {
  if (environment === "live" && origin !== LIVE_PAYMENT_ORIGIN) {
    throw new Error("For real payments, open https://monereai.com and sign in there before buying. Your sign-in cannot be transferred between websites.");
  }
  return `${origin}/?payment=success&session_id={CHECKOUT_SESSION_ID}`;
}