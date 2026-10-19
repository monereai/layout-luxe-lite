import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { OnboardingModal, ONBOARDED_KEY } from "@/components/OnboardingModal";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { BookmarkPlus, Share2, ArrowLeft, ShieldCheck, BookHeart } from "lucide-react";
import { FollowUpThread, type ChatMsg } from "@/components/FollowUpThread";
import { followUpChat } from "@/lib/followup.functions";
import { AppShell } from "@/components/AppShell";
import { MonereCare } from "@/components/MonereCare";
import { InstallBanner } from "@/components/InstallBanner";
import { WisdomCards } from "@/components/WisdomCards";
import { CrisisDialog } from "@/components/CrisisDialog";
import { CategoryPicker } from "@/components/CategoryPicker";
import { useUserName } from "@/lib/username";
import { useProfile } from "@/lib/profile";
import { seekWisdom, type Wisdom } from "@/lib/wisdom.functions";
import { detectCrisis } from "@/lib/crisis";
import { saveEntry } from "@/lib/journal";
import { MonereMentor } from "@/components/MonereMentor";
import { Treehouse, TREEHOUSE_BACKDROP } from "@/components/Treehouse";
import { SafetyCard } from "@/components/SafetyCard";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { PassCodeDialog } from "@/components/PassCodeDialog";
import { usePlan } from "@/hooks/usePlan";
import { useT, useLang } from "@/lib/i18n";
import { propertyName, useProperties } from "@/lib/properties";
import { canAsk, getUsedToday, recordQuery, FREE_DAILY_LIMIT } from "@/lib/usage";
import { usePaymentReturn } from "@/hooks/usePaymentReturn";
import { MessageResponse } from "@/components/ai-elements/message";
import { DailyDilemmaModal } from "@/components/DailyDilemmaModal";

