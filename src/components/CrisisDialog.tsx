import { Phone, MessageSquare, X, HeartHandshake } from "lucide-react";

export function CrisisDialog({ open, onClose, triggered }: { open: boolean; onClose: () => void; triggered?: boolean }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 p-4 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true">
      <div className="surface-card w-full max-w-md p-6 animate-in slide-in-from-bottom-4">
        <div className="flex items-start justify-between">
          <HeartHandshake className="h-8 w-8 text-primary" />
          <button onClick={onClose} aria-label="Close" className="text-muted-foreground"><X className="h-5 w-5" /></button>
        </div>
        <h2 className="mt-3 font-display text-2xl">{triggered ? "You matter. You're not alone." : "Free, confidential help 24/7"}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {triggered
            ? "It sounds like you might be going through something really heavy. Please reach out to someone right now — real people are ready to listen, any time."
            : "If you feel unsafe or overwhelmed, talk to someone trained to help. It's free and private."}
        </p>
        <div className="mt-5 space-y-2">
          <a href="tel:999" className="crisis-link"><Phone className="h-4 w-4" /> Emergency (UK 999 · US 911)</a>
          <a href="tel:116123" className="crisis-link"><Phone className="h-4 w-4" /> Samaritans (UK) · 116 123</a>
          <a href="tel:08001111" className="crisis-link"><Phone className="h-4 w-4" /> Childline (UK) · 0800 1111</a>
          <a href="sms:85258?body=SHOUT" className="crisis-link"><MessageSquare className="h-4 w-4" /> Text SHOUT to 85258 (UK)</a>
          <a href="tel:988" className="crisis-link"><Phone className="h-4 w-4" /> 988 Lifeline (US) · call or text 988</a>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">Elsewhere? Visit findahelpline.com. Please also tell a trusted adult.</p>
      </div>
    </div>
  );
}
