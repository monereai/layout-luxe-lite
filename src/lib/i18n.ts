import { useEffect, useState } from "react";

export const LANG_KEY = "monereai-lang";
export const LANGS = [
  { id: "en", flag: "🇬🇧", label: "English", ai: "English" },
  { id: "es", flag: "🇪🇸", label: "Español", ai: "Spanish" },
  { id: "fr", flag: "🇫🇷", label: "Français", ai: "French" },
  { id: "pt", flag: "🇵🇹", label: "Português", ai: "Portuguese" },
  { id: "de", flag: "🇩🇪", label: "Deutsch", ai: "German" },
] as const;
export type Lang = (typeof LANGS)[number]["id"];
export const LANG_IDS = LANGS.map((l) => l.id) as [Lang, ...Lang[]];

const en = {
  seek: "Seek", daily: "Daily", journal: "Journal", game: "Find Monere", jigsaw: "Jigsaw", signIn: "Sign in", signOut: "Sign out", managePlan: "Manage plan", shop: "Points Shop", petShop: "Pet Shop", petShopSub: "Outfits & habitats for Monere",
  tagline: "Guided Wisdom & Decision Integrity for Teens", language: "Language",
  crisisBar: "In crisis or feeling unsafe? Tap for free, confidential 24/7 help.",
  whatsOnMind: "What's on your mind?", placeholder: "e.g., My friends want me to gossip about someone, but I feel bad...",
  includeSong: "🎵 Include a Song Recommendation", talk: "Talk to Monere", freeLeft: "{n} of {max} free chats left today", getPlus: "Get Monere Plus",
  disclaimer: "AI guidance isn't a replacement for a pastor, parent or counsellor.", talkAgain: "Talk to Monere again", back: "Back",
  save: "Save to Reflection Journal", saved: "Saved to Journal", share: "Share anonymously",
  perspective: "Monere's Perspective", wisdom: "Wisdom Anchor", steps: "Steps of Courage", honor: "The Honor Outlook", soundtrack: "Monere's Soundtrack 🎵",
  nextStep: "YOUR NEXT STEP", becoming: "THE PERSON YOU'RE BECOMING", cheer1: "You've got this.", cheer2: "Proud of you for thinking this through.", why: "Why I picked this for you:",
  meet: "Meet Monere, Your AI Mentor 🦁", meetSub: "Hey! I'm here to help you face life's tough choices with wisdom and courage.",
  nameQ: "What should Monere call you?", namePh: "e.g., Alex (or a nickname you like)", getStarted: "Get Started", skip: "Skip", continue: "Continue",
  profileQ: "Are you a Young Man or Young Woman?", profileSub: "This helps Monere shape his guidance to you",
  youngMan: "Young Man", youngWoman: "Young Woman", gotIt: "Got It, Let's Continue",
  heartQ: "What's on your heart lately?", heartSub: "Tap 2–3 topics that feel closest right now.",
  facingQ: "What are you facing today?", facingSub: "Tap an example or write your own.", askMonere: "Ask Monere",
  motto: "Wisdom. Courage. A little lionheartedness.", gathering: "Monere is gathering insight…", gatheringSub: "I'm taking a moment to reflect on scripture and your next steps.",
  brave: "Let's find your brave path.", braveSub: "I'm right here with you. Let's take this one courageous step at a time.",
  hey: "Hey! I'm Monere.", heyName: "Hey {name}! I'm Monere.",
  welcome: "Let's look at whatever you're facing today with some wisdom and courage. No judgment—just a safe space to find the strong path forward.",
  welcomeName: "Glad you're here, {name}. What's on your mind today? Let's look at whatever you're facing with some wisdom and courage.",
  followPh: "Ask Monere a follow-up question...",
  story: "Story", storyTitle: "Story Mode", storySub: "Pick an adventure. Monere narrates a chunk, then you decide what happens next.",
  storyChoose: "Choose your story", storyLoading: "Monere is opening the story…", storyEnd: "The End", storyAgain: "Play again", storyNew: "Pick another story",
};
type Dict = typeof en;

