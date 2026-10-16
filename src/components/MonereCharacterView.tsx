import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { INITIAL_CHARACTER_VIEW, tiltCharacter, wheelCharacterZoom, zoomCharacter } from "@/lib/character-view";
import { useLang } from "@/lib/i18n";

const RESET_LABELS = { en: "Reset View", es: "Restablecer vista", fr: "Réinitialiser la vue", pt: "Repor vista", de: "Ansicht zurücksetzen" };
type Point = { x: number; y: number };

export function MonereCharacterView({ children }: { children: ReactNode }) {
  const surface = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, Point>());
  const [view, setView] = useState(INITIAL_CHARACTER_VIEW);
  const [dragging, setDragging] = useState(false);
  const lang = useLang();

  useEffect(() => {
    const el = surface.current;
    if (!el) return;
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = el.getBoundingClientRect();
      const point = { x: event.clientX - rect.left - rect.width / 2, y: event.clientY - rect.top - rect.height / 2 };
      setView((current) => zoomCharacter(current, wheelCharacterZoom(current.scale, event.deltaY, event.deltaMode), point));
    };
    el.addEventListener("wheel", wheel, { passive: false });
    return () => el.removeEventListener("wheel", wheel);
  }, []);

  function move(event: PointerEvent<HTMLDivElement>) {
    const previous = pointers.current.get(event.pointerId);
    const rect = event.currentTarget.getBoundingClientRect();
    if (!previous) {
      if (event.pointerType === "mouse" && pointers.current.size === 0) {
        setView((current) => tiltCharacter(current,
          ((event.clientX - rect.left) / rect.width - 0.5) * 30,
          (0.5 - (event.clientY - rect.top) / rect.height) * 20));
      }
      return;
    }
    const before = [...pointers.current.values()];
    const next = { x: event.clientX, y: event.clientY };
    pointers.current.set(event.pointerId, next);
    if (pointers.current.size === 1) {
      setView((current) => tiltCharacter(current,
        current.rotation + (next.x - previous.x) / rect.width * 60,
        current.tiltX - (next.y - previous.y) / rect.height * 40));
      return;
    }
    const after = [...pointers.current.values()];
    const [a, b] = before;
    const [c, d] = after;
    if (!a || !b || !c || !d) return;
    const oldDistance = Math.hypot(a.x - b.x, a.y - b.y);
    if (oldDistance < 1) return;
    const ratio = Math.hypot(c.x - d.x, c.y - d.y) / oldDistance;
    const point = { x: (a.x + b.x) / 2 - rect.left - rect.width / 2, y: (a.y + b.y) / 2 - rect.top - rect.height / 2 };
    setView((current) => {
      const zoomed = zoomCharacter(current, current.scale * ratio, point);
      return { ...zoomed, x: zoomed.x + (c.x + d.x - a.x - b.x) / 2, y: zoomed.y + (c.y + d.y - a.y - b.y) / 2 };
    });
  }

  function release(event: PointerEvent<HTMLDivElement>) {
    pointers.current.delete(event.pointerId);
    setDragging(pointers.current.size > 0);
  }

  return (
    <div className="relative h-full w-full">
      <div
        ref={surface}
        role="group"
        aria-label="Monere character view"
        tabIndex={0}
        className={`character-view h-full w-full overflow-hidden rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
          setDragging(true);
        }}
        onPointerMove={move}
        onPointerLeave={() => {
          if (pointers.current.size === 0) setView((current) => tiltCharacter(current, 0, 0));
        }}
        onPointerUp={release}
        onPointerCancel={release}
        onLostPointerCapture={release}
        onKeyDown={(event) => {
          if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "+", "=", "-", "0"].includes(event.key)) return;
          event.preventDefault();
          setView((current) => event.key === "0" ? INITIAL_CHARACTER_VIEW : event.key.startsWith("Arrow")
            ? tiltCharacter(current,
              current.rotation + (event.key === "ArrowLeft" ? -3 : event.key === "ArrowRight" ? 3 : 0),
              current.tiltX + (event.key === "ArrowUp" ? 2 : event.key === "ArrowDown" ? -2 : 0))
            : zoomCharacter(current, current.scale * (event.key === "-" ? 1 / 1.1 : 1.1), { x: 0, y: 0 }));
        }}
      >
        <div aria-hidden="true" className="character-ground-shadow pointer-events-none" style={{ transform: `translate(calc(-50% - ${view.rotation * 0.8}px), ${view.tiltX * 0.8}px) scale(${view.scale})` }} />
        <div className="character-transform pointer-events-none h-full w-full" style={{ transform: `translate(${view.x + view.rotation * 0.6}px, ${view.y - view.tiltX * 0.6}px) scale(${view.scale}) rotateX(${view.tiltX}deg) rotateY(${view.rotation}deg)` }}>
          {children}
        </div>
      </div>
      <Button type="button" variant="secondary" size="icon" title={RESET_LABELS[lang]} aria-label={RESET_LABELS[lang]} className="absolute right-2 top-2 z-20 h-9 w-9 rounded-lg border border-border" onClick={() => setView(INITIAL_CHARACTER_VIEW)}>
        <RotateCcw className="h-4 w-4" />
      </Button>
    </div>
  );
}