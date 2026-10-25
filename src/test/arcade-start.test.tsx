import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

const engine = vi.hoisted(() => ({ scene: null as null | { create: () => void; update: (time: number, dt: number) => void }, destroyed: vi.fn() }));
vi.mock("phaser", () => {
  const chain = new Proxy({}, { get: () => () => chain });
  class Scene {
    load = { image: vi.fn() };
    add = { image: () => chain, graphics: () => chain, text: () => chain, circle: () => chain };
  }
  class Game {
    constructor(config: { scene: new () => Scene }) { engine.scene = new config.scene() as unknown as typeof engine.scene; }
    destroy = engine.destroyed;
  }
  return { default: { Scene, Game, CANVAS: 1, Scale: { FIT: 1, CENTER_BOTH: 1 }, Display: { Color: { ValueToColor: () => ({ color: 0 }) } } } };
});
vi.mock("@/lib/audio", () => ({ playSound: vi.fn() }));
import ConnieArcadeMiniGame from "@/components/treasure/ConnieArcadeMiniGame";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
function open() {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  render(<ConnieArcadeMiniGame avatar="/lion.webp" onComplete={vi.fn()} onExit={vi.fn()} />);
  act(() => engine.scene?.create());
}
function step() { act(() => engine.scene?.update(0, 50)); }
function state() { return JSON.parse(screen.getByRole("img").getAttribute("data-state") ?? "{}"); }

it("offers the second scroll as the prize", () => {
  open();
  expect(screen.getByText(/Win the second scroll/)).toBeTruthy();
});
it("shows the entry notification when Monere enters the arcade", () => {
  open();
  expect(screen.getByText(/Catch 10 fruits to win the second scroll/i)).toBeTruthy();
});
it("Start activates the waiting scene and fruit spawns after 45 ticks", () => {
  open(); step(); expect(state().tick).toBe(0);
  fireEvent.click(screen.getByRole("button", { name: "Start arcade game" }));
  for (let i = 0; i < 45; i++) step();
  expect(state().tick).toBe(45); expect(state().fruits).toHaveLength(1);
});
it("WASD starts movement and releasing the key stops movement", () => {
  open(); fireEvent.keyDown(window, { key: "D" }); step();
  expect(state().x).toBe(308);
  fireEvent.keyUp(window, { key: "D" }); step(); expect(state().x).toBe(308);
});
it("touch direction starts the scene without needing a keyboard", () => {
  open(); const left = screen.getByRole("button", { name: "Arcade move left" });
  left.setPointerCapture = vi.fn(); fireEvent.pointerDown(left, { pointerId: 1 }); step();
  expect(state().x).toBe(292);
  fireEvent.pointerUp(left); step(); expect(state().x).toBe(292);
});