const es: Dict = {
  seek: "Buscar", daily: "Diario", journal: "Diario personal", game: "Encuentra a Monere", jigsaw: "Rompecabezas", signIn: "Entrar", signOut: "Salir", managePlan: "Gestionar plan", shop: "Tienda de puntos", petShop: "Tienda de mascotas", petShopSub: "Ropa y hábitats para Monere",
  tagline: "Sabiduría guiada e integridad para adolescentes", language: "Idioma",
  crisisBar: "¿En crisis o te sientes inseguro? Toca para ayuda gratuita y confidencial 24/7.",
  whatsOnMind: "¿Qué tienes en mente?", placeholder: "p. ej., Mis amigos quieren que hable mal de alguien, pero me siento mal...",
  includeSong: "🎵 Incluir una canción recomendada", talk: "Habla con Monere", freeLeft: "Te quedan {n} de {max} charlas gratis hoy", getPlus: "Obtener Monere Plus",
  disclaimer: "La guía de IA no sustituye a un pastor, padre o consejero.", talkAgain: "Hablar otra vez con Monere", back: "Atrás",
  save: "Guardar en el diario de reflexión", saved: "Guardado en el diario", share: "Compartir de forma anónima",
  perspective: "La perspectiva de Monere", wisdom: "Ancla de sabiduría", steps: "Pasos de valentía", honor: "La visión del honor", soundtrack: "La banda sonora de Monere 🎵",
  nextStep: "TU PRÓXIMO PASO", becoming: "LA PERSONA EN LA QUE TE ESTÁS CONVIRTIENDO", cheer1: "¡Tú puedes!", cheer2: "Orgulloso de ti por pensarlo bien.", why: "Por qué elegí esto para ti:",
  meet: "Conoce a Monere, tu mentor IA 🦁", meetSub: "¡Hola! Estoy aquí para ayudarte a afrontar decisiones difíciles con sabiduría y valentía.",
  nameQ: "¿Cómo quieres que te llame Monere?", namePh: "p. ej., Alex (o un apodo que te guste)", getStarted: "Empezar", skip: "Saltar", continue: "Continuar",
  profileQ: "¿Eres un chico joven o una chica joven?", profileSub: "Esto ayuda a Monere a adaptar sus consejos a ti",
  youngMan: "Chico joven", youngWoman: "Chica joven", gotIt: "Entendido, sigamos",
  heartQ: "¿Qué llevas en el corazón últimamente?", heartSub: "Toca 2–3 temas que sientas más cercanos ahora.",
  facingQ: "¿A qué te enfrentas hoy?", facingSub: "Toca un ejemplo o escribe el tuyo.", askMonere: "Preguntar a Monere",
  motto: "Sabiduría. Valentía. Un poco de corazón de león.", gathering: "Monere está reflexionando…", gatheringSub: "Me tomo un momento para reflexionar sobre la Escritura y tus próximos pasos.",
  brave: "Encontremos tu camino valiente.", braveSub: "Estoy aquí contigo. Vamos paso a paso, con valentía.",
  hey: "¡Hola! Soy Monere.", heyName: "¡Hola {name}! Soy Monere.",
  welcome: "Veamos lo que estás enfrentando hoy con sabiduría y valentía. Sin juicios: solo un espacio seguro para encontrar el camino fuerte.",
  welcomeName: "Me alegra que estés aquí, {name}. ¿Qué tienes en mente hoy? Veamos lo que enfrentas con sabiduría y valentía.",
  followPh: "Hazle a Monere otra pregunta...",
  story: "Historias", storyTitle: "Modo Historia", storySub: "Elige una aventura. Monere narra un trozo y tú decides qué pasa después.",
  storyChoose: "Elige tu historia", storyLoading: "Monere está abriendo la historia…", storyEnd: "Fin", storyAgain: "Jugar otra vez", storyNew: "Elegir otra historia",
};

