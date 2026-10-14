import { Phone, MessageSquare, X, HeartHandshake, Siren, Globe } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { SAFETY, FIND_HELPLINE_URL } from "@/lib/safety";

export function CrisisDialog({ open, onClose, triggered }: { open: boolean; onClose: () => void; triggered?: boolean }) {
  const s = SAFETY[useLang()];
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 p-4 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true">
      <div className="surface-card w-full max-w-md p-6 animate-in slide-in-from-bottom-4">
        <div className="flex items-start justify-between">
          <HeartHandshake className="h-8 w-8 text-primary" />
          <button onClick={onClose} aria-label="Close" className="text-muted-foreground"><X className="h-5 w-5" /></button>
        </div>
        <h2 className="mt-3 font-display text-2xl">{s.header}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{triggered ? s.message : s.footer}</p>
        <div className="mt-5 space-y-2">
          {s.lines.map((l) => (
            <a key={l.href} href={l.href} className="crisis-link">{l.kind === "text" ? <MessageSquare className="h-4 w-4" /> : <Phone className="h-4 w-4" />} {l.label}</a>
          ))}
          <a href={s.emergency.href} className="crisis-link"><Siren className="h-4 w-4" /> {s.emergency.label}</a>
          <a href={FIND_HELPLINE_URL} target="_blank" rel="noopener noreferrer" className="crisis-link"><Globe className="h-4 w-4" /> {s.findHelpline}</a>
        </div>
      </div>
    </div>
  );
}
