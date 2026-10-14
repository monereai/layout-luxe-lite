import { Compass, ShieldCheck, Sparkles } from "lucide-react";
import { MonereFigure } from "@/components/MonereFigure";
import { useT } from "@/lib/i18n";
import { useUserName } from "@/lib/username";

export function MonereMentor({ mode = "welcome", portrait = true }: { mode?: "welcome" | "insight" | "results"; portrait?: boolean }) {
  const name = useUserName();
  const t = useT();
  const thinking = mode === "insight";
  return (
    <section className={`mentor-intro text-center ${thinking ? "mentor-thinking" : ""}`} aria-label="Monere, your digital mentor">
      {portrait && <div className="mentor-portrait relative mx-auto">
        <Compass className="mentor-compass absolute left-2 top-9 h-16 w-16 text-primary/15" strokeWidth={0.8} aria-hidden="true" />
        <ShieldCheck className="absolute right-2 top-16 h-10 w-10 text-primary/20" strokeWidth={1} aria-hidden="true" />
        <Sparkles className="mentor-spark absolute bottom-10 left-6 h-6 w-6 text-primary/50" aria-hidden="true" />
        <MonereFigure gesture={thinking ? "think" : mode === "results" ? "thumbs" : "wave"} alt={thinking ? "Monere thinking it over" : "Monere the friendly lion, your mentor"} className="mentor-avatar relative h-full w-full" />
      </div>}
      <p className="mb-2 flex items-center justify-center gap-2 text-xs font-semibold text-primary"><ShieldCheck className="h-3.5 w-3.5" /> {t("motto")}</p>
      <h1 className="font-display text-3xl font-semibold leading-tight">
        {thinking ? t("gathering") : mode === "results" ? t("brave") : name ? t("heyName", { name }) : t("hey")}
      </h1>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
        {thinking ? t("gatheringSub") : mode === "results" ? t("braveSub") : name ? t("welcomeName", { name }) : t("welcome")}
      </p>
      {thinking && <div role="status" aria-label="Gathering insight" className="mt-6 flex justify-center gap-2"><span className="insight-dot" /><span className="insight-dot" /><span className="insight-dot" /></div>}
    </section>
  );
}