import { Compass, ShieldCheck, Sparkles } from "lucide-react";
import monere from "@/assets/monere-lion.png";

export function MonereMentor({ mode = "welcome" }: { mode?: "welcome" | "insight" | "results" }) {
  const thinking = mode === "insight";
  return (
    <section className={`mentor-intro text-center ${thinking ? "mentor-thinking" : ""}`} aria-label="Monere, your digital mentor">
      <div className="mentor-portrait relative mx-auto">
        <Compass className="mentor-compass absolute left-2 top-9 h-16 w-16 text-primary/15" strokeWidth={0.8} aria-hidden="true" />
        <ShieldCheck className="absolute right-2 top-16 h-10 w-10 text-primary/20" strokeWidth={1} aria-hidden="true" />
        <Sparkles className="mentor-spark absolute bottom-10 left-6 h-6 w-6 text-primary/50" aria-hidden="true" />
        <img src={monere} width={1024} height={1024} fetchPriority="high" alt="Monere the friendly lion in a navy cap and hoodie, offering guidance with his glowing tablet" className="mentor-avatar relative h-full w-full object-contain" />
      </div>
      <p className="mb-2 flex items-center justify-center gap-2 text-xs font-semibold text-primary"><ShieldCheck className="h-3.5 w-3.5" /> Wisdom. Courage. A little lionheartedness.</p>
      <h1 className="font-display text-3xl font-semibold leading-tight">
        {thinking ? "Monere is gathering insight…" : mode === "results" ? "Let's find your brave path." : "Hey! I'm Monere."}
      </h1>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
        {thinking ? "I'm taking a moment to reflect on scripture and your next steps." : mode === "results" ? "I'm right here with you. Let's take this one courageous step at a time." : "Let's look at whatever you're facing today with some wisdom and courage. No judgment—just a safe space to find the strong path forward."}
      </p>
      {thinking && <div role="status" aria-label="Gathering insight" className="mt-6 flex justify-center gap-2"><span className="insight-dot" /><span className="insight-dot" /><span className="insight-dot" /></div>}
    </section>
  );
}