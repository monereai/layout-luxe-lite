import {
  Brain,
  Check,
  Compass,
  GraduationCap,
  Handshake,
  House,
  ShieldCheck,
  Smartphone,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type Category = {
  title: string;
  blurb: string;
  icon: LucideIcon;
};

export const CATEGORIES: Category[] = [
  {
    title: "Friendship & Peer Pressure",
    blurb: "Navigating drama, party culture, gossip, and staying true to yourself",
    icon: Users,
  },
  {
    title: "School, Exams & Honesty",
    blurb: "Handling academic pressure, cheating dilemmas, and teacher relations",
    icon: GraduationCap,
  },
  {
    title: "Social Media & Digital Ethics",
    blurb: "Online privacy, screen habits, cyberbullying, and messaging boundaries",
    icon: Smartphone,
  },
  {
    title: "Family & Home Life",
    blurb: "Resolving conflicts with parents/siblings and building mutual trust",
    icon: House,
  },
  {
    title: "Dating & Healthy Relationships",
    blurb: "Boundaries, respect, communication, and relationship ethics",
    icon: Handshake,
  },
  {
    title: "Personal Integrity & Truth",
    blurb: "Doing what is right when no one is watching",
    icon: ShieldCheck,
  },
  {
    title: "Money & First Jobs",
    blurb: "Workplace ethics, spending pressures, and financial stewardship",
    icon: Wallet,
  },
  {
    title: "Mental Well-Being & Stress",
    blurb: "Overcoming burnout, anxiety, performance pressure, and self-care",
    icon: Brain,
  },
  {
    title: "Future, Purpose & Faith",
    blurb: "Exploring big life questions, career paths, and living out your beliefs",
    icon: Compass,
  },
];

export function CategoryPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (title: string) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Which area of life is this about?"
      className="category-scroll mt-3 grid max-h-[24vh] gap-2 overflow-y-auto pr-1 sm:max-h-none sm:grid-cols-2 sm:overflow-visible"
    >
      {CATEGORIES.map(({ title, blurb, icon: Icon }) => {
        const selected = title === value;
        return (
          <button
            key={title}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(title)}
            className={`flex items-start gap-3 rounded-2xl border p-3 text-left transition duration-200 ${
              selected
                ? "border-primary/70 bg-primary/12 shadow-[var(--shadow-gold)]"
                : "border-border bg-secondary/55 hover:border-primary/40 hover:bg-secondary"
            }`}
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
                selected
                  ? "bg-primary text-primary-foreground"
                  : "bg-background/70 text-primary"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span
                  className={`font-display text-[15px] font-semibold leading-snug ${
                    selected ? "text-primary" : "text-foreground"
                  }`}
                >
                  {title}
                </span>
                {selected && (
                  <Check
                    className="ml-auto h-4 w-4 shrink-0 text-primary"
                    strokeWidth={2.5}
                    aria-hidden="true"
                  />
                )}
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                {blurb}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
