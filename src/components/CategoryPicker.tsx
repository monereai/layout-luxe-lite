import { Check } from "lucide-react";
import { PROPERTIES, useProperties } from "@/lib/properties";
import { MonereFigure } from "@/components/MonereFigure";
import { WardrobeButton } from "@/components/Wardrobe";
import { MonereCharacterView } from "@/components/MonereCharacterView";

export type Category = { title: string; short: string; emoji: string };

export const CATEGORIES: Category[] = [
  { emoji: "🤝", short: "Friendship & Peer Pressure", title: "Friendship & Peer Pressure" },
  { emoji: "📚", short: "School & Honesty", title: "School, Exams & Honesty" },
  { emoji: "📱", short: "Social Media & Online", title: "Social Media & Digital Ethics" },
  { emoji: "🏠", short: "Family & Home", title: "Family & Home Life" },
  { emoji: "💬", short: "Dating & Relationships", title: "Dating & Healthy Relationships" },
  { emoji: "🔒", short: "Personal Integrity", title: "Personal Integrity & Truth" },
  { emoji: "💸", short: "Money & First Jobs", title: "Money & First Jobs" },
  { emoji: "🧠", short: "Stress & Well-Being", title: "Mental Well-Being & Stress" },
  { emoji: "🧭", short: "Future, Purpose & Faith", title: "Future, Purpose & Faith" },
];

export const MAX_CATEGORIES = 3;

// Fixed, irregular values so every tile drifts on its own rhythm (no randomness at render → no hydration mismatch).
const DRIFT = [
  { delay: "-0.4s", dur: "5.6s" }, { delay: "-2.1s", dur: "6.4s" }, { delay: "-1.2s", dur: "5.2s" },
  { delay: "-3.3s", dur: "6.9s" }, { delay: "-0.9s", dur: "5.9s" }, { delay: "-2.7s", dur: "6.2s" },
  { delay: "-1.8s", dur: "5.4s" }, { delay: "-3.9s", dur: "6.7s" }, { delay: "-0.2s", dur: "6s" },
];

// Tile slots (% of stage). Kept on the left/right margins and top-right/bottom-left corners so Monere's face and cap stay clear.
const SLOTS: { left?: string; right?: string; top: string }[] = [
  { left: "0%", top: "4%" },
  { right: "0%", top: "2%" },
  { right: "3%", top: "22%" },
  { left: "3%", top: "27%" },
  { right: "0%", top: "44%" },
  { left: "0%", top: "50%" },
  { right: "4%", top: "66%" },
  { left: "5%", top: "73%" },
  { right: "1%", top: "86%" },
];

export function CategoryPicker({
  value,
  onChange,
  actionLabel = "Continue",
  wardrobe = false,
  listening = false,
  backdrop,
}: {
  value: string[];
  onChange: (titles: string[]) => void;
  actionLabel?: string;
  wardrobe?: boolean;
  listening?: boolean;
  backdrop?: string;
}) {
  const toggle = (title: string) => {
    if (value.includes(title)) onChange(value.filter((t) => t !== title));
    else if (value.length < MAX_CATEGORIES) onChange([...value, title]);
  };

  const property = useProperties();
  return (
    <div className="mt-3">
      {wardrobe && <div className="flex justify-end"><WardrobeButton /></div>}
      <div role="group" aria-label={`Which areas of life is this about? Pick up to ${MAX_CATEGORIES}.`} className="orbit-stage">
        <div className="orbit-center">
          {backdrop && property.activeProperty === "treehouse" && (
            <img src={backdrop} alt="" width={640} height={640} className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[135%] w-[135%] max-w-none -translate-x-1/2 -translate-y-1/2 select-none object-contain opacity-20" />
          )}
          {backdrop && PROPERTIES.filter((p) => p.src).map((p) => (
            <img key={p.id} src={p.src!} alt="" loading="lazy" width={816} height={816} style={{ opacity: property.activeProperty === p.id ? 1 : 0, transition: "opacity 0.3s ease" }} className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[110%] w-[110%] max-w-none -translate-x-1/2 -translate-y-1/2 select-none rounded-full object-cover" />
          ))}
          <span className="orbit-halo pointer-events-none" aria-hidden="true" />
          <div className="relative z-10 h-full w-full">
            {wardrobe ? <MonereCharacterView>
              <MonereFigure gesture={listening ? "listen" : "wave"} alt="Monere the lion" className="relative h-full w-full" />
            </MonereCharacterView> :
            <MonereFigure gesture={listening ? "listen" : "wave"} className="mentor-avatar relative h-full w-full" />
            }
          </div>
        </div>
        <div className="orbit-overlay">
          {CATEGORIES.map(({ title, short, emoji }, i) => {
            const on = value.includes(title);
            const full = !on && value.length >= MAX_CATEGORIES;
            const slot = SLOTS[i] ?? SLOTS[0]!;
            return (
              <button
                key={title}
                type="button"
                aria-pressed={on}
                aria-label={title}
                disabled={full}
                onClick={() => toggle(title)}
                style={{ left: slot.left, right: slot.right, top: slot.top, animationDelay: DRIFT[i]?.delay, animationDuration: DRIFT[i]?.dur }}
                className={`float-tile ${on ? "float-tile-on" : ""}`}
              >
                <span className="text-lg leading-none" aria-hidden="true">{emoji}</span>
                <span className="font-display text-[12px] font-semibold leading-tight">{short}</span>
                {on && <Check className="absolute right-1.5 top-1.5 h-3.5 w-3.5 text-primary" strokeWidth={3} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </div>
      <p aria-live="polite" className={`float-counter mx-auto mt-4 w-fit rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${value.length ? "border-primary/50 bg-primary/15 text-primary" : "border-border text-muted-foreground"}`}>
        {value.length ? `Selected (${value.length}) — Tap '${actionLabel}'` : `Tap up to ${MAX_CATEGORIES} topics`}
      </p>
    </div>
  );
}
