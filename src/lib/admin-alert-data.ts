export const ADMIN_ALERT_TO = "carlhillyard@icloud.com";
export const ADMIN_ALERT_SUBJECT = "New Monere AI User Registration / Subscription!";
// Never notify about existing accounts when the new integration is installed.
export const ALERTS_STARTED_AT = "2026-10-21T07:43:29Z";
export type SignupSource = "guest conversion" | "direct";
export type AccountAlert = {
  event: "Registration" | "Subscription";
  username: string;
  email: string;
  signupAt: string;
  eventAt: string;
  source: SignupSource;
  tier: string;
};
export function signupSource(value: unknown): SignupSource {
  return value === "guest conversion" ? "guest conversion" : "direct";
}
export function eligibleRegistration(user: { created_at: string; email_confirmed_at?: string; email?: string }) {
  return Boolean(user.email && user.email_confirmed_at && Date.parse(user.created_at) >= Date.parse(ALERTS_STARTED_AT));
}
export function registrationAlertKey(userId: string) { return `admin-registration-${userId}`; }
export function subscriptionAlertKey(env: string, subscriptionId: string) { return `admin-subscription-${env}-${subscriptionId}`; }