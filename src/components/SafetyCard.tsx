import { Phone, MessageSquare, Siren, HeartHandshake, Globe } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { SAFETY, FIND_HELPLINE_URL } from "@/lib/safety";

export function SafetyCard() {
  const s = SAFETY[useLang()];
  return (
    <section className="surface-card border-primary/40 p-6" role="alert">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
        <HeartHandshake className="h-4 w-4" /> {s.header}
      </div>
      <p className="mt-4 font-display text-xl leading-snug">"{s.message}"</p>
      <p className="mt-2 text-sm text-muted-foreground">{s.signoff}</p>
      <div className="mt-6 grid gap-3">
        {s.lines.map((l, i) => (
          <a key={l.href} href={l.href} className={i === 0 ? "btn-gold flex items-center gap-3 rounded-2xl px-4 py-4 font-semibold" : "crisis-link py-4 font-semibold"}>
            {l.kind === "text" ? <MessageSquare className="h-5 w-5 shrink-0" /> : <Phone className="h-5 w-5 shrink-0" />} {l.label}
          </a>
        ))}
        <a href={s.emergency.href} className="crisis-link py-4 font-semibold"><Siren className="h-5 w-5 shrink-0" /> {s.emergency.label}</a>
        <a href={FIND_HELPLINE_URL} target="_blank" rel="noopener noreferrer" className="crisis-link py-4 font-semibold"><Globe className="h-5 w-5 shrink-0" /> {s.findHelpline}</a>
      </div>
      <p className="mt-5 text-xs text-muted-foreground">{s.footer}</p>
    </section>
  );
}
