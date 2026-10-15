import wave from "@/assets/monere-wave.png";
import think from "@/assets/monere-think.png";
import thumbs from "@/assets/monere-thumbs.png";
import listen from "@/assets/monere-listen.png";
import { useOutfit } from "@/lib/outfit";
import { equippedItems, useShop, type ShopItem } from "@/lib/shop";

export type Gesture = "wave" | "think" | "thumbs" | "listen";
const GESTURES: Record<Gesture, string> = { wave, think, thumbs, listen };

/** Accessory placement in a square box, per art type: square pose art vs portrait full-body wardrobe art. */
const PLACE = {
  pose: { hat: { x: 51, y: 13, w: 36 }, glasses: { x: 51, y: 20.5, w: 22 }, costume: { x: 50, y: 30, w: 92 } },
  full: { hat: { x: 51, y: 8.5, w: 26 }, glasses: { x: 51, y: 14.5, w: 16 }, costume: { x: 51, y: 20, w: 66 } },
} as const;

function Layer({ item, kind }: { item: ShopItem; kind: "pose" | "full" }) {
  const p = PLACE[kind][item.category];
  const ty = item.category === "hat" ? "-100%" : item.category === "glasses" ? "-50%" : "0";
  return (
    <img
      src={item.src}
      alt=""
      aria-hidden="true"
      className="pointer-events-none absolute h-auto"
      style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${p.w}%`, transform: `translate(-50%, ${ty})`, zIndex: item.category === "costume" ? 0 : 2 }}
    />
  );
}

/** Monere with a pose for the current moment plus any shop accessories he has equipped.
 *  Gesture art exists for the Default Mentor outfit; other outfits keep their own picture. */
export function MonereFigure({ gesture = "wave", className = "", alt = "" }: { gesture?: Gesture; className?: string; alt?: string }) {
  const { outfit } = useOutfit();
  const items = equippedItems(useShop());
  const kind = outfit.id === "default" ? "pose" : "full";
  return (
    <span className={`relative isolate block aspect-square ${className}`} role={alt ? "img" : undefined} aria-label={alt || undefined}>
      {items.filter((i) => i.category === "costume").map((i) => <Layer key={i.id} item={i} kind={kind} />)}
      {kind === "full" ? (
        <img src={outfit.src} alt="" aria-hidden="true" className="absolute inset-0 z-[1] h-full w-full object-contain" />
      ) : (
        (Object.keys(GESTURES) as Gesture[]).map((g) => (
          <img
            key={g}
            src={GESTURES[g]}
            alt=""
            aria-hidden="true"
            decoding="async"
            className={`gesture-frame absolute inset-0 z-[1] h-full w-full object-contain ${g === gesture ? "gesture-on" : ""}`}
          />
        ))
      )}
      {items.filter((i) => i.category !== "costume").map((i) => <Layer key={i.id} item={i} kind={kind} />)}
    </span>
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
