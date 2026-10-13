import { BookOpen, Footprints, Hourglass, Eye } from "lucide-react";
import type { ReactNode } from "react";
import type { Wisdom } from "@/lib/wisdom.functions";

function Card({ icon, title, children, delay }: { icon: ReactNode; title: string; children: ReactNode; delay: number }) {
  return (
    <section className="surface-card p-5 animate-in fade-in slide-in-from-bottom-3 fill-mode-both" style={{ animationDelay: `${delay}ms` }}>
      <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">{icon}{title}</div>
      {children}
    </section>
  );
}

export function WisdomCards({ w }: { w: Wisdom }) {
  return (
    <div className="space-y-4">
      <Card icon={<Eye className="h-4 w-4" />} title="The Big Picture" delay={0}>
        <p className="leading-relaxed">{w.bigPicture}</p>
      </Card>
      <Card icon={<BookOpen className="h-4 w-4" />} title="Biblical Reflection" delay={120}>
        <div className="space-y-4">
          {w.verses.map((v) => (
            <div key={v.reference}>
              <blockquote className="font-display text-lg italic leading-snug">"{v.text}"</blockquote>
              <p className="mt-1 text-sm font-semibold text-primary">— {v.reference}</p>
              <p className="mt-2 text-sm text-muted-foreground">{v.application}</p>
            </div>
          ))}
        </div>
      </Card>
      <Card icon={<Footprints className="h-4 w-4" />} title="Grace & Integrity Path" delay={240}>
        <ol className="space-y-3">
          {w.path.map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">{i + 1}</span>
              <span className="text-sm leading-relaxed">{s}</span>
            </li>
          ))}
        </ol>
      </Card>
      <Card icon={<Hourglass className="h-4 w-4" />} title="Short-Term vs. Long-Term" delay={360}>
        <div className="grid gap-3">
          <div className="rounded-xl bg-secondary p-3"><p className="text-xs font-bold text-muted-foreground">NOW</p><p className="mt-1 text-sm">{w.shortTerm}</p></div>
          <div className="rounded-xl bg-accent p-3 text-accent-foreground"><p className="text-xs font-bold">LONG RUN</p><p className="mt-1 text-sm">{w.longTerm}</p></div>
        </div>
      </Card>
    </div>
  );
}
