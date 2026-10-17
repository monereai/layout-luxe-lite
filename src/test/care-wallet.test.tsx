import { fireEvent, render, screen, waitFor, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { useCareRound } from "@/hooks/useCare";

const mocks = vi.hoisted(() => ({ refresh: vi.fn(), finish: vi.fn(), start: vi.fn(), sync: vi.fn() }));
vi.mock("@/hooks/usePlan", () => ({ usePlan: () => ({ user: { id: "separate-qa" }, ready: true, refresh: mocks.refresh }) }));
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@/lib/care.functions", () => ({ updateCare: mocks.sync, startCareRound: mocks.start, finishCareRound: mocks.finish, rewardCareFind: vi.fn() }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("Mini-game account wallet updates", () => {
  it.each(["find", "jigsaw"] as const)("%s adds 5 account points immediately after a win", async (kind) => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const state = { energy: 50, pointsAwarded: 0, energyAwarded: 0 };
    mocks.sync.mockResolvedValue(state);
    mocks.start.mockResolvedValue({ id: "separate-round", order: [1, 0, 2, 3, 4, 5, 6, 7, 8] });
    mocks.finish.mockResolvedValue({ ...state, energy: 51, pointsAwarded: 5, energyAwarded: 1 });
    function Flow() {
      const [points, setPoints] = useState(100);
      mocks.refresh.mockImplementation(async () => { setPoints(105); });
      const round = useCareRound(kind, 3, 0);
      return <><output aria-label="Account points">{points}</output><button disabled={!round.round} onClick={() => void round.complete(kind === "find" ? [0,1,2,3,4,5,6,7,8,9] : [[0,1]])}>Win</button></>;
    }
    render(<QueryClientProvider client={client}><Flow /></QueryClientProvider>);
    await waitFor(() => expect(screen.getByRole("button", { name: "Win" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Win" }));
    await waitFor(() => expect(screen.getByLabelText("Account points")).toHaveTextContent("105"));
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
    expect(client.getQueryData(["monere-care", "separate-qa"])).toMatchObject({ energy: 51, pointsAwarded: 5 });
  });
});