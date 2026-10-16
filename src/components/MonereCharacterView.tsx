import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { INITIAL_CHARACTER_VIEW, characterFrame, rotateCharacter, wheelCharacterZoom, zoomCharacter } from "@/lib/character-view";
import { useLang } from "@/lib/i18n";
import { CharacterFrameContext } from "@/lib/character-frame";

const RESET_LABELS = { en: "Reset View", es: "Restablecer vista", fr: "Réinitialiser la vue", pt: "Repor vista", de: "Ansicht zurücksetzen" };
type Point = { x: number; y: number };

export function MonereCharacterView({ children }: { children: ReactNode }) {
  const surface = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, Point>());
  const [view, setView] = useState(INITIAL_CHARACTER_VIEW);
  const [dragging, setDragging] = useState(false);
  const lang = useLang();
  const frame = characterFrame(view.rotation);

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
    if (!previous) return;
    const before = [...pointers.current.values()];
    const next = { x: event.clientX, y: event.clientY };
    pointers.current.set(event.pointerId, next);
    if (pointers.current.size === 1) {
      setView((current) => ({ ...current, rotation: rotateCharacter(current.rotation, next.x - previous.x, rect.width) }));
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
        onPointerUp={release}
        onPointerCancel={release}
        onLostPointerCapture={release}
        onKeyDown={(event) => {
          if (!["ArrowLeft", "ArrowRight", "+", "=", "-", "0"].includes(event.key)) return;
          event.preventDefault();
          setView((current) => event.key === "0" ? INITIAL_CHARACTER_VIEW : event.key.startsWith("Arrow")
            ? { ...current, rotation: current.rotation + (event.key === "ArrowLeft" ? -45 : 45) }
            : zoomCharacter(current, current.scale * (event.key === "-" ? 1 / 1.1 : 1.1), { x: 0, y: 0 }));
        }}
      >
        <div aria-hidden="true" className="character-ground-shadow pointer-events-none" style={{ transform: `translate(-50%, 0) scale(${view.scale})` }} />
        <div data-frame={frame} data-rotation={view.rotation} className="character-transform relative pointer-events-none h-full w-full" style={{ transform: `translate(${view.x}px, ${view.y}px) rotateY(${characterFrameTilt(view.rotation)}deg) scale(${view.scale})`, transformStyle: "preserve-3d" }}>
          <CharacterFrameContext.Provider value={frame}>{children}</CharacterFrameContext.Provider>
        </div>
      </div>
      <Button type="button" variant="secondary" size="icon" title={RESET_LABELS[lang]} aria-label={RESET_LABELS[lang]} className="absolute right-2 top-2 z-20 h-9 w-9 rounded-lg border border-border" onClick={() => setView(INITIAL_CHARACTER_VIEW)}>
        <RotateCcw className="h-4 w-4" />
      </Button>
    </div>
  );
}