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
import DonkeyKongMiniGame from "@/components/treasure/DonkeyKongMiniGame";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
function open() {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  const jump = vi.fn().mockResolvedValue(undefined);
  render(<DonkeyKongMiniGame avatar="/lion.webp" energy={50} onJump={jump} onComplete={vi.fn()} onExit={vi.fn()} />);
  act(() => engine.scene?.create());
  return jump;
}
function step() { act(() => engine.scene?.update(0, 50)); }
function state() { return JSON.parse(screen.getByRole("img").getAttribute("data-state") ?? "{}"); }

it("Start activates the waiting scene and barrels spawn after 60 ticks", () => {
  open(); step(); expect(state().tick).toBe(0);
  fireEvent.click(screen.getByRole("button", { name: "Start garden challenge" }));
  for (let i = 0; i < 60; i++) step();
  expect(state().tick).toBe(60); expect(state().barrels).toHaveLength(1);
});
it("WASD starts movement and releasing the key stops movement", () => {
  open(); fireEvent.keyDown(window, { key: "D" }); step();
  expect(state().x).toBe(66);
  fireEvent.keyUp(window, { key: "D" }); step(); expect(state().x).toBe(66);
});
it("touch direction starts the scene without needing a keyboard", () => {
  open(); const right = screen.getByRole("button", { name: "Garden move right" });
  right.setPointerCapture = vi.fn(); fireEvent.pointerDown(right, { pointerId: 1 }); step();
  expect(state().x).toBe(66);
  fireEvent.pointerUp(right); step(); expect(state().x).toBe(66);
});
it("Space jumps immediately and a slow save never freezes the loop", async () => {
  const jump = open();
  let release: (() => void) | null = null;
  jump.mockImplementationOnce(() => new Promise<void>(resolve => { release = resolve; }));
  fireEvent.click(screen.getByRole("button", { name: "Start garden challenge" }));
  fireEvent.keyDown(window, { key: " " });
  step();
  expect(state().jumps).toBe(1); expect(state().jump).toBe(12);
  step(); step();
  expect(state().tick).toBe(3);
  await act(async () => { release?.(); });
  expect(jump).toHaveBeenCalledTimes(1);
  expect(jump.mock.calls[0]?.[0].at(-1)).toBe("jump");
});
it("the Jump button queues a jump exactly like the keyboard", () => {
  const jump = open();
  fireEvent.click(screen.getByRole("button", { name: "Start garden challenge" }));
  fireEvent.click(screen.getByRole("button", { name: /Jump · 5/ }));
  step();
  expect(state().jumps).toBe(1);
  expect(jump).toHaveBeenCalledTimes(1);
});
it("jumping with less than 5 Energy is refused with a message", () => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  const jump = vi.fn().mockResolvedValue(undefined);
  render(<DonkeyKongMiniGame avatar="/lion.webp" energy={4} onJump={jump} onComplete={vi.fn()} onExit={vi.fn()} />);
  act(() => engine.scene?.create());
  fireEvent.click(screen.getByRole("button", { name: "Start garden challenge" }));
  fireEvent.keyDown(window, { key: " " });
  step();
  expect(state().jumps).toBe(0);
  expect(jump).not.toHaveBeenCalled();
  expect(screen.getByRole("alert").textContent).toContain("5 Energy");
});