const fr: Dict = {
  seek: "Chercher", daily: "Quotidien", journal: "Journal", game: "Trouve Monere", jigsaw: "Puzzle", signIn: "Connexion", signOut: "Déconnexion", managePlan: "Gérer l'abonnement", shop: "Boutique de points", petShop: "Boutique d.animaux", petShopSub: "Tenues et habitats pour Monere",
  tagline: "Sagesse guidée et intégrité pour les ados", language: "Langue",
  crisisBar: "En crise ou en danger ? Touche ici pour une aide gratuite et confidentielle 24h/24.",
  whatsOnMind: "Qu'est-ce qui te préoccupe ?", placeholder: "ex. : Mes amis veulent que je critique quelqu'un, mais je me sens mal...",
  includeSong: "🎵 Inclure une chanson recommandée", talk: "Parler à Monere", freeLeft: "Il te reste {n} sur {max} discussions gratuites aujourd'hui", getPlus: "Obtenir Monere Plus",
  disclaimer: "Les conseils de l'IA ne remplacent pas un pasteur, un parent ou un conseiller.", talkAgain: "Reparler à Monere", back: "Retour",
  save: "Enregistrer dans le journal", saved: "Enregistré dans le journal", share: "Partager anonymement",
  perspective: "Le regard de Monere", wisdom: "Ancre de sagesse", steps: "Pas de courage", honor: "La perspective d'honneur", soundtrack: "La bande-son de Monere 🎵",
  nextStep: "TA PROCHAINE ÉTAPE", becoming: "LA PERSONNE QUE TU DEVIENS", cheer1: "Tu vas y arriver.", cheer2: "Fier de toi d'avoir pris le temps d'y réfléchir.", why: "Pourquoi je l'ai choisie pour toi :",
  meet: "Voici Monere, ton mentor IA 🦁", meetSub: "Salut ! Je suis là pour t'aider à faire face aux choix difficiles avec sagesse et courage.",
  nameQ: "Comment Monere doit-il t'appeler ?", namePh: "ex. : Alex (ou un surnom que tu aimes)", getStarted: "Commencer", skip: "Passer", continue: "Continuer",
  profileQ: "Es-tu un jeune homme ou une jeune femme ?", profileSub: "Cela aide Monere à adapter ses conseils",
  youngMan: "Jeune homme", youngWoman: "Jeune femme", gotIt: "Compris, continuons",
  heartQ: "Qu'est-ce qui te touche en ce moment ?", heartSub: "Choisis 2 ou 3 sujets qui te parlent le plus.",
  facingQ: "À quoi fais-tu face aujourd'hui ?", facingSub: "Choisis un exemple ou écris le tien.", askMonere: "Demander à Monere",
  motto: "Sagesse. Courage. Un cœur de lion.", gathering: "Monere réfléchit…", gatheringSub: "Je prends un moment pour méditer l'Écriture et tes prochaines étapes.",
  brave: "Trouvons ton chemin courageux.", braveSub: "Je suis là avec toi. Avançons un pas courageux à la fois.",
  hey: "Salut ! Je suis Monere.", heyName: "Salut {name} ! Je suis Monere.",
  welcome: "Regardons ce que tu vis aujourd'hui avec sagesse et courage. Aucun jugement — juste un espace sûr pour trouver la bonne voie.",
  welcomeName: "Content que tu sois là, {name}. Qu'est-ce qui te préoccupe aujourd'hui ? Regardons ça avec sagesse et courage.",
  followPh: "Pose une autre question à Monere...",
  story: "Histoires", storyTitle: "Mode Histoire", storySub: "Choisis une aventure. Monere raconte un passage, puis tu décides la suite.",
  storyChoose: "Choisis ton histoire", storyLoading: "Monere ouvre l'histoire…", storyEnd: "Fin", storyAgain: "Rejouer", storyNew: "Choisir une autre histoire",
};

