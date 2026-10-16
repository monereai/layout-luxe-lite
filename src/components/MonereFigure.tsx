import { useEffect, useState } from "react";
import { equippedItems, useShop } from "@/lib/shop";
import { COMBINATION_FAMILIES, combinationLook } from "@/lib/shop-combinations";
import { useCharacterFrame } from "@/lib/character-frame";

export type Gesture = "wave" | "think" | "thumbs" | "listen";

/** Each frame is one complete character picture, not a base with accessory overlays. Looks without their own turnaround art fall back to the default Monere. */
export function MonereFigure({ className = "", alt = "", showWorn = true }: { gesture?: Gesture; className?: string; alt?: string; bareBase?: boolean; showWorn?: boolean }) {
  const shop = useShop();
  const frame = useCharacterFrame();
  const look = combinationLook(shop.equipped) ?? "default";
  const [missing, setMissing] = useState(false);
  useEffect(() => setMissing(false), [look]);
  const shown = missing ? "default" : look;
  const activeImageSrc = `/monere/looks/${shown}/${frame}.webp`;
  // Items equipped but not drawn in the current complete picture still show as worn badges.
  const family = COMBINATION_FAMILIES.find((f) => shown.startsWith(`combo-${f.id}`));
  const drawn = new Set<string>(family ? [family.hat, family.outfit, family.footwear] : [shown]);
  const extra = showWorn ? equippedItems(shop).filter((item) => item && !drawn.has(item.id)) : [];
  return (
    <div className={`relative isolate block aspect-square ${className}`} role={alt ? "img" : undefined} aria-label={alt || undefined}>
      <img data-character-look={shown} data-character-frame={frame} src={activeImageSrc} alt="" aria-hidden="true" draggable={false} onError={() => setMissing(true)} className="pointer-events-none absolute inset-0 h-full w-full object-contain" />
      {extra.length > 0 && (
        <div data-worn-badges className="pointer-events-none absolute bottom-1 right-1 z-10 flex flex-col gap-1">
          {extra.map((item) => item && (
            <span key={item.id} title={item.name} className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/50 bg-card/90 shadow-md">
              <img src={item.src} alt={item.name} className="h-7 w-7 object-contain" draggable={false} />
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/** Round head-and-shoulders avatar for chat bubbles and the header. */
export function MonereAvatar({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <span className={`relative block shrink-0 overflow-hidden rounded-full border border-primary/40 bg-secondary ${className}`}>
      <MonereFigure gesture="wave" showWorn={false} className="absolute left-1/2 top-0 w-[260%] -translate-x-1/2" />
    </span>
  );
}
