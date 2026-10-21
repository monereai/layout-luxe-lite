import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ send: vi.fn(), save: vi.fn(), grant: vi.fn(), owner: vi.fn() }));
vi.mock("@/lib/admin-alerts.server", () => ({ sendAccountAlert: mocks.send }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: {
  from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }), upsert: mocks.save }),
  rpc: mocks.grant, auth: { admin: { getUserById: mocks.owner } },
} }));
import { syncStripeSubscription } from "@/lib/stripe-sync.server";
import type Stripe from "stripe";
const subscription = { id: "sub_qa", created: Date.parse("2026-10-21T09:00:00Z") / 1000, metadata: { userId: "qa-user" }, customer: "cus_qa", status: "active", items: { data: [{ price: { lookup_key: "club_monthly" }, current_period_start: Date.parse("2026-10-21T09:00:00Z") / 1000 }] } };
function stripe(status = "active") { return { subscriptions: { retrieve: async () => ({ ...subscription, status }) } } as unknown as Stripe; }
beforeEach(() => {
  vi.clearAllMocks();
  mocks.save.mockResolvedValue({ error: null }); mocks.grant.mockResolvedValue({ error: null });
  mocks.owner.mockResolvedValue({ data: { user: { email: "qa@example.com", created_at: "2026-10-21T08:00:00Z", user_metadata: { signup_source: "guest conversion" } } } });
  mocks.send.mockResolvedValue({ sent: true });
});
it("notifies for a verified active live Club subscription with a stable key", async () => {
  await syncStripeSubscription(stripe(), "sub_qa", "live");
  expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({ event: "Subscription", email: "qa@example.com", tier: "club", source: "guest conversion" }), "admin-subscription-live-sub_qa");
});
it("does not email the owner about test purchases", async () => {
  await syncStripeSubscription(stripe(), "sub_qa", "sandbox");
  expect(mocks.send).not.toHaveBeenCalled();
});
it("does not announce an incomplete subscription", async () => {
  await syncStripeSubscription(stripe("incomplete"), "sub_qa", "live");
  expect(mocks.send).not.toHaveBeenCalled();
});
it("does not block verified membership benefits when email is unavailable", async () => {
  mocks.send.mockRejectedValue(new Error("domain_not_verified"));
  expect(await syncStripeSubscription(stripe(), "sub_qa", "live")).toEqual({ ok: true, tier: "club" });
  expect(mocks.grant).toHaveBeenCalledTimes(1);
});
it("does not send for mismatched account ownership", async () => {
  expect(await syncStripeSubscription(stripe(), "sub_qa", "live", "other-user")).toEqual({ ok: false, tier: null });
  expect(mocks.send).not.toHaveBeenCalled();
});