const pt: Dict = {
  seek: "Procurar", daily: "Diário", journal: "Diário pessoal", game: "Encontre o Monere", jigsaw: "Quebra-cabeça", signIn: "Entrar", signOut: "Sair", managePlan: "Gerir plano", shop: "Loja de pontos", petShop: "Loja de animais", petShopSub: "Roupa e habitats para o Monere",
  tagline: "Sabedoria guiada e integridade para adolescentes", language: "Idioma",
  crisisBar: "Em crise ou a sentir-te inseguro? Toca para ajuda gratuita e confidencial 24/7.",
  whatsOnMind: "O que tens em mente?", placeholder: "ex.: Os meus amigos querem que eu fale mal de alguém, mas sinto-me mal...",
  includeSong: "🎵 Incluir uma música recomendada", talk: "Falar com o Monere", freeLeft: "Restam {n} de {max} conversas grátis hoje", getPlus: "Obter Monere Plus",
  disclaimer: "A orientação da IA não substitui um pastor, pai ou conselheiro.", talkAgain: "Falar de novo com o Monere", back: "Voltar",
  save: "Guardar no diário de reflexão", saved: "Guardado no diário", share: "Partilhar anonimamente",
  perspective: "A perspetiva do Monere", wisdom: "Âncora de sabedoria", steps: "Passos de coragem", honor: "A visão de honra", soundtrack: "A banda sonora do Monere 🎵",
  nextStep: "O TEU PRÓXIMO PASSO", becoming: "A PESSOA QUE ESTÁS A TORNAR-TE", cheer1: "Tu consegues.", cheer2: "Orgulho em ti por pensares bem nisto.", why: "Porque escolhi isto para ti:",
  meet: "Conhece o Monere, o teu mentor IA 🦁", meetSub: "Olá! Estou aqui para te ajudar a enfrentar escolhas difíceis com sabedoria e coragem.",
  nameQ: "Como queres que o Monere te chame?", namePh: "ex.: Alex (ou uma alcunha de que gostes)", getStarted: "Começar", skip: "Saltar", continue: "Continuar",
  profileQ: "És um rapaz ou uma rapariga?", profileSub: "Isto ajuda o Monere a adaptar a orientação a ti",
  youngMan: "Rapaz", youngWoman: "Rapariga", gotIt: "Entendido, vamos continuar",
  heartQ: "O que tens no coração ultimamente?", heartSub: "Toca em 2–3 temas que sintas mais próximos agora.",
  facingQ: "O que estás a enfrentar hoje?", facingSub: "Toca num exemplo ou escreve o teu.", askMonere: "Perguntar ao Monere",
  motto: "Sabedoria. Coragem. Um pouco de coração de leão.", gathering: "O Monere está a refletir…", gatheringSub: "Estou a refletir nas Escrituras e nos teus próximos passos.",
  brave: "Vamos encontrar o teu caminho corajoso.", braveSub: "Estou aqui contigo. Um passo corajoso de cada vez.",
  hey: "Olá! Sou o Monere.", heyName: "Olá {name}! Sou o Monere.",
  welcome: "Vamos olhar para o que estás a enfrentar hoje com sabedoria e coragem. Sem julgamentos — só um espaço seguro.",
  welcomeName: "Que bom que estás aqui, {name}. O que tens em mente hoje? Vamos olhar para isso com sabedoria e coragem.",
  followPh: "Faz outra pergunta ao Monere...",
  story: "Histórias", storyTitle: "Modo História", storySub: "Escolhe uma aventura. O Monere conta um trecho e tu decides o que acontece a seguir.",
  storyChoose: "Escolhe a tua história", storyLoading: "O Monere está a abrir a história…", storyEnd: "Fim", storyAgain: "Jogar outra vez", storyNew: "Escolher outra história",
};