export const Route = createFileRoute("/")({
  staticData: { sitemap: true },
  validateSearch: (s: Record<string, unknown>): { dilemma?: number | undefined; [key: string]: unknown } => ({
    ...s,
    dilemma: s["dilemma"] === "1" || s["dilemma"] === 1 ? 1 : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Talk to Monere — MonereAI" },
      { name: "description", content: "Meet Monere, your encouraging lion mentor. Explore teen life decisions with biblical wisdom, courage, healthy boundaries, and grace." },
      { property: "og:title", content: "Talk to Monere — MonereAI" },
      { property: "og:description", content: "Meet Monere, your encouraging lion mentor. Explore teen life decisions with biblical wisdom, courage, healthy boundaries, and grace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});


function Home() {
  usePaymentReturn();
  const { dilemma } = Route.useSearch();
  const navigate = useNavigate();
  const [dilemmaOpen, setDilemmaOpen] = useState(false);
  useEffect(() => { if (dilemma === 1) setDilemmaOpen(true); }, [dilemma]);
  const closeDilemma = () => {
    setDilemmaOpen(false);
    if (dilemma === 1) void navigate({ to: "/", search: (prev) => ({ ...prev, dilemma: undefined }) });
  };
  const ask = useServerFn(seekWisdom);
  const [categories, setCategories] = useState<string[]>([]);
  const category = categories.length ? categories.join(" + ") : "General life question";
  const [situation, setSituation] = useState("");
  const [loading, setLoading] = useState(false);
  const [wisdom, setWisdom] = useState<Wisdom | null>(null);
  const [crisis, setCrisis] = useState(false);
  const [safety, setSafety] = useState(false);
  const reply = useServerFn(followUpChat);
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [chatPending, setChatPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [includeSong, setIncludeSong] = useState(true);
  const userName = useUserName();
  const profile = useProfile();
  const habitat = propertyName(useProperties().activeProperty);
  const t = useT();
  const lang = useLang();
  const [listening, setListening] = useState(false);
  const { premium, ready, user } = usePlan();
  const [paywall, setPaywall] = useState<null | "limit" | "upgrade">(null);
  const [used, setUsed] = useState(0);
  useEffect(() => {
    setUsed(getUsedToday());
  }, []);
  const [onboarding, setOnboarding] = useState(false);
  useEffect(() => {
    if (window.localStorage.getItem(ONBOARDED_KEY) !== "true") setOnboarding(true);
  }, []);

  async function run() {
    const text = situation;
    if (text.trim().length < 3) { toast("Tell us a little about what's going on first."); return; }
    if (detectCrisis(text)) {
      setWisdom(null); setSafety(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (ready && !canAsk(getUsedToday(), premium)) { setPaywall("limit"); return; }
    if (!user) { toast("Please sign in to talk with Monere."); return; }
    setLoading(true);
    const res = await ask({
      data: { category, situation, includeSong, userName: userName || undefined, profile, lang },
    }).catch(() => ({ ok: false as const, error: "Couldn't connect. Please try again." }));
    setLoading(false);
    if (!res.ok) { toast.error(res.error); return; }
    if (!premium && !res.wisdom.personalReply) { recordQuery(); setUsed(getUsedToday()); }
    setWisdom(res.wisdom);
    setChat([]);
    setSaved(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  async function sendFollowUp(q: string) {
    if (!wisdom) return;
    if (detectCrisis(q)) {
      setWisdom(null); setChat([]); setSafety(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const history: ChatMsg[] = [...chat, { role: "user", content: q }];
    setChat(history);
    setChatPending(true);
    const res = await reply({
      data: { category, situation, advice: JSON.stringify(wisdom), userName: userName || undefined, profile, lang, history },
    }).catch(() => ({ ok: false as const, error: "Couldn't connect. Please try again." }));
    setChatPending(false);
    if (!res.ok) { toast.error(res.error); setChat(chat); return; }
    setChat([...history, { role: "assistant", content: res.reply }]);
  }

  async function share() {
    if (!wisdom) return;
    const text = `A dilemma about ${category.toLowerCase()}:\n\n${wisdom.bigPicture}\n\n"${wisdom.verses[0]?.text}" — ${wisdom.verses[0]?.reference}\n\nvia MonereAI — https://MonereAI.com`;
    if (navigator.share) await navigator.share({ text }).catch(() => {});
    else { await navigator.clipboard.writeText(text); toast.success("Copied — your situation isn't included, only the advice."); }
  }

  return (
    <AppShell>
      {safety ? (
        <>
          <Button variant="ghost" onClick={() => setSafety(false)} className="mb-2 w-fit px-0 text-muted-foreground"><ArrowLeft className="h-4 w-4" /> {t("back")}</Button>
          <SafetyCard />
        </>
      ) : loading ? (
        <div className="flex flex-1 flex-col justify-center py-12">
          <MonereMentor mode="insight" />
        </div>
      ) : wisdom ? (
        <>
          <Button variant="ghost" onClick={() => setWisdom(null)} className="mb-2 w-fit px-0 text-muted-foreground"><ArrowLeft className="h-4 w-4" /> {t("talkAgain")}</Button>
          <MonereMentor mode="results" />
          {wisdom.personalReply ? (
            <div className="surface-card mt-6 p-5">
              <p className="text-xs font-bold uppercase text-primary">Monere</p>
              <MessageResponse mode="static" className="font-body mt-2 leading-relaxed">{wisdom.personalReply}</MessageResponse>
            </div>
          ) : (
          <>
          <p className="mb-5 mt-6 text-xs font-bold uppercase text-primary">{category}</p>
          <WisdomCards w={wisdom} />
          </>
          )}
          <div className="mt-6 grid gap-2">
            {!wisdom.personalReply && (
            <Button disabled={saved} onClick={() => { saveEntry({ category, situation, wisdom }); setSaved(true); toast.success("Saved to your Reflection Journal"); }} className="btn-gold h-auto whitespace-normal py-3.5 disabled:opacity-60">
              <BookmarkPlus className="h-4 w-4" /> {saved ? t("saved") : t("save")}
            </Button>
            )}
            {!wisdom.personalReply && <Button variant="secondary" onClick={share} className="h-auto whitespace-normal rounded-full px-2 py-3"><Share2 /> {t("share")}</Button>}
          </div>
          <FollowUpThread messages={chat} pending={chatPending} onSend={sendFollowUp} />
        </>
      ) : (
        <>
          <div className="mb-4 text-center">
            <p className="mb-2 flex items-center justify-center gap-2 text-xs font-semibold text-primary"><ShieldCheck className="h-3.5 w-3.5" /> {t("motto")}</p>
            <h1 className="font-display text-3xl font-semibold leading-tight drop-shadow-[0_2px_8px_color-mix(in_oklab,var(--background)_80%,transparent)]">{userName ? t("heyName", { name: userName }) : t("hey")}</h1>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground drop-shadow-[0_1px_6px_color-mix(in_oklab,var(--background)_85%,transparent)]">{userName ? t("welcomeName", { name: userName }) : t("welcome")}</p>
          </div>
          <p className="mb-4 text-center font-display text-lg font-semibold text-primary drop-shadow-[0_2px_8px_color-mix(in_oklab,var(--background)_80%,transparent)]">Welcome to the {habitat}! Choose an option to begin.</p>

          <Treehouse>
            <CategoryPicker value={categories} onChange={setCategories} actionLabel={t("talk")} interactive listening={listening} backdrop={TREEHOUSE_BACKDROP} wide />
            <Button variant="secondary" onClick={() => setDilemmaOpen(true)} className="relative z-20 mx-auto mt-4 flex h-auto whitespace-normal py-3"><BookHeart /> {t("dailyDilemma")}</Button>
            <div role="region" aria-label="Chat with Monere" className="relative z-20 mx-auto mt-5 w-full max-w-lg border-t border-border pt-4">
              <label htmlFor="monere-chat" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {t("whatsOnMind")}
              </label>
              <div className="mt-3 rounded-lg border border-input bg-background/90 p-3 focus-within:border-primary">
                <textarea id="monere-chat" aria-label="What situation are you facing?" value={situation} onChange={(e) => setSituation(e.target.value)} onFocus={() => setListening(true)} onBlur={() => setListening(false)} rows={3} maxLength={3000} placeholder={t("placeholder")} className="block w-full resize-none bg-transparent leading-relaxed outline-none placeholder:text-muted-foreground" />
              </div>
              <label className="mt-3 flex cursor-pointer items-center justify-between gap-3 text-sm">
                <span>{t("includeSong")}</span>
                <Switch checked={includeSong} onCheckedChange={setIncludeSong} aria-label="Include a Song Recommendation" />
              </label>
              <Button onClick={() => run()} disabled={loading} className="btn-gold mt-4 h-auto w-full whitespace-normal py-3"><ShieldCheck /> {t("talk")}</Button>
              {ready && !premium && (
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  {t("freeLeft", { n: Math.max(0, FREE_DAILY_LIMIT - used), max: FREE_DAILY_LIMIT })} ·{" "}
                  <Link to="/shop" className="font-semibold text-primary hover:underline">{t("getPlus")}</Link>
                </p>
              )}
              <p className="mt-3 text-center text-xs text-muted-foreground">{t("disclaimer")}</p>
            </div>
          </Treehouse>
          <MonereCare />

        </>
      )}
      {!wisdom && !safety && !onboarding && <InstallBanner />}
      {paywall && <PassCodeDialog message={paywall === "limit" ? "You've reached today's free limit. Enter your youth group or school access code to keep talking with Monere." : undefined} onClose={() => setPaywall(null)} />}
      <CrisisDialog open={crisis} triggered onClose={() => setCrisis(false)} />
      <DailyDilemmaModal open={dilemmaOpen} onOpenChange={(next) => (next ? setDilemmaOpen(true) : closeDilemma())} />
      {onboarding && (
        <OnboardingModal
          onDone={({ category: c, situation: s }) => {
            setOnboarding(false);
            if (c.length) setCategories(c);
            if (s) { setSituation(s); if (detectCrisis(s)) setCrisis(true); }
          }}
        />
      )}
    </AppShell>
  );
}
