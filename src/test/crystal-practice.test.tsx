import { cleanup } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ start: vi.fn(), settle: vi.fn(), refetch: vi.fn(), tester: vi.fn(() => true) }));
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn, createServerFn: () => { const chain = { middleware: () => chain, inputValidator: () => chain, handler: (fn: unknown) => fn }; return chain; } }));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
vi.mock("@/lib/treasureGate", () => ({ TREASURE_MAINTENANCE: true, isTreasureTester: mocks.tester }));
import { startOrchardMaze } from "@/lib/treasure.functions";
type Handler = (input: { data: { tree: string }; context: { userId: string; supabase: unknown } }) => Promise<{ id: string }>;
const handler = startOrchardMaze as unknown as Handler;
function client(message: string) {
  const chain = { select: () => chain, eq: () => chain, in: async () => ({ data: [{ role: "tester" }], error: null }) };
  return { auth: { getUser: async () => ({ data: { user: { id: "isolated", email: "test@example.test" } }, error: null }) }, from: () => chain, rpc: vi.fn(async () => ({ data: null, error: { message } })) };
}
afterEach(() => { cleanup(); vi.clearAllMocks(); mocks.tester.mockReturnValue(true); });
it("allows Crystal practice only after the authenticated daily reward refusal", async () => {
  const supabase = client("This tree has been harvested today. Come back tomorrow!");
  await expect(handler({ data: { tree: "caverns-1" }, context: { userId: "isolated", supabase } })).resolves.toEqual({ id: "practice" });
  expect(supabase.rpc).toHaveBeenCalledExactlyOnceWith("orchard_maze_start", { p_tree: "caverns-1" });
});
it("does not turn denied location, identity or other tree requests into practice", async () => {
  for (const [tree, message] of [["caverns-1", "Reach the Energy Tree first"], ["grove-1", "This tree has been harvested today. Come back tomorrow!"], ["caverns-1", "Access denied"]] as const) {
    await expect(handler({ data: { tree }, context: { userId: "isolated", supabase: client(message) } })).rejects.toThrow(message);
  }
  mocks.tester.mockReturnValue(false); const supabase = client("This tree has been harvested today. Come back tomorrow!");
  await expect(handler({ data: { tree: "caverns-1" }, context: { userId: "isolated", supabase } })).rejects.toThrow("under construction");
  expect(supabase.rpc).not.toHaveBeenCalled();
});