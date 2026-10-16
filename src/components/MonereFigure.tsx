import { useShop, type ShopState } from "@/lib/shop";
import { SHOP_ITEMS } from "@/lib/shop";
import { useCharacterFrame } from "@/lib/character-frame";

export type Gesture = "wave" | "think" | "thumbs" | "listen";

/** Placement of each layered slot, as % of the square character box (front view). */
const PLACE = {
  footwear: { left: 30, top: 80, width: 40 },
  accessory: { left: 39, top: 24, width: 22 },
  glasses: { left: 36, top: 12, width: 24 },
  hat: { left: 31, top: -2, width: 34 },
} as const;
type Slot = keyof typeof PLACE;
const ORDER: Slot[] = ["footwear", "accessory", "glasses", "hat"];

/** Complete outfit picture as the base, with hat/glasses/extras/shoes layered on top inside the same box. */
export function MonereFigure({ className = "", alt = "" }: { gesture?: Gesture; className?: string; alt?: string; bareBase?: boolean }) {
  const shop: ShopState = useShop();
  const frame = useCharacterFrame();
  const outfit = shop.equipped.outfit ?? "default";
  const front = frame === 0;
  return (
    <div className={`relative isolate block aspect-square ${className}`} role={alt ? "img" : undefined} aria-label={alt || undefined}>
      <img data-character-look={outfit} data-character-frame={frame} src={`/monere/looks/${outfit}/${frame}.webp`} alt="" aria-hidden="true" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full object-contain" />
      {ORDER.map((slot) => {
        const item = SHOP_ITEMS.find((i) => i.id === shop.equipped[slot]);
        if (!item || (!front && slot !== "hat")) return null;
        const p = PLACE[slot];
        return <img key={slot} data-layer={slot} src={item.src} alt="" aria-hidden="true" draggable={false} className="pointer-events-none absolute h-auto object-contain" style={{ left: `${p.left}%`, top: `${p.top}%`, width: `${p.width}%`, zIndex: ORDER.indexOf(slot) + 1 }} />;
      })}
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
