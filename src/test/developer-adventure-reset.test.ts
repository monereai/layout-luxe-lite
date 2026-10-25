import { beforeEach, expect, it, vi } from "vitest";
import { initialAdventure } from "@/lib/treasure";

const mocks = vi.hoisted(() => ({ email: "carlhillyard@icloud.com", roles: ["tester"], id: "isolated", rpc: vi.fn(), roleError: null as unknown }));
vi.mock("@tanstack/react-start", () => ({ createServerFn: () => { const chain = { middleware: () => chain, inputValidator: () => chain, handler: (fn: unknown) => fn }; return chain; } }));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
import { resetDeveloperAdventure } from "@/lib/treasure.functions";
const reset = resetDeveloperAdventure as unknown as (input: { context: { userId: string; supabase: unknown } }) => Promise<unknown>;
const chain = { select: () => chain, eq: () => chain, in: async () => ({ data: mocks.roles.map(role => ({ role })), error: mocks.roleError }) };
const context = { userId: "isolated", supabase: { auth: { getUser: async () => ({ data: { user: { id: mocks.id, email: mocks.email } }, error: null }) }, from: () => chain, rpc: mocks.rpc } };
beforeEach(() => { vi.clearAllMocks(); mocks.email = "carlhillyard@icloud.com"; mocks.roles = ["tester"]; mocks.id = "isolated"; mocks.roleError = null; mocks.rpc.mockResolvedValue({ data: { state: initialAdventure() }, error: null }); });
it("lets the verified developer reset an unfinished adventure through self-only SQL without rewards", async () => {
  const result = await reset({ context });
  expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith("treasure_dev_reset");
  expect(result).toMatchObject({ state: { zone: "meadow", x: 10, y: 12, rescued: false, scrolls: [], quests: [], items: [] }, points: 0, griffin: false });
});
it("denies matching email without a protected developer role", async () => {
  mocks.roles = [];
  await expect(reset({ context })).rejects.toThrow("Developer access required");
  expect(mocks.rpc).not.toHaveBeenCalled();
});
it("denies other accounts even when they have a tester role", async () => {
  mocks.email = "other@example.test";
  await expect(reset({ context })).rejects.toThrow("Developer access required");
  expect(mocks.rpc).not.toHaveBeenCalled();
});
it("denies mismatched identity and failed role checks", async () => {
  mocks.id = "different";
  await expect(reset({ context })).rejects.toThrow("Developer access required");
  mocks.id = "isolated"; mocks.roleError = new Error("unavailable");
  await expect(reset({ context })).rejects.toThrow("Developer access required");
  expect(mocks.rpc).not.toHaveBeenCalled();
});