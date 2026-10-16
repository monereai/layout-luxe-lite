import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { CharacterFrameContext } from "@/lib/character-frame";
import { MonereFigure } from "@/components/MonereFigure";

vi.mock("@/lib/outfit", () => ({ useOutfit: () => ({ outfit: { id: "default", src: "/monere/monere-wave.webp" } }) }));
vi.mock("@/lib/shop", () => ({
  useShop: () => ({ equipped: { hat: "crown", accessory: "bow-tie" } }),
  equippedItems: () => [
    { id: "crown", category: "hat", src: "/crown.webp" },
    { id: "bow-tie", category: "accessory", src: "/bow-tie.webp" },
  ],
}));

afterEach(cleanup);

it("preserves the same equipped item nodes across front, side, back, and reset frames", () => {
  const figure = (frame: number) => <CharacterFrameContext.Provider value={frame}><MonereFigure /></CharacterFrameContext.Provider>;
  const { container, rerender } = render(figure(0));
  const crown = container.querySelector('[data-equipped-item="crown"]');
  const bowTie = container.querySelector('[data-equipped-item="bow-tie"]');
  expect(crown).not.toBeNull();
  expect(bowTie).not.toBeNull();
  for (const frame of [2, 4, 6, 0]) {
    rerender(figure(frame));
    expect(container.querySelector('[data-equipped-item="crown"]')).toBe(crown);
    expect(container.querySelector('[data-equipped-item="bow-tie"]')).toBe(bowTie);
  }
});