import { useEffect, useState, type CSSProperties } from "react";
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
      {extra.filter((item) => item && (item.category === "footwear" || [0, 1, 7].includes(frame))).flatMap((item) => !item ? [] :
        item.category === "footwear"
          ? FEET.map((foot, i: number) => (
              <img key={`${item.id}-${i}`} data-worn-layer="footwear" src={item.src} alt="" aria-hidden="true" draggable={false}
                style={{ ...foot, zIndex: WORN_Z["footwear"], }}
                className="pointer-events-none absolute object-contain drop-shadow-md" />
            ))
          : [
              <img key={item.id} data-worn-layer={item.category} src={item.src} alt="" aria-hidden="true" draggable={false}
                style={{ ...WORN_POSITION[item.category], zIndex: WORN_Z[item.category] }}
                className="pointer-events-none absolute object-contain drop-shadow-md" />,
            ])}
    </div>
  );
}

/** Where each worn item sits on the front-facing Monere picture (percent of the frame). */
const WORN_POSITION: Record<string, CSSProperties> = {
  hat: { left: "33%", top: "-2%", width: "30%", height: "16%" },
  glasses: { left: "38%", top: "11.5%", width: "21%", height: "8%" },
  accessory: { left: "40%", top: "27%", width: "16%", height: "12%" },
  footwear: { left: "26%", top: "80%", width: "46%", height: "18%" },
  costume: { left: "28%", top: "26%", width: "40%", height: "36%" },
};
/** One shoe drawn over each foot. */
const FEET: CSSProperties[] = [
  { left: "18%", top: "77%", width: "62%", height: "24%" },
];
const WORN_Z: Record<string, number> = { costume: 3, footwear: 4, accessory: 5, hat: 6, glasses: 7 };

/** Round head-and-shoulders avatar for chat bubbles and the header. */
export function MonereAvatar({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <span className={`relative block shrink-0 overflow-hidden rounded-full border border-primary/40 bg-secondary ${className}`}>
      <MonereFigure gesture="wave" showWorn={false} className="absolute left-1/2 top-0 w-[260%] -translate-x-1/2" />
    </span>
  );
}
