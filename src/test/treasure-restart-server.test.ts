import { describe, expect, it, vi } from "vitest";
import { initialAdventure } from "@/lib/treasure";

const mocks = vi.hoisted(() => ({ auth: {}, isTester: vi.fn() }));
vi.mock("@tanstack/react-start", () => ({ createServerFn: () => {
  const chain = { middleware: vi.fn(() => chain), inputValidator: vi.fn(() => chain), handler: (fn: unknown) => fn };
  return chain;
} }));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: mocks.auth }));
vi.mock("@/lib/treasureGate", () => ({ TREASURE_MAINTENANCE: true, isTreasureTester: mocks.isTester }));
import { adventureAction } from "@/lib/treasure.functions";

type Handler = (input: { data: { action: string }; context: { userId: string; supabase: unknown } }) => Promise<{ state: unknown; griffin: boolean; points: number }>;
const handler = adventureAction as unknown as Handler;
function client() {
  const roles = { data: [{ role: "tester" }], error: null };
  const chain = { select: () => chain, eq: () => chain, in: async () => roles };
  return { auth: { getUser: async () => ({ data: { user: { id: "isolated", email: "test@example.test" } }, error: null }) }, from: () => chain, rpc: vi.fn(async () => ({ data: { state: initialAdventure(), points: 0, griffin: false }, error: null })) };
}
describe("Protected replay operation", () => {
  it("resets through the authenticated SQL operation with no reward", async () => {
    mocks.isTester.mockReturnValue(true);
    const supabase = client();
    const result = await handler({ data: { action: "restart" }, context: { userId: "isolated", supabase } });
    expect(supabase.rpc).toHaveBeenCalledExactlyOnceWith("treasure_restart");
    expect(result).toEqual({ state: initialAdventure(), points: 0, griffin: false });
  });
  it("denies non-testers without resetting anything", async () => {
    mocks.isTester.mockReturnValue(false);
    const supabase = client();
    await expect(handler({ data: { action: "restart" }, context: { userId: "isolated", supabase } })).rejects.toThrow("under construction");
    expect(supabase.rpc).not.toHaveBeenCalled();
  });
});