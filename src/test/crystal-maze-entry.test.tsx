import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { initialAdventure } from "@/lib/treasure";

const mocks = vi.hoisted(() => ({ begin: vi.fn(), prepare: vi.fn(), finish: vi.fn(), returned: vi.fn() }));
vi.mock("@tanstack/react-router", () => ({ ClientOnly: ({ children }: { children: React.ReactNode }) => children, Link: ({ children }: { children: React.ReactNode }) => children, useNavigate: () => vi.fn() }));
vi.mock("@/hooks/useAdventure", () => ({ useAdventure: () => ({ state: { ...initialAdventure(), zone: "ravine", x: 4, y: 7, gates: ["meadow", "wood"] }, loaded: true, user: null, prepareHarvest: mocks.prepare, harvestReturn: mocks.returned, move: vi.fn(), act: vi.fn() }) }));
vi.mock("@/hooks/useOrchardEnergy", () => ({ useOrchardEnergy: () => ({ energy: 0, guest: true, cool: () => false, beginMaze: mocks.begin, finishMaze: mocks.finish }) }));
vi.mock("@/lib/pets", () => ({ PETS: [], usePets: () => ({ active: null }) }));
vi.mock("@/lib/shop", () => ({ useShop: () => ({ equipped: {} }), equippedItems: () => [] }));
vi.mock("@/lib/shop-combinations", () => ({ combinationLook: () => "default", itemsDrawnIn: () => [] }));
vi.mock("@/lib/audio", () => ({ playSound: vi.fn(), playBackgroundMusic: vi.fn(), resumeBackgroundMusic: vi.fn(), setMusicMuted: vi.fn(), setSoundsMuted: vi.fn(), stopBackgroundMusic: vi.fn() }));
vi.mock("@/components/MonereFigure", () => ({ MonereFigure: () => null }));
vi.mock("@/components/treasure/WorldCanvas", () => ({ WorldCanvas: () => null }));
vi.mock("@/components/PacmanHarvestMiniGame", () => ({ PacmanHarvestMiniGame: ({ onComplete }: { onComplete: (energy: number, trace: [], expelled: boolean) => Promise<void> }) => <button onClick={() => void onComplete(0, [], false)}>Finish isolated maze</button> }));
import { TreasureGame } from "@/components/treasure/TreasureGame";

beforeEach(() => { vi.clearAllMocks(); mocks.prepare.mockResolvedValue(undefined); mocks.begin.mockResolvedValue("isolated-round"); mocks.finish.mockResolvedValue({ gained: 0, state: null }); });
afterEach(cleanup);
async function openGame() { render(<TreasureGame />); fireEvent.click(screen.getByRole("button", { name: "Begin the rescue" })); }

it("Crystal Gate directly starts the maze at zero Energy and leaves the cavern unmounted", async () => {
  await openGame();
  fireEvent.click(screen.getByRole("button", { name: /Open Crystal Gate/ }));
  await screen.findByRole("button", { name: "Finish isolated maze" });
  expect(mocks.begin).toHaveBeenCalledExactlyOnceWith("caverns-1");
  expect(screen.queryByRole("region", { name: "Crystal Caverns" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Finish isolated maze" }));
  await waitFor(() => expect(mocks.finish).toHaveBeenCalledWith("caverns-1", "isolated-round", []));
  await waitFor(() => expect(screen.queryByRole("button", { name: "Finish isolated maze" })).toBeNull());
  expect(screen.queryByRole("region", { name: "Crystal Caverns" })).toBeNull();
});

it("World Map Crystal travel uses the same direct maze entrance", async () => {
  await openGame(); fireEvent.click(screen.getByRole("button", { name: "Open world map" }));
  fireEvent.click(screen.getByRole("button", { name: /Crystal Caverns/ }));
  await screen.findByRole("button", { name: "Finish isolated maze" });
  expect(mocks.begin).toHaveBeenCalledExactlyOnceWith("caverns-1");
  expect(screen.queryByRole("region", { name: "Crystal Caverns" })).toBeNull();
});

it("a refused round returns to the gate rather than the old cave interaction", async () => {
  mocks.begin.mockRejectedValue(new Error("This tree has been harvested today. Come back tomorrow!"));
  await openGame(); fireEvent.click(screen.getByRole("button", { name: /Open Crystal Gate/ }));
  await screen.findByText("This tree has been harvested today. Come back tomorrow!");
  expect(screen.queryByRole("region", { name: "Crystal Caverns" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Finish isolated maze" })).toBeNull();
  expect(screen.getByRole("button", { name: /Open Crystal Gate/ })).toBeEnabled();
});