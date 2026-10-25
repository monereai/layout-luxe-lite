import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ update: null as (() => void) | null }));
vi.mock("phaser", () => {
  class Scene {
    load = { image: vi.fn() };
    add = { graphics: () => ({ lineStyle: vi.fn(), lineBetween: vi.fn() }), text: () => ({}), image: () => ({ setDisplaySize: () => ({ setOrigin: () => ({ setDepth: () => ({ setPosition: vi.fn(), setFlipX: vi.fn() }) }) }) }) };
  }
  return { default: { Scene, CANVAS: 1, Scale: { FIT: 1, CENTER_BOTH: 1 }, Game: class {
    constructor(config: { scene: new () => Scene & { create: () => void; update: (t: number, dt: number) => void } }) {
      const scene = new config.scene(); scene.create(); mock.update = () => scene.update(0, 50);
    }
    destroy() { mock.update = null; }
  } } };
});
vi.mock("@/lib/audio", () => ({ playSound: vi.fn() }));
vi.mock("@/lib/arcade-game", () => ({ ARCADE_MAX_MISSES: 5, ARCADE_TICK_MS: 50, ARCADE_WIN_CATCHES: 10,
  newArcade: () => ({ tick: 0, catches: 0, misses: 0, x: 300, fruits: [], won: false, lost: false }),
  arcadeStep: () => ({ tick: 1, catches: 10, misses: 0, x: 300, fruits: [], won: true, lost: false }) }));
import ConnieArcadeMiniGame from "@/components/treasure/ConnieArcadeMiniGame";
afterEach(cleanup);
it("retry saves the same winning trace without replaying the round", async () => {
  const complete = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(undefined);
  render(<ConnieArcadeMiniGame avatar="/avatar.webp" onComplete={complete} onExit={vi.fn()} />);
  fireEvent.click(await screen.findByRole("button", { name: "Start arcade game" }));
  const { act } = await import("@testing-library/react");
  await act(async () => mock.update?.());
  fireEvent.click(await screen.findByRole("button", { name: "Retry Save" }));
  await waitFor(() => expect(complete).toHaveBeenCalledTimes(2));
  expect(complete.mock.calls[0]?.[0]).toEqual(["idle"]);
  expect(complete.mock.calls[1]?.[0]).toEqual(complete.mock.calls[0]?.[0]);
});