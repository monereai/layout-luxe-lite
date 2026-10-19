import { Check } from "lucide-react";
import { PROPERTIES, useProperties } from "@/lib/properties";
import { MonereFigure } from "@/components/MonereFigure";
import { MonereCharacterView } from "@/components/MonereCharacterView";
import { PetCompanion } from "@/components/PetCompanion";
import { usePlan } from "@/hooks/usePlan";
import { canEnterProperty } from "@/lib/properties";
import { SpaceStationPreview } from "@/components/SpaceStationPreview";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Compass, MessageCircle, RotateCcw } from "lucide-react";

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
  interactive = false,
  listening = false,
  backdrop,
  wide = false,
}: {
  value: string[];
  onChange: (titles: string[]) => void;
  actionLabel?: string;
  interactive?: boolean;
  listening?: boolean;
  backdrop?: string;
  wide?: boolean;
}) {
  const toggle = (title: string) => {
    if (value.includes(title)) onChange(value.filter((t) => t !== title));
    else if (value.length < MAX_CATEGORIES) onChange([...value, title]);
  };

  const property = useProperties();
  const { tier } = usePlan();
  const [stationView, setStationView] = useState("topics");
  const [viewKey, setViewKey] = useState(0);
  const station = property.activeProperty === "space-station";
  if (!canEnterProperty(property.activeProperty, tier)) return <SpaceStationPreview />;
  return (
    <div className="mt-3">
      {station && <nav aria-label="Space Station navigation" className="mb-3 flex flex-wrap justify-center gap-2">
        <Button variant={stationView === "topics" ? "default" : "outline"} size="sm" onClick={() => setStationView("topics")}><Compass />Mission topics</Button>
        <Button variant={stationView === "character" ? "default" : "outline"} size="sm" onClick={() => setStationView("character")}><MessageCircle />Monere controls</Button>
      </nav>}
      <div role="group" aria-label={`Which areas of life is this about? Pick up to ${MAX_CATEGORIES}.`} className={`orbit-stage ${wide ? "orbit-wide" : ""}`}>
        <div className="orbit-center">
          {backdrop && property.activeProperty === "treehouse" && (
            <img src={backdrop} alt="" width={640} height={640} className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[160%] w-[160%] max-w-none -translate-x-1/2 -translate-y-1/2 select-none object-contain opacity-60 sm:h-[135%] sm:w-[135%] sm:opacity-50" />
          )}
          {backdrop && PROPERTIES.filter((p) => p.src).map((p) => (
            <img key={p.id} src={p.src ?? ""} alt="" loading="lazy" width={816} height={816} className={`pointer-events-none absolute left-1/2 top-1/2 z-0 h-[110%] w-[110%] max-w-none -translate-x-1/2 -translate-y-1/2 select-none rounded-full object-cover transition-opacity ${property.activeProperty === p.id ? "opacity-100" : "opacity-0"}`} />
          ))}
          <span className="orbit-halo pointer-events-none" aria-hidden="true" />
          <div className="relative z-10 h-full w-full">
            {interactive ? <MonereCharacterView key={viewKey}>
              <MonereFigure gesture={listening ? "listen" : "wave"} alt="Monere the lion" className="relative h-full w-full" />
            </MonereCharacterView> :
            <><MonereFigure gesture={listening ? "listen" : "wave"} className="mentor-avatar relative h-full w-full" /><PetCompanion /></>
            }
          </div>
        </div>
        <div className={`orbit-overlay ${station && stationView === "character" ? "hidden" : ""}`}>
          {CATEGORIES.map(({ title, short, emoji }, i) => {
            const on = value.includes(title);
            const full = !on && value.length >= MAX_CATEGORIES;
            const slot = SLOTS[i] ?? { left: "0%", top: "0%" };
            return (
              <Button variant="ghost"
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
              </Button>
            );
          })}
        </div>
      </div>
      {station && stationView === "character" && <div role="group" aria-label="Space Station character menu" className="mt-3 flex flex-wrap justify-center gap-2">
        <Button variant="outline" onClick={() => setViewKey((key) => key + 1)}><RotateCcw />Reset Monere</Button>
        <Button onClick={() => { setStationView("topics"); toggle("Future, Purpose & Faith"); }}><MessageCircle />Talk about purpose</Button>
      </div>}
      <p aria-live="polite" className={`float-counter mx-auto mt-4 w-fit rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${value.length ? "border-primary/50 bg-primary/15 text-primary" : "border-border bg-card/85 text-foreground"}`}>
        {value.length ? `Selected (${value.length}) — Tap '${actionLabel}'` : `Tap up to ${MAX_CATEGORIES} topics`}
      </p>
    </div>
  );
}
