import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { initialAdventure, type AdventureState } from "@/lib/treasure";

const mocks = vi.hoisted(() => ({ state: {} as AdventureState, act: vi.fn(), begin: vi.fn(), prepare: vi.fn() }));
vi.mock("@tanstack/react-router", () => ({ ClientOnly: ({ children }: { children: React.ReactNode }) => children, Link: ({ children }: { children: React.ReactNode }) => children, useNavigate: () => vi.fn() }));
vi.mock("@/hooks/useAdventure", () => ({ useAdventure: () => ({ state: mocks.state, loaded: true, user: null, prepareHarvest: mocks.prepare, harvestReturn: vi.fn(), move: vi.fn(), act: mocks.act }) }));
vi.mock("@/hooks/useOrchardEnergy", () => ({ useOrchardEnergy: () => ({ energy: 0, guest: true, cool: () => false, beginArcade: mocks.begin }) }));
vi.mock("@/lib/pets", () => ({ PETS: [], usePets: () => ({ active: null }) }));
vi.mock("@/lib/shop", () => ({ useShop: () => ({ equipped: {} }), equippedItems: () => [] }));
vi.mock("@/lib/shop-combinations", () => ({ combinationLook: () => "default", itemsDrawnIn: () => [] }));
vi.mock("@/lib/audio", () => ({ playSound: vi.fn(), playBackgroundMusic: vi.fn(), resumeBackgroundMusic: vi.fn(), setMusicMuted: vi.fn(), setSoundsMuted: vi.fn(), stopBackgroundMusic: vi.fn() }));
vi.mock("@/components/MonereFigure", () => ({ MonereFigure: () => null }));
vi.mock("@/hooks/usePointsWallet", () => ({ usePointsWallet: () => 0 }));
vi.mock("@/components/treasure/WorldCanvas", () => ({ WorldCanvas: () => null }));
vi.mock("@/components/treasure/ConnieArcadeMiniGame", () => ({ default: () => <div role="region" aria-label="Connie fruit catcher" /> }));
import { TreasureGame } from "@/components/treasure/TreasureGame";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.state = { ...initialAdventure(), zone: "wood", x: 6, y: 20, items: ["apple-1", "apple-2", "apple-3"] };
  mocks.prepare.mockResolvedValue(undefined);
  mocks.begin.mockResolvedValue("isolated-arcade-round");
  mocks.act.mockImplementation(async ({ action }: { action: string }) => action === "deliver" ? { ...mocks.state, quests: ["connie"] } : mocks.state);
});
afterEach(cleanup);
async function talkToConnie() {
  render(<TreasureGame />);
  fireEvent.click(screen.getByRole("button", { name: /Begin the rescue|Continue the rescue/ }));
  fireEvent.click(screen.getByRole("button", { name: /Talk to Connie/ }));
  await screen.findByRole("heading", { name: /Connie the Fruit Picker/ });
}

it("delivering all three apples opens Connie's arcade immediately", async () => {
  await talkToConnie();
  fireEvent.click(screen.getByRole("button", { name: "Hand them over" }));
  await screen.findByRole("region", { name: "Connie fruit catcher" });
  expect(mocks.act).toHaveBeenCalledWith({ action: "deliver", id: "connie" });
  expect(mocks.begin).toHaveBeenCalledTimes(1);
});
it("owning the wood scroll does not block the arcade after apple delivery", async () => {
  mocks.state.scrolls = ["wood"];
  await talkToConnie();
  fireEvent.click(screen.getByRole("button", { name: "Hand them over" }));
  await screen.findByRole("region", { name: "Connie fruit catcher" });
  expect(mocks.begin).toHaveBeenCalledTimes(1);
});
it("completed delivery keeps arcade access without retained apples or a new scroll reward", async () => {
  mocks.state = { ...mocks.state, quests: ["connie"], items: [], scrolls: ["wood"] };
  await talkToConnie();
  fireEvent.click(screen.getByRole("button", { name: /Play Connie/ }));
  await waitFor(() => expect(mocks.begin).toHaveBeenCalledTimes(1));
  await screen.findByRole("region", { name: "Connie fruit catcher" });
  expect(mocks.act).not.toHaveBeenCalledWith({ action: "deliver", id: "connie" });
});