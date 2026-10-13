import { Phone, MessageSquare, Siren, HeartHandshake } from "lucide-react";

export function SafetyCard() {
  return (
    <section className="surface-card border-primary/40 p-6" role="alert">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
        <HeartHandshake className="h-4 w-4" /> Safety &amp; Support
      </div>
      <p className="mt-4 font-display text-xl leading-snug">
        "Hey, I hear how heavy things feel right now, and your safety is the most important thing. You don't have to carry this alone."
      </p>
      <p className="mt-2 text-sm text-muted-foreground">— Monere</p>
      <div className="mt-6 grid gap-3">
        <a href="tel:08001111" className="btn-gold flex items-center gap-3 rounded-2xl px-4 py-4 font-semibold">
          <Phone className="h-5 w-5" /> 📞 Childline: 0800 1111 (Free 24/7)
        </a>
        <a href="sms:85258?body=SHOUT" className="crisis-link py-4 font-semibold">
          <MessageSquare className="h-5 w-5" /> 💬 Shout: Text SHOUT to 85258
        </a>
        <div className="grid grid-cols-2 gap-3">
          <a href="tel:999" className="crisis-link justify-center py-4 font-semibold"><Siren className="h-5 w-5" /> 🚨 999 (UK)</a>
          <a href="tel:911" className="crisis-link justify-center py-4 font-semibold"><Siren className="h-5 w-5" /> 🚨 911 (US)</a>
        </div>
      </div>
      <p className="mt-5 text-xs text-muted-foreground">If you're in immediate danger, call emergency services now. Please also tell a trusted adult — a parent, teacher, or youth leader.</p>
    </section>
  );
}