const de: Dict = {
  seek: "Suchen", daily: "Täglich", journal: "Tagebuch", game: "Finde Monere", jigsaw: "Puzzle", signIn: "Anmelden", signOut: "Abmelden", managePlan: "Abo verwalten", shop: "Punkt-Shop", petShop: "Tier-Shop", petShopSub: "Outfits und Habitate für Monere",
  tagline: "Geführte Weisheit & Entscheidungsintegrität für Teens", language: "Sprache",
  crisisBar: "In einer Krise oder fühlst du dich unsicher? Tippe für kostenlose, vertrauliche Hilfe rund um die Uhr.",
  whatsOnMind: "Was beschäftigt dich?", placeholder: "z. B. Meine Freunde wollen, dass ich über jemanden lästere, aber ich fühle mich schlecht...",
  includeSong: "🎵 Songempfehlung einbeziehen", talk: "Mit Monere sprechen", freeLeft: "Noch {n} von {max} kostenlosen Chats heute", getPlus: "Monere Plus holen",
  disclaimer: "KI-Rat ersetzt keinen Pastor, keine Eltern und keinen Berater.", talkAgain: "Nochmal mit Monere sprechen", back: "Zurück",
  save: "Im Reflexionstagebuch speichern", saved: "Im Tagebuch gespeichert", share: "Anonym teilen",
  perspective: "Moneres Sicht", wisdom: "Anker der Weisheit", steps: "Schritte des Mutes", honor: "Der Ehren-Ausblick", soundtrack: "Moneres Soundtrack 🎵",
  nextStep: "DEIN NÄCHSTER SCHRITT", becoming: "DER MENSCH, DER DU WIRST", cheer1: "Du schaffst das.", cheer2: "Stolz auf dich, dass du das durchdenkst.", why: "Warum ich das für dich ausgesucht habe:",
  meet: "Triff Monere, deinen KI-Mentor 🦁", meetSub: "Hey! Ich helfe dir, schwierige Entscheidungen mit Weisheit und Mut anzugehen.",
  nameQ: "Wie soll Monere dich nennen?", namePh: "z. B. Alex (oder ein Spitzname, den du magst)", getStarted: "Los geht's", skip: "Überspringen", continue: "Weiter",
  profileQ: "Bist du ein junger Mann oder eine junge Frau?", profileSub: "So kann Monere seinen Rat auf dich abstimmen",
  youngMan: "Junger Mann", youngWoman: "Junge Frau", gotIt: "Verstanden, weiter",
  heartQ: "Was liegt dir in letzter Zeit auf dem Herzen?", heartSub: "Tippe 2–3 Themen an, die dir gerade am nächsten sind.",
  facingQ: "Womit hast du heute zu tun?", facingSub: "Tippe ein Beispiel an oder schreib dein eigenes.", askMonere: "Monere fragen",
  motto: "Weisheit. Mut. Ein bisschen Löwenherz.", gathering: "Monere denkt nach…", gatheringSub: "Ich nehme mir einen Moment, um über die Bibel und deine nächsten Schritte nachzudenken.",
  brave: "Finden wir deinen mutigen Weg.", braveSub: "Ich bin für dich da. Ein mutiger Schritt nach dem anderen.",
  hey: "Hey! Ich bin Monere.", heyName: "Hey {name}! Ich bin Monere.",
  welcome: "Lass uns mit Weisheit und Mut anschauen, was dich heute beschäftigt. Kein Urteil — nur ein sicherer Ort.",
  welcomeName: "Schön, dass du da bist, {name}. Was beschäftigt dich heute? Lass es uns mit Weisheit und Mut anschauen.",
  followPh: "Stell Monere eine Folgefrage...",
  story: "Geschichten", storyTitle: "Geschichten-Modus", storySub: "Wähl ein Abenteuer. Monere erzählt einen Abschnitt, dann entscheidest du, wie es weitergeht.",
  storyChoose: "Wähl deine Geschichte", storyLoading: "Monere öffnet die Geschichte…", storyEnd: "Das Ende", storyAgain: "Nochmal spielen", storyNew: "Andere Geschichte wählen",
};

const DICTS: Record<Lang, Dict> = { en, es, fr, pt, de };
const EVENT = "monereai-lang-change";

export function isLang(v: string | null): v is Lang {
  return !!v && (LANG_IDS as string[]).includes(v);
}

export function setLang(lang: Lang) {
  window.localStorage.setItem(LANG_KEY, lang);
  document.documentElement.lang = lang;
  window.dispatchEvent(new Event(EVENT));
}

export function translate(lang: Lang, key: keyof Dict, vars?: Record<string, string | number>) {
  let s = DICTS[lang][key] ?? en[key];
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
  return s;
}

export function useLang(): Lang {
  const [lang, update] = useState<Lang>("en");
  useEffect(() => {
    const read = () => {
      const v = window.localStorage.getItem(LANG_KEY);
      const l = isLang(v) ? v : "en";
      document.documentElement.lang = l;
      update(l);
    };
    read();
    window.addEventListener(EVENT, read);
    window.addEventListener("storage", read);
    return () => { window.removeEventListener(EVENT, read); window.removeEventListener("storage", read); };
  }, []);
  return lang;
}

export function useT() {
  const lang = useLang();
  return (key: keyof Dict, vars?: Record<string, string | number>) => translate(lang, key, vars);
}

export function languageInstruction(lang?: Lang) {
  const l = LANGS.find((x) => x.id === lang);
  if (!l || l.id === "en") return "";
  return `Respond to the user entirely in ${l.ai} (all text fields, greetings, verse text, application, steps, and the song "why"), maintaining Monere's warm, encouraging tone. Keep song titles and artist names in their original form.`;
}


/** Localised Points Shop sign artwork, used as the shop page heading. */
export function signSrc(lang: Lang): string {
  return lang === "en" ? "/shop/sign.webp" : `/shop/sign-${lang}.webp`;
}
