import { useEffect, useState } from "react";
import { useShop } from "@/lib/shop";
import { combinationLook } from "@/lib/shop-combinations";
import { useCharacterFrame } from "@/lib/character-frame";

export type Gesture = "wave" | "think" | "thumbs" | "listen";

/** Each frame is one complete character picture, not a base with accessory overlays. Looks without their own turnaround art fall back to the default Monere. */
export function MonereFigure({ className = "", alt = "" }: { gesture?: Gesture; className?: string; alt?: string; bareBase?: boolean }) {
  const shop = useShop();
  const frame = useCharacterFrame();
  const look = combinationLook(shop.equipped) ?? "default";
  const [missing, setMissing] = useState(false);
  useEffect(() => setMissing(false), [look]);
  const shown = missing ? "default" : look;
  const activeImageSrc = `/monere/looks/${shown}/${frame}.webp`;
  return (
    <div className={`relative isolate block aspect-square ${className}`} role={alt ? "img" : undefined} aria-label={alt || undefined}>
      <img data-character-look={shown} data-character-frame={frame} src={activeImageSrc} alt="" aria-hidden="true" draggable={false} onError={() => setMissing(true)} className="pointer-events-none absolute inset-0 h-full w-full object-contain" />
    </div>
  );
}

/** Round head-and-shoulders avatar for chat bubbles and the header. */
export function MonereAvatar({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <span className={`relative block shrink-0 overflow-hidden rounded-full border border-primary/40 bg-secondary ${className}`}>
      <MonereFigure gesture="wave" className="absolute left-1/2 top-0 w-[260%] -translate-x-1/2" />
    </span>
  );
}
