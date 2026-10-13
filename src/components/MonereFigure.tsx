import wave from "@/assets/monere-wave.png";
import think from "@/assets/monere-think.png";
import thumbs from "@/assets/monere-thumbs.png";
import listen from "@/assets/monere-listen.png";
import { useOutfit } from "@/lib/outfit";

export type Gesture = "wave" | "think" | "thumbs" | "listen";
const GESTURES: Record<Gesture, string> = { wave, think, thumbs, listen };

/** Monere with a pose for the current moment. All poses stay mounted (preloaded) and cross-fade.
 *  Gesture art exists for the Default Mentor outfit; other outfits keep their own picture. */
export function MonereFigure({ gesture, className = "", alt = "" }: { gesture: Gesture; className?: string; alt?: string }) {
  const { outfit } = useOutfit();
  if (outfit.id !== "default") return <img src={outfit.src} alt={alt} className={`object-contain ${className}`} />;
  return (
    <span className={`relative block ${className}`} role={alt ? "img" : undefined} aria-label={alt || undefined}>
      {(Object.keys(GESTURES) as Gesture[]).map((g) => (
        <img
          key={g}
          src={GESTURES[g]}
          alt=""
          aria-hidden="true"
          decoding="async"
          className={`gesture-frame absolute inset-0 h-full w-full object-contain ${g === gesture ? "gesture-on" : ""}`}
        />
      ))}
    </span>
  );
}
