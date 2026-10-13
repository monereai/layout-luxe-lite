import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { OnboardingModal, ONBOARDED_KEY } from "@/components/OnboardingModal";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { BookmarkPlus, MessageCircleQuestion, Share2, ArrowLeft, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { WisdomCards } from "@/components/WisdomCards";
import { CrisisDialog } from "@/components/CrisisDialog";
import { CategoryPicker } from "@/components/CategoryPicker";
import { useUserName } from "@/lib/username";
import { seekWisdom, type Wisdom } from "@/lib/wisdom.functions";
import { detectCrisis } from "@/lib/crisis";
import { saveEntry } from "@/lib/journal";
import { MonereMentor } from "@/components/MonereMentor";
import { SafetyCard } from "@/components/SafetyCard";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { PaywallModal } from "@/components/PaywallModal";
import { usePlan } from "@/hooks/usePlan";
import { canAsk, getUsedToday, recordQuery, FREE_DAILY_LIMIT } from "@/lib/usage";

export const Route = createFileRoute("/")({
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
  const ask = useServerFn(seekWisdom);
  const [categories, setCategories] = useState<string[]>([]);
  const category = categories.length ? categories.join(" + ") : "General life question";
  const [situation, setSituation] = useState("");
  const [loading, setLoading] = useState(false);
  const [wisdom, setWisdom] = useState<Wisdom | null>(null);
  const [crisis, setCrisis] = useState(false);
  const [safety, setSafety] = useState(false);
  const [followOpen, setFollowOpen] = useState(false);
  const [followUp, setFollowUp] = useState("");
  const [saved, setSaved] = useState(false);
  const [includeSong, setIncludeSong] = useState(true);
  const userName = useUserName();
  const [listening, setListening] = useState(false);
  const { premium, ready } = usePlan();
  const [paywall, setPaywall] = useState<null | "limit" | "upgrade">(null);
  const [used, setUsed] = useState(0);
  useEffect(() => {
    setUsed(getUsedToday());
    if (new URLSearchParams(window.location.search).get("upgrade") === "1") setPaywall("upgrade");
  }, []);
  const [onboarding, setOnboarding] = useState(false);
  useEffect(() => {
    if (window.localStorage.getItem(ONBOARDED_KEY) !== "true") setOnboarding(true);
  }, []);

  async function run(extra?: string) {
    const text = extra ?? situation;
    if (text.trim().length < 3) { toast("Tell us a little about what's going on first."); return; }
    if (detectCrisis(text)) {
      setWisdom(null); setFollowOpen(false); setSafety(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (ready && !canAsk(getUsedToday(), premium)) { setPaywall("limit"); return; }
    setLoading(true);
    const res = await ask({
      data: extra
        ? { category, situation, followUp: extra, previous: JSON.stringify(wisdom), includeSong, userName: userName || undefined }
        : { category, situation, includeSong, userName: userName || undefined },
    }).catch(() => ({ ok: false as const, error: "Couldn't connect. Please try again." }));
    setLoading(false);
    if (!res.ok) { toast.error(res.error); return; }
    if (!premium) { recordQuery(); setUsed(getUsedToday()); }
    setWisdom(res.wisdom);
    setSaved(false);
    setFollowOpen(false);
    setFollowUp("");
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
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
          <Button variant="ghost" onClick={() => setSafety(false)} className="mb-2 w-fit px-0 text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Back</Button>
          <SafetyCard />
        </>
      ) : loading ? (
        <div className="flex flex-1 flex-col justify-center py-12">
          <MonereMentor mode="insight" />
        </div>
      ) : wisdom ? (
        <>
          <Button variant="ghost" onClick={() => setWisdom(null)} className="mb-2 w-fit px-0 text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Talk to Monere again</Button>
          <MonereMentor mode="results" />
          <p className="mb-5 mt-6 text-xs font-bold uppercase text-primary">{category}</p>
          <WisdomCards w={wisdom} />
          <div className="mt-6 grid gap-2">
            <Button disabled={saved} onClick={() => { saveEntry({ category, situation, wisdom }); setSaved(true); toast.success("Saved to your Reflection Journal"); }} className="btn-gold h-auto whitespace-normal py-3.5 disabled:opacity-60">
              <BookmarkPlus className="h-4 w-4" /> {saved ? "Saved to Journal" : "Save to Reflection Journal"}
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => setFollowOpen((v) => !v)} className="h-auto whitespace-normal rounded-full px-2 py-3"><MessageCircleQuestion /> Ask Monere</Button>
              <Button variant="secondary" onClick={share} className="h-auto whitespace-normal rounded-full px-2 py-3"><Share2 /> Share anonymously</Button>
            </div>
            {followOpen && (
              <div className="surface-card mt-2 p-4">
                <textarea aria-label="Your follow-up for Monere" value={followUp} onChange={(e) => setFollowUp(e.target.value)} rows={3} maxLength={1500} placeholder="e.g., What if they get mad at me for not joining in?" className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
                <Button onClick={() => run(followUp)} className="btn-gold mt-2 h-auto w-full py-2.5">Seek Wisdom</Button>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <MonereMentor portrait={false} />
          <p className="mt-5 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            What's on your mind?
          </p>
          <CategoryPicker value={categories} onChange={setCategories} actionLabel="Talk to Monere" wardrobe listening={listening} />
          <div className="surface-card mt-3 p-4 focus-within:border-primary">
            <textarea aria-label="What situation are you facing?" value={situation} onChange={(e) => setSituation(e.target.value)} onFocus={() => setListening(true)} onBlur={() => setListening(false)} rows={4} maxLength={3000} placeholder="e.g., My friends want me to gossip about someone, but I feel bad..." className="w-full resize-none bg-transparent leading-relaxed outline-none placeholder:text-muted-foreground" />
          </div>
          <label className="surface-card mt-3 flex cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm">
            <span>🎵 Include a Song Recommendation</span>
            <Switch checked={includeSong} onCheckedChange={setIncludeSong} aria-label="Include a Song Recommendation" />
          </label>
          <Button onClick={() => run()} disabled={loading} className="btn-gold mt-4 h-auto w-full py-4"><ShieldCheck /> Talk to Monere</Button>
          {ready && !premium && (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              {Math.max(0, FREE_DAILY_LIMIT - used)} of {FREE_DAILY_LIMIT} free chats left today ·{" "}
              <button onClick={() => setPaywall("upgrade")} className="font-semibold text-primary hover:underline">Get Monere Plus</button>
            </p>
          )}
          <p className="mt-3 text-center text-xs text-muted-foreground">AI guidance isn't a replacement for a pastor, parent or counsellor.</p>
        </>
      )}
      {paywall && <PaywallModal reason={paywall} onClose={() => setPaywall(null)} />}
      <CrisisDialog open={crisis} triggered onClose={() => setCrisis(false)} />
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
