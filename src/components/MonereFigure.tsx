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
  bare: { hat: { x: 51, y: 25, w: 26 }, glasses: { x: 51, y: 23, w: 22 }, costume: { x: 50, y: 37, w: 70 }, footwear: { x: 51, y: 92, w: 26 }, accessory: { x: 51, y: 43, w: 30 } },
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

function Layer({ item, kind }: { item: ShopItem; kind: "pose" | "full" | "bare" }) {
  const base = PLACE[kind][item.category];
  const adj = item.category === "accessory" ? ACC[item.id] : undefined;
  const p = adj ? { ...base, w: base.w * adj.scale } : base;
  const ty = item.category === "hat" ? "-100%" : item.category === "glasses" ? "-50%" : item.category === "footwear" ? "-100%" : adj ? adj.ty : "0";
  const x = p.x - p.w / 2;
  const y = p.y + p.w * parseFloat(ty) / 100;
  return (
    <svg data-equipped-item={item.id} aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" className={`pointer-events-none absolute inset-0 h-full w-full overflow-visible ${item.category === "hat" ? "z-30" : item.category === "costume" ? "z-10" : "z-20"}`}>
      <image href={item.src} x={x} y={y} width={p.w} height={p.w} preserveAspectRatio="xMidYMid meet" className="pointer-events-none" />
    </svg>
  );
}

/** Monere with a pose for the current moment plus any shop accessories he has equipped.
 *  Gesture art exists for the Default Mentor outfit; other outfits keep their own picture. */
export function MonereFigure({ gesture = "wave", className = "", alt = "", bareBase = false }: { gesture?: Gesture; className?: string; alt?: string; bareBase?: boolean }) {
  const { outfit } = useOutfit();
  const items = equippedItems(useShop());
  const frame = useCharacterFrame();
  const kind = bareBase ? "bare" : outfit.id === "default" ? "pose" : "full";
  const costume = items.find((i) => i.category === "costume");
  /** Full pre-drawn picture of Monere wearing the costume, used for the front view. */
  const fullCostume = costume ? `/monere/costumes/${costume.id}.webp` : null;
  const front = frame === 0;
  return (
    <div style={{ clipPath: "inset(-60% -60% 0 -60%)" }} className={`relative isolate block aspect-square ${className}`} role={alt ? "img" : undefined} aria-label={alt || undefined}>
      {costume && !(fullCostume && front) && <Layer key={costume.id} item={costume} kind={kind} />}
      {fullCostume && (
        <img data-full-costume={costume!.id} src={fullCostume} alt="" aria-hidden="true" draggable={false} className={`pointer-events-none absolute inset-0 z-10 h-full w-full object-contain ${bareBase ? "" : "scale-[0.9] translate-y-[8%]"} ${front ? "opacity-100" : "opacity-0"}`} />
      )}
      {bareBase ? Array.from({ length: 8 }, (_, index) => (
        <img key={index} src={`/monere/bare/${index}.webp`} alt="" aria-hidden="true" draggable={false} className={`pointer-events-none absolute inset-0 z-0 h-full w-full object-contain transition-opacity duration-150 motion-reduce:transition-none ${frame === index && !(fullCostume && index === 0) ? "opacity-100" : "opacity-0"}`} />
      )) : kind === "full" ? (
        <img src={outfit.src} alt="" aria-hidden="true" className={`absolute inset-0 h-full w-full object-contain ${front && !fullCostume ? "opacity-100" : "opacity-0"}`} />
      ) : (
        (Object.keys(GESTURES) as Gesture[]).map((g) => (
          <img
            key={g}
            src={GESTURES[g]}
            alt=""
            aria-hidden="true"
            decoding="async"
            className={`gesture-frame absolute inset-0 h-full w-full object-contain ${g === gesture && front && !fullCostume ? "gesture-on" : ""}`}
          />
        ))
      )}
      {!bareBase && Array.from({ length: 7 }, (_, index) => index + 1).map((index) => (
        <img key={index} src={`/monere/spin/${index}.webp`} alt="" aria-hidden="true" draggable={false} className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-150 motion-reduce:transition-none ${frame === index ? "opacity-100" : "opacity-0"}`} />
      ))}
      {items.filter((i) => i.category !== "costume").map((i) => <Layer key={i.id} item={i} kind={fullCostume && front ? "bare" : kind} />)}
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
