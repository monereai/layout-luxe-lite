import { cleanup, renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { afterEach, expect, it, vi } from "vitest";
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@/lib/treasure.functions", () => ({ startOrchardMaze: vi.fn(), settleOrchardMaze: vi.fn(), spendMovementEnergy: vi.fn(), startGardenGame: vi.fn(), commitGardenGame: vi.fn(), startArcadeGame: vi.fn(), commitArcadeGame: vi.fn() }));
vi.mock("@/hooks/useCare", () => ({ useCare: () => ({ user: null }) }));
vi.mock("@/hooks/usePlan", () => ({ usePlan: () => ({}) }));
import { useOrchardEnergy } from "@/hooks/useOrchardEnergy";
afterEach(() => { cleanup(); localStorage.clear(); });
it("Crystal practice remains available after two entries without harvest or Energy reward", async () => {
  localStorage.setItem("monere-maze-entries", JSON.stringify({ day: new Date().toISOString().slice(0, 10), count: 2 }));
  const client = new QueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  const hook = renderHook(useOrchardEnergy, { wrapper });
  await act(async () => {
    const round = await hook.result.current.beginMaze("caverns-1");
    expect(round).toBe("guest-practice");
    expect(hook.result.current.isMazePractice(round)).toBe(true);
    expect(await hook.result.current.finishMaze("caverns-1", round, ["left"])).toEqual({ gained: 0, state: null });
    await expect(hook.result.current.beginMaze("wood-1")).rejects.toThrow("twice a day");
  });
  expect(hook.result.current.energy).toBe(50);
});