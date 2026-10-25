import { beforeEach, expect, it, vi } from "vitest";
import { cellId, THIRD_SCROLL_CELL } from "@/lib/harvest-maze";

const mocks = vi.hoisted(() => ({ replay: vi.fn(), rpc: vi.fn(), round: { tree: "caverns-1", world_zone: "ravine", started_at: "2026-10-25T00:00:00Z", settled_at: null, practice: false } }));
vi.mock("@tanstack/react-start", () => ({ createServerFn: () => { const chain = { middleware: () => chain, inputValidator: () => chain, handler: (fn: unknown) => fn }; return chain; } }));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
vi.mock("@/lib/treasureGate", () => ({ TREASURE_MAINTENANCE: false }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: { rpc: mocks.rpc } }));
vi.mock("@/lib/harvest-maze", async importOriginal => ({ ...await importOriginal<typeof import("@/lib/harvest-maze")>(), replayMaze: mocks.replay }));
import { settleOrchardMaze } from "@/lib/treasure.functions";

const settle = settleOrchardMaze as unknown as (input: { data: { round: string; trace: string[] }; context: { userId: string; supabase: unknown } }) => Promise<unknown>;
const chain = { select: () => chain, eq: () => chain, single: async () => ({ data: mocks.round, error: null }) };
const context = { userId: "isolated", supabase: { from: () => chain, rpc: async () => ({ error: null }) } };
beforeEach(() => { vi.clearAllMocks(); mocks.round.tree = "caverns-1"; mocks.round.world_zone = "ravine"; mocks.replay.mockReturnValue({ collected: [], energy: 2, tick: 1, ended: null }); mocks.rpc.mockResolvedValue({ data: { energy: 52, gained: 2, state: {}, scrollAwarded: false, overflowPoints: 0 }, error: null }); });
it("does not claim the scroll for entry or harvesting without reaching its cell", async () => {
  await settle({ data: { round: "round", trace: ["left"] }, context });
  expect(mocks.rpc).toHaveBeenCalledWith("orchard_maze_settle_scroll", expect.objectContaining({ p_user: "isolated", p_scroll_reached: false }));
});
it("claims scroll three only from server-replayed collected cells", async () => {
  mocks.replay.mockReturnValue({ collected: [cellId(THIRD_SCROLL_CELL)], energy: 2, tick: 1, ended: null });
  await settle({ data: { round: "round", trace: ["right"] }, context });
  expect(mocks.rpc).toHaveBeenCalledWith("orchard_maze_settle_scroll", expect.objectContaining({ p_scroll_reached: true }));
});
it("rejects scroll rewards for other trees or origins despite reaching the same maze cell", async () => {
  mocks.replay.mockReturnValue({ collected: [cellId(THIRD_SCROLL_CELL)], energy: 2, tick: 1, ended: null });
  for (const [tree, zone] of [["ravine-1", "ravine"], ["caverns-1", "wood"]]) {
    mocks.round.tree = tree ?? ""; mocks.round.world_zone = zone ?? "";
    await settle({ data: { round: "round", trace: ["right"] }, context });
    expect(mocks.rpc).toHaveBeenLastCalledWith("orchard_maze_settle_scroll", expect.objectContaining({ p_scroll_reached: false }));
  }
});