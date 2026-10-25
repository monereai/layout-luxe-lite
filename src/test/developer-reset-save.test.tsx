import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { initialAdventure } from "@/lib/treasure";
const mocks = vi.hoisted(() => ({ run: vi.fn(), reset: vi.fn(), save: vi.fn() }));
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@/lib/treasure.functions", () => ({ adventureAction: mocks.run, resetDeveloperAdventure: mocks.reset }));
vi.mock("@/hooks/usePlan", () => ({ usePlan: () => ({ user: { id: "isolated" }, ready: true, refresh: vi.fn() }) }));
vi.mock("@/lib/adventure-storage", () => ({ saveAdventure: mocks.save, loadGuestAdventure: vi.fn() }));
vi.mock("@/lib/audio", () => ({ playSound: vi.fn() }));
vi.mock("@/lib/pets", () => ({ loadPets: vi.fn() }));
import { useAdventure } from "@/hooks/useAdventure";
beforeEach(() => { vi.clearAllMocks(); mocks.run.mockResolvedValue({ state: { ...initialAdventure(), scrolls: ["meadow"], quests: ["vernon"], items: ["seed-1"] }, points: 0, griffin: false }); mocks.reset.mockResolvedValue({ state: initialAdventure(), points: 0, griffin: false }); });
afterEach(cleanup);
function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return { client, ...renderHook(useAdventure, { wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider> }) };
}
it("resets unfinished developer progress and immediately saves the new start to local storage and account cache", async () => {
  const { result, client } = mount();
  await waitFor(() => expect(result.current.loaded).toBe(true));
  await act(async () => { expect(await result.current.restart(true)).toBe(true); });
  expect(mocks.reset).toHaveBeenCalledTimes(1);
  expect(result.current.state).toEqual(initialAdventure());
  expect(mocks.save).toHaveBeenLastCalledWith(initialAdventure(), "isolated");
  expect(client.getQueryData(["treasure", "isolated"])).toMatchObject({ state: initialAdventure(), points: 0 });
});
it("still forbids ordinary replay before completion", async () => {
  const { result } = mount();
  await waitFor(() => expect(result.current.loaded).toBe(true));
  await act(async () => { expect(await result.current.restart()).toBe(false); });
  expect(mocks.reset).not.toHaveBeenCalled();
  expect(result.current.state.quests).toEqual(["vernon"]);
});