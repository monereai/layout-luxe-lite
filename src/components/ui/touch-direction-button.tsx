import { useCallback, useEffect, useRef, type ComponentProps } from "react";
import { Button } from "@/components/ui/button";

export type TouchArrow = "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight";
const keyCodes: Record<TouchArrow, number> = { ArrowUp: 38, ArrowDown: 40, ArrowLeft: 37, ArrowRight: 39 };

/** Feed existing keyboard listeners, including Phaser, without changing game rules. */
export function TouchDirectionButton({ arrow, disabled, ...props }: Omit<ComponentProps<typeof Button>, "onPointerDown" | "onPointerUp" | "onPointerCancel" | "onLostPointerCapture"> & { arrow: TouchArrow }) {
  const held = useRef(false);
  const emit = useCallback((type: "keydown" | "keyup") => {
    window.dispatchEvent(new KeyboardEvent(type, { key: arrow, code: arrow, keyCode: keyCodes[arrow], which: keyCodes[arrow], bubbles: true, cancelable: true }));
  }, [arrow]);
  const release = useCallback(() => {
    if (!held.current) return;
    held.current = false;
    emit("keyup");
  }, [emit]);
  useEffect(() => {
    window.addEventListener("blur", release);
    const hidden = () => { if (document.hidden) release(); };
    document.addEventListener("visibilitychange", hidden);
    return () => { release(); window.removeEventListener("blur", release); document.removeEventListener("visibilitychange", hidden); };
  }, [release]);
  useEffect(() => { if (disabled) release(); }, [disabled, release]);
  return <Button {...props} disabled={disabled} onPointerDown={event => {
    if (disabled || held.current) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    held.current = true;
    emit("keydown");
  }} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release} />;
}