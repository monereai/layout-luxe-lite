import { beforeEach, expect, it, vi } from "vitest";
import { ADMIN_ALERT_TO, eligibleRegistration, registrationAlertKey, subscriptionAlertKey, signupSource } from "@/lib/admin-alert-data";

const mocks = vi.hoisted(() => ({ send: vi.fn(), getUser: vi.fn(), profile: vi.fn() }));
vi.mock("@tanstack/react-start", () => ({ createServerFn: () => ({
  middleware() { return this; }, inputValidator() { return this; }, handler(fn: unknown) { return fn; },
}) }));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
vi.mock("@/lib/admin-alerts.server", () => ({ sendAccountAlert: mocks.send }));
import { notifyRegistration } from "@/lib/registration-alert.functions";
const invoke = notifyRegistration as unknown as (args: unknown) => Promise<unknown>;
const context = { userId: "qa-new-user", supabase: {
  auth: { getUser: mocks.getUser },
  from: () => ({ select: () => ({ eq: () => ({ maybeSingle: mocks.profile }) }) }),
} };
beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUser.mockResolvedValue({ data: { user: { id: "qa-new-user", email: "qa@example.com", created_at: "2026-10-21T09:00:00Z", email_confirmed_at: "2026-10-21T09:01:00Z", user_metadata: { full_name: "QA User", signup_source: "guest conversion" } } } });
  mocks.profile.mockResolvedValue({ data: { subscription_tier: "free" }, error: null });
  mocks.send.mockResolvedValue({ sent: true });
});
it("uses Carl's fixed admin recipient", () => { expect(ADMIN_ALERT_TO).toBe("carlhillyard@icloud.com"); });
it("only considers email-confirmed new accounts completed", () => {
  expect(eligibleRegistration({ email: "qa@example.com", created_at: "2026-10-21T09:00:00Z" })).toBe(false);
});
it("does not send historic registration alerts", () => {
  expect(eligibleRegistration({ email: "qa@example.com", created_at: "2026-10-20T09:00:00Z", email_confirmed_at: "2026-10-21T09:00:00Z" })).toBe(false);
});
it("reports saved signup source and verified account details", async () => {
  await invoke({ data: { source: "direct" }, context });
  expect(mocks.send).toHaveBeenCalledWith({ event: "Registration", email: "qa@example.com", username: "QA User", signupAt: "2026-10-21T09:00:00Z", eventAt: "2026-10-21T09:01:00Z", source: "guest conversion", tier: "free" }, "admin-registration-qa-new-user");
});
it("rejects identities other than the authenticated caller", async () => {
  await expect(invoke({ data: { source: "direct" }, context: { ...context, userId: "another-user" } })).rejects.toThrow("Unauthorized");
  expect(mocks.send).not.toHaveBeenCalled();
});
it("supplies the same registration idempotency key on repeat requests", async () => {
  await invoke({ data: { source: "direct" }, context });
  await invoke({ data: { source: "direct" }, context });
  expect(mocks.send.mock.calls.map(call => call[1])).toEqual([registrationAlertKey("qa-new-user"), registrationAlertKey("qa-new-user")]);
});
it("keys subscription notifications by subscription rather than recurring invoice", () => {
  expect(subscriptionAlertKey("live", "sub_qa")).toBe("admin-subscription-live-sub_qa");
  expect(subscriptionAlertKey("sandbox", "sub_qa")).not.toBe(subscriptionAlertKey("live", "sub_qa"));
});
it("normalizes unrecognized source markers", () => { expect(signupSource("arbitrary text")).toBe("direct"); });