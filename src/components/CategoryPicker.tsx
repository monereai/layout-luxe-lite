import { Check } from "lucide-react";
import monere from "@/assets/monere-lion.png";

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

export function CategoryPicker({
  value,
  onChange,
  actionLabel = "Continue",
}: {
  value: string[];
  onChange: (titles: string[]) => void;
  actionLabel?: string;
}) {
  const toggle = (title: string) => {
    if (value.includes(title)) onChange(value.filter((t) => t !== title));
    else if (value.length < MAX_CATEGORIES) onChange([...value, title]);
  };

  return (
    <div className="mt-3">
      <div role="group" aria-label={`Which areas of life is this about? Pick up to ${MAX_CATEGORIES}.`} className="orbit-grid">
        <div className="orbit-center" aria-hidden="true">
          <span className="orbit-halo" />
          <img src={monere} alt="" className="mentor-avatar relative h-full w-full object-contain" />
        </div>
        {CATEGORIES.map(({ title, short, emoji }, i) => {
          const on = value.includes(title);
          const full = !on && value.length >= MAX_CATEGORIES;
          return (
            <button
              key={title}
              type="button"
              aria-pressed={on}
              aria-label={title}
              disabled={full}
              onClick={() => toggle(title)}
              style={{ animationDelay: DRIFT[i]?.delay, animationDuration: DRIFT[i]?.dur }}
              className={`float-tile ${on ? "float-tile-on" : ""}`}
            >
              <span className="text-lg leading-none" aria-hidden="true">{emoji}</span>
              <span className="font-display text-[13px] font-semibold leading-tight">{short}</span>
              {on && <Check className="absolute right-1.5 top-1.5 h-3.5 w-3.5 text-primary" strokeWidth={3} aria-hidden="true" />}
            </button>
          );
        })}
      </div>
      <p aria-live="polite" className={`float-counter mx-auto mt-4 w-fit rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${value.length ? "border-primary/50 bg-primary/15 text-primary" : "border-border text-muted-foreground"}`}>
        {value.length ? `Selected (${value.length}) — Tap '${actionLabel}'` : `Tap up to ${MAX_CATEGORIES} topics`}
      </p>
    </div>
  );
}
