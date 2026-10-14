import type { Lang } from "@/lib/i18n";

export type Helpline = { label: string; href: string; kind: "call" | "text" };
type Safety = { header: string; message: string; signoff: string; emergency: Helpline; lines: Helpline[]; findHelpline: string; footer: string };

const tel = (n: string) => `tel:${n.replace(/\s/g, "")}`;

export const SAFETY: Record<Lang, Safety> = {
  en: {
    header: "Safety & Support",
    message: "Hey, I hear how heavy things feel right now, and your safety is the most important thing. You don't have to carry this alone.",
    signoff: "— Monere",
    lines: [
      { label: "📞 Childline: 0800 1111 (Free 24/7)", href: tel("0800 1111"), kind: "call" },
      { label: "💬 Shout: Text SHOUT to 85258", href: "sms:85258?body=SHOUT", kind: "text" },
    ],
    emergency: { label: "🚨 Emergency: 999 (UK) · 911 (US)", href: tel("999"), kind: "call" },
    findHelpline: "🌍 Find a Helpline in My Country",
    footer: "If you're in immediate danger, call emergency services now. Please also tell a trusted adult — a parent, teacher, or youth leader.",
  },
  es: {
    header: "Seguridad y apoyo",
    message: "Oye, entiendo lo pesado que se siente todo ahora mismo, y tu seguridad es lo más importante. No tienes que cargar con esto solo.",
    signoff: "— Monere",
    lines: [
      { label: "📞 024 · Línea de atención al suicidio (24/7)", href: tel("024"), kind: "call" },
      { label: "📞 116 111 · Ayuda a la Infancia", href: tel("116111"), kind: "call" },
    ],
    emergency: { label: "🚨 Emergencias: 112", href: tel("112"), kind: "call" },
    findHelpline: "🌍 Buscar una línea de ayuda en mi país",
    footer: "Si estás en peligro inmediato, llama ya a emergencias. Cuéntaselo también a un adulto de confianza: un padre, profesor o líder juvenil.",
  },
  fr: {
    header: "Sécurité et soutien",
    message: "Hé, je sens à quel point tout semble lourd en ce moment, et ta sécurité est ce qui compte le plus. Tu n'as pas à porter ça seul.",
    signoff: "— Monere",
    lines: [
      { label: "📞 3114 · Prévention du suicide (24h/24)", href: tel("3114"), kind: "call" },
      { label: "📞 119 · Enfance en danger", href: tel("119"), kind: "call" },
    ],
    emergency: { label: "🚨 Urgences : 112", href: tel("112"), kind: "call" },
    findHelpline: "🌍 Trouver une ligne d'écoute dans mon pays",
    footer: "Si tu es en danger immédiat, appelle les urgences maintenant. Parles-en aussi à un adulte de confiance : un parent, un professeur ou un animateur.",
  },
  pt: {
    header: "Segurança e apoio",
    message: "Ei, eu percebo o quanto tudo parece pesado agora, e a tua segurança é o mais importante. Não tens de carregar isto sozinho.",
    signoff: "— Monere",
    lines: [
      { label: "📞 188 · CVV (Brasil, 24h)", href: tel("188"), kind: "call" },
      { label: "📞 1417 · SOS Voz Amiga (Portugal)", href: tel("1417"), kind: "call" },
    ],
    emergency: { label: "🚨 Emergência: 112 (Portugal) · 192 (Brasil)", href: tel("112"), kind: "call" },
    findHelpline: "🌍 Encontrar uma linha de apoio no meu país",
    footer: "Se estiveres em perigo imediato, liga já para a emergência. Conta também a um adulto de confiança — um pai, professor ou líder de jovens.",
  },
  de: {
    header: "Sicherheit & Unterstützung",
    message: "Hey, ich merke, wie schwer sich gerade alles anfühlt, und deine Sicherheit ist das Wichtigste. Du musst das nicht allein tragen.",
    signoff: "— Monere",
    lines: [{ label: "📞 116 111 · Nummer gegen Kummer", href: tel("116111"), kind: "call" }],
    emergency: { label: "🚨 Notruf: 112", href: tel("112"), kind: "call" },
    findHelpline: "🌍 Hilfe-Hotline in meinem Land finden",
    footer: "Wenn du in akuter Gefahr bist, ruf sofort den Notruf an. Erzähl es bitte auch einer erwachsenen Vertrauensperson — Eltern, Lehrkraft oder Jugendleitung.",
  },
};

export const FIND_HELPLINE_URL = "https://findahelpline.com";
