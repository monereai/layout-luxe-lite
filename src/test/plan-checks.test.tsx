import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

const mocks = vi.hoisted(() => ({
  user: { id: "" } as { id: string } | null,
  rpc: vi.fn(),
  profile: vi.fn(),
  sync: vi.fn(),
  listener: null as ((event: string, session: { user: { id: string } } | null) => void) | null,
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  rpc: mocks.rpc,
  from: () => ({ select: () => ({ eq: () => ({ maybeSingle: mocks.profile }) }) }),
  auth: {
    getUser: async () => ({ data: { user: mocks.user } }),
    onAuthStateChange: (listener: typeof mocks.listener) => {
      mocks.listener = listener;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    },
    signOut: vi.fn(),
  },
} }));
vi.mock("@/lib/payments.functions", () => ({ syncMembership: mocks.sync }));
vi.mock("@/lib/stripe", () => ({ getStripeEnvironment: () => "sandbox" }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { PlanProvider, usePlan } from "@/hooks/usePlan";

let account = 0;
beforeEach(() => {
  vi.clearAllMocks();
  mocks.user = { id: `isolated-plan-${++account}` };
  mocks.sync.mockResolvedValue({ ok: true });
  mocks.rpc.mockImplementation(async (name: string) => ({ data: name === "claim_daily_login" ? { claimed: true } : true, error: null }));
  mocks.profile.mockResolvedValue({ data: { monere_points: 725, monere_tokens: 10, subscription_tier: "monere_club" }, error: null });
});
afterEach(cleanup);
const wrapper = ({ children }: { children: ReactNode }) => <PlanProvider>{children}</PlanProvider>;
const calls = (name: string) => mocks.rpc.mock.calls.filter(([value]) => value === name).length;

it("settles after startup and payment sync, claiming login just once", async () => {
  const hook = renderHook(usePlan, { wrapper });
  await waitFor(() => expect(hook.result.current.ready).toBe(true));
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 40)); });
  expect(calls("is_premium")).toBe(2);
  expect(calls("claim_daily_login")).toBe(1);
  expect(mocks.profile).toHaveBeenCalledTimes(2);
  expect(hook.result.current.bonusPoints).toBe(725);
  expect(hook.result.current.tier).toBe("club");
});

it("performs one read per refresh or sign-in event without restarting the claim", async () => {
  const hook = renderHook(usePlan, { wrapper });
  await waitFor(() => expect(mocks.profile).toHaveBeenCalledTimes(2));
  await act(async () => { await hook.result.current.refresh(); });
  expect(calls("is_premium")).toBe(3);
  await act(async () => { if (mocks.user) mocks.listener?.("SIGNED_IN", { user: mocks.user }); });
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 40)); });
  expect(calls("is_premium")).toBe(4);
  expect(calls("claim_daily_login")).toBe(1);
});

it("does not downgrade a verified Club membership on a failed membership read", async () => {
  const hook = renderHook(usePlan, { wrapper });
  await waitFor(() => expect(hook.result.current.tier).toBe("club"));
  mocks.rpc.mockResolvedValue({ data: null, error: { message: "permission denied for function is_premium" } });
  await act(async () => { expect(await hook.result.current.refresh()).toBe(false); });
  expect(hook.result.current.premium).toBe(true);
  expect(hook.result.current.tier).toBe("club");
  expect(window.localStorage.getItem("monereai-tier")).toBe("premium");
});

it("clears membership and never calls the membership function while signed out", async () => {
  mocks.user = null;
  const hook = renderHook(usePlan, { wrapper });
  await waitFor(() => expect(hook.result.current.ready).toBe(true));
  await act(async () => { await hook.result.current.refresh(); });
  expect(mocks.rpc).not.toHaveBeenCalled();
  expect(hook.result.current.premium).toBe(false);
  expect(hook.result.current.tier).toBe("free");
});