import { act, cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

const engine = vi.hoisted(() => ({ scene: null as null | { create: () => void; sync: () => void }, objects: [] as { texture: { key: string }; active: boolean; destroy: () => void }[] }));
vi.mock("phaser", () => {
  function object(key = "") {
    const value = { texture: { key }, active: true, x: 0, y: 0, scaleX: 1, destroy() { value.active = false; } };
    const proxy = new Proxy(value, { get(target, name) { return name in target ? target[name as keyof typeof target] : () => proxy; } });
    engine.objects.push(proxy);
    return proxy;
  }
  const ctx = new Proxy({ getImageData: () => ({ data: [0, 0, 0, 255] }), createRadialGradient: () => ({ addColorStop: vi.fn() }), createLinearGradient: () => ({ addColorStop: vi.fn() }) }, { get: (target, key) => key in target ? target[key as keyof typeof target] : vi.fn() });
  const texture = { getContext: () => ctx, getSourceImage: () => ({}), refresh: vi.fn() };
  class Scene {
    add = { image: (_x: number, _y: number, key: string) => object(key), text: () => object(), ellipse: () => object(), circle: () => object(), container: () => object() };
    load = { image: vi.fn() };
    cameras = { main: { setRoundPixels: vi.fn(), setZoom: vi.fn(), setBounds: vi.fn(), startFollow: vi.fn(), centerOn: vi.fn() } };
    scale = { width: 1280, height: 1800, on: vi.fn() };
    textures = { exists: () => true, get: () => texture, createCanvas: () => texture };
    input = { on: vi.fn() };
    tweens = { add: vi.fn(), killTweensOf: vi.fn() };
    game = { events: { on: vi.fn() } };
  }
  class Game {
    events = { once: vi.fn() };
    scale = { resize: vi.fn() };
    constructor(config: { scene: new () => Scene }) { engine.scene = new config.scene() as unknown as typeof engine.scene; }
    destroy() {}
  }
  return { default: { Scene, Game, AUTO: 1, Scale: { RESIZE: 1, CENTER_BOTH: 1 }, Core: { Events: { BLUR: "blur" } }, Display: { Color: { HexStringToColor: () => ({ color: 0 }) } } } };
});

import { WorldCanvas } from "@/components/treasure/WorldCanvas";
import { applyAdventure, initialAdventure, ITEMS } from "@/lib/treasure";

afterEach(() => { cleanup(); engine.objects = []; engine.scene = null; vi.unstubAllGlobals(); });

it("removes each collected seed image, keeps uncollected seeds and never duplicates them on refresh", async () => {
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
  let state = initialAdventure();
  const props = { revision: 0, avatar: "/lion.png", energy: 100, controls: { current: null }, figure: { current: null }, pet: { current: null }, onBoost: vi.fn(), onMove: vi.fn(), onInteract: vi.fn(), onNotice: vi.fn(), effect: { kind: null, n: 0 } };
  const view = render(<WorldCanvas {...props} state={state} />);
  await waitFor(() => expect(engine.scene).not.toBeNull());
  act(() => engine.scene?.create());
  const seeds = () => engine.objects.filter(o => o.active && o.texture.key === "seed-packet");
  expect(seeds()).toHaveLength(3);
  for (const [index, seed] of ITEMS.filter(i => i.id.startsWith("seed-")).entries()) {
    const previous = seeds();
    state = applyAdventure({ ...state, x: seed.x, y: seed.y }, { action: "pick", id: seed.id });
    expect(state.items).toContain(seed.id);
    view.rerender(<WorldCanvas {...props} state={state} />);
    act(() => engine.scene?.sync());
    expect(previous.every(o => !o.active)).toBe(true);
    expect(seeds()).toHaveLength(2 - index);
    state = { ...state, x: state.x + 1 };
    view.rerender(<WorldCanvas {...props} state={state} />);
    act(() => engine.scene?.sync());
    expect(seeds()).toHaveLength(2 - index);
  }
});