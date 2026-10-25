import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { TouchDirectionButton } from "@/components/ui/touch-direction-button";

afterEach(cleanup);
it("touch sends Phaser-compatible arrow events and releases on blur", () => {
  const events: [string, string, number][] = [];
  const receive = (e: KeyboardEvent) => events.push([e.type, e.code, e.keyCode]);
  window.addEventListener("keydown", receive); window.addEventListener("keyup", receive);
  const { unmount } = render(<TouchDirectionButton arrow="ArrowRight" aria-label="Right" />);
  fireEvent.pointerDown(screen.getByRole("button", { name: "Right" }));
  fireEvent.blur(window);
  unmount();
  window.removeEventListener("keydown", receive); window.removeEventListener("keyup", receive);
  expect(events).toEqual([["keydown", "ArrowRight", 39], ["keyup", "ArrowRight", 39]]);
});
it("disabling a held direction releases it", () => {
  let releases = 0;
  const receive = () => { releases++; };
  window.addEventListener("keyup", receive);
  const { rerender } = render(<TouchDirectionButton arrow="ArrowUp" aria-label="Up" />);
  fireEvent.pointerDown(screen.getByRole("button", { name: "Up" }));
  rerender(<TouchDirectionButton arrow="ArrowUp" aria-label="Up" disabled />);
  window.removeEventListener("keyup", receive);
  expect(releases).toBe(1);
});