const wave = "/monere/monere-wave.webp";
const think = "/monere/monere-think.webp";
const thumbs = "/monere/monere-thumbs.webp";
const listen = "/monere/monere-listen.webp";
import { useOutfit } from "@/lib/outfit";
import { equippedItems, useShop, type ShopItem } from "@/lib/shop";
import { useCharacterFrame } from "@/lib/character-frame";

export type Gesture = "wave" | "think" | "thumbs" | "listen";
const GESTURES: Record<Gesture, string> = { wave, think, thumbs, listen };

/** Accessory placement in a square box, per art type: square pose art vs portrait full-body wardrobe art. */
const PLACE = {
  pose: { hat: { x: 51, y: 13, w: 30 }, glasses: { x: 51, y: 20.5, w: 22 }, costume: { x: 50, y: 30, w: 74 }, footwear: { x: 51, y: 92, w: 26 }, accessory: { x: 51, y: 38, w: 30 } },
  full: { hat: { x: 51, y: 12, w: 21 }, glasses: { x: 51, y: 14.5, w: 16 }, costume: { x: 51, y: 20, w: 66 }, footwear: { x: 51, y: 94, w: 22 }, accessory: { x: 51, y: 30, w: 24 } },
} as const;

/** Per-accessory size (relative to the slot width) and vertical anchor, since the pieces differ in shape. */
const ACC: Record<string, { scale: number; ty: string }> = {
  "bow-tie": { scale: 0.8, ty: "-50%" },
  bandana: { scale: 1, ty: "-25%" },
  "friendship-beads": { scale: 0.9, ty: "-30%" },
  "cozy-scarf": { scale: 1, ty: "-20%" },
  "gold-chain": { scale: 0.9, ty: "-25%" },
  "gold-medal": { scale: 0.75, ty: "-25%" },
};

function Layer({ item, kind }: { item: ShopItem; kind: "pose" | "full" }) {
  const base = PLACE[kind][item.category];
  const adj = item.category === "accessory" ? ACC[item.id] : undefined;
  const p = adj ? { ...base, w: base.w * adj.scale } : base;
  const ty = item.category === "hat" ? "-100%" : item.category === "glasses" ? "-50%" : item.category === "footwear" ? "-100%" : adj ? adj.ty : "0";
  return (
    <div data-equipped-item={item.id} className={`pointer-events-none absolute inset-0 h-full w-full ${item.category === "costume" ? "z-10" : "z-20"}`}>
      <div className="absolute aspect-square" style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${p.w}%`, transform: `translate(-50%, ${ty})` }}>
        <img src={item.src} alt="" aria-hidden="true" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full object-contain" />
      </div>
    </div>
  );
}

/** Monere with a pose for the current moment plus any shop accessories he has equipped.
 *  Gesture art exists for the Default Mentor outfit; other outfits keep their own picture. */
export function MonereFigure({ gesture = "wave", className = "", alt = "" }: { gesture?: Gesture; className?: string; alt?: string }) {
  const { outfit } = useOutfit();
  const items = equippedItems(useShop());
  const frame = useCharacterFrame();
  const kind = outfit.id === "default" ? "pose" : "full";
  return (
    <div style={{ clipPath: "inset(-60% -60% 0 -60%)" }} className={`relative isolate block aspect-square ${className}`} role={alt ? "img" : undefined} aria-label={alt || undefined}>
      {items.filter((i) => i.category === "costume").map((i) => <Layer key={i.id} item={i} kind={kind} />)}
      {kind === "full" ? (
        <img src={outfit.src} alt="" aria-hidden="true" className={`absolute inset-0 h-full w-full object-contain ${frame === 0 ? "opacity-100" : "opacity-0"}`} />
      ) : (
        (Object.keys(GESTURES) as Gesture[]).map((g) => (
          <img
            key={g}
            src={GESTURES[g]}
            alt=""
            aria-hidden="true"
            decoding="async"
            className={`gesture-frame absolute inset-0 h-full w-full object-contain ${g === gesture && frame === 0 ? "gesture-on" : ""}`}
          />
        ))
      )}
      {Array.from({ length: 7 }, (_, index) => index + 1).map((index) => (
        <img key={index} src={`/monere/spin/${index}.webp`} alt="" aria-hidden="true" draggable={false} className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-150 motion-reduce:transition-none ${frame === index ? "opacity-100" : "opacity-0"}`} />
      ))}
      {items.filter((i) => i.category !== "costume").map((i) => <Layer key={i.id} item={i} kind={kind} />)}
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
