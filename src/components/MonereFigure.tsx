import { useEffect, useState } from "react";
import { equippedItems, useShop } from "@/lib/shop";
import { combinationLook, itemsDrawnIn } from "@/lib/shop-combinations";
import { useCharacterFrame } from "@/lib/character-frame";
import { clothingFrames, composeCharacterFrame } from "@/lib/character-art";

export type Gesture = "wave" | "think" | "thumbs" | "listen";

/** Each angle is one complete character picture, including every equipped slot. */
export function MonereFigure({ className = "", alt = "", showWorn = true }: { gesture?: Gesture; className?: string; alt?: string; bareBase?: boolean; showWorn?: boolean }) {
  const shop = useShop();
  const frame = useCharacterFrame();
  const look = combinationLook(shop.equipped) ?? "default";
  const [missing, setMissing] = useState(false);
  useEffect(() => setMissing(false), [look]);
  const shown = missing ? "default" : look;
  const activeImageSrc = `/monere/looks/${shown}/${frame}.webp`;
  const drawn = new Set<string>(itemsDrawnIn(shown, shop.equipped));
  const extra = showWorn ? equippedItems(shop).filter((item) => item && !drawn.has(item.id)) : [];
  const selectionKey = extra.map((item) => item.id).join(",");
  const pictureKey = `${activeImageSrc}:${selectionKey}`;
  const [composed, setComposed] = useState<{ key: string; src: string }>();
  useEffect(() => {
    if (!extra.length) return;
    let cancelled = false;
    composeCharacterFrame(activeImageSrc, clothingFrames(extra, frame), frame)
      .then((src) => { if (!cancelled) setComposed({ key: pictureKey, src }); })
      .catch(() => { /* Keep the available complete look if an image fails. */ });
    return () => { cancelled = true; };
  }, [pictureKey]);
  const source = extra.length && composed?.key === pictureKey ? composed.src : activeImageSrc;
  return (
    <div className={`relative isolate block aspect-square ${className}`} role={alt ? "img" : undefined} aria-label={alt || undefined}>
      <img data-character-look={shown} data-character-frame={frame} data-character-items={equippedItems(shop).map((item) => item.id).join(",")} src={source} alt="" aria-hidden="true" draggable={false} onError={() => setMissing(true)} className="pointer-events-none absolute inset-0 h-full w-full object-contain" />
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
