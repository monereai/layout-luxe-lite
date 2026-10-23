import { cleanup, renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { afterEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ start: vi.fn(), settle: vi.fn(), refetch: vi.fn() }));
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@/lib/treasure.functions", () => ({ startOrchardMaze: mocks.start, settleOrchardMaze: mocks.settle }));
vi.mock("@/hooks/useCare", () => ({ useCare: () => ({ user: { id: "isolated" }, data: { energy: 42 }, refetch: mocks.refetch }) }));
import { useOrchardEnergy } from "@/hooks/useOrchardEnergy";
afterEach(cleanup);
it("practice completion pays zero Energy and never settles or changes the account bar", async () => {
  const client = new QueryClient(); client.setQueryData(["monere-care", "isolated"], { energy: 42 });
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  const hook = renderHook(useOrchardEnergy, { wrapper });
  await act(async () => { expect(await hook.result.current.finishMaze("caverns-1", "practice", ["left"])).toEqual({ gained: 0, state: null }); });
  expect(mocks.settle).not.toHaveBeenCalled(); expect(mocks.refetch).not.toHaveBeenCalled();
  expect(client.getQueryData(["monere-care", "isolated"])).toEqual({ energy: 42 });
});