import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { BookmarkPlus, MessageCircleQuestion, Share2, ArrowLeft, Loader2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { WisdomCards } from "@/components/WisdomCards";
import { CrisisDialog } from "@/components/CrisisDialog";
import { seekWisdom, type Wisdom } from "@/lib/wisdom.functions";
import { detectCrisis } from "@/lib/crisis";
import { saveEntry } from "@/lib/journal";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MoralSphere — Faith-grounded advice for teens" },
      { name: "description", content: "Navigate everyday dilemmas with biblical wisdom, grace and practical next steps." },
      { property: "og:title", content: "MoralSphere — Faith-grounded advice for teens" },
      { property: "og:description", content: "Navigate everyday dilemmas with biblical wisdom, grace and practical next steps." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const CATEGORIES = ["Friendship", "School & Honesty", "Social Media / Online", "Family", "Relationships & Dating", "Personal Integrity"];

function Home() {
  const ask = useServerFn(seekWisdom);
  const [category, setCategory] = useState<string>(CATEGORIES[0]!);
  const [situation, setSituation] = useState("");
  const [loading, setLoading] = useState(false);
  const [wisdom, setWisdom] = useState<Wisdom | null>(null);
  const [crisis, setCrisis] = useState(false);
  const [followOpen, setFollowOpen] = useState(false);
  const [followUp, setFollowUp] = useState("");
  const [saved, setSaved] = useState(false);

  async function run(extra?: string) {
    const text = extra ?? situation;
    if (text.trim().length < 3) return toast("Tell us a little about what's going on first.");
    if (detectCrisis(text)) setCrisis(true);
    setLoading(true);
    const res = await ask({
      data: extra
        ? { category, situation, followUp: extra, previous: JSON.stringify(wisdom) }
        : { category, situation },
    }).catch(() => ({ ok: false as const, error: "Couldn't connect. Please try again." }));
    setLoading(false);
    if (!res.ok) return toast.error(res.error);
    setWisdom(res.wisdom);
    setSaved(false);
    setFollowOpen(false);
    setFollowUp("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function share() {
    if (!wisdom) return;
    const text = `A dilemma about ${category.toLowerCase()}:\n\n${wisdom.bigPicture}\n\n"${wisdom.verses[0]?.text}" — ${wisdom.verses[0]?.reference}\n\nvia MoralSphere`;
    if (navigator.share) await navigator.share({ text }).catch(() => {});
    else { await navigator.clipboard.writeText(text); toast.success("Copied — your situation isn't included, only the advice."); }
  }

  return (
    <AppShell>
      {loading ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 py-32 text-center">
          <div className="relative h-20 w-20">
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
            <div className="btn-gold absolute inset-3 animate-pulse" />
          </div>
          <p className="font-display text-xl italic text-muted-foreground">Reflecting on scripture and options…</p>
        </div>
      ) : wisdom ? (
        <>
          <button onClick={() => setWisdom(null)} className="mb-4 flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" /> New situation</button>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{category}</p>
          <h1 className="mb-6 mt-1 font-display text-3xl">Here's some wisdom for you</h1>
          <WisdomCards w={wisdom} />
          <div className="mt-6 grid gap-2">
            <button disabled={saved} onClick={() => { saveEntry({ category, situation, wisdom }); setSaved(true); toast.success("Saved to your Reflection Journal"); }} className="btn-gold flex items-center justify-center gap-2 py-3.5 disabled:opacity-60">
              <BookmarkPlus className="h-4 w-4" /> {saved ? "Saved to Journal" : "Save to Reflection Journal"}
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setFollowOpen((v) => !v)} className="flex items-center justify-center gap-2 rounded-full bg-secondary py-3 text-sm font-semibold"><MessageCircleQuestion className="h-4 w-4" /> Follow-up</button>
              <button onClick={share} className="flex items-center justify-center gap-2 rounded-full bg-secondary py-3 text-sm font-semibold"><Share2 className="h-4 w-4" /> Share anonymously</button>
            </div>
            {followOpen && (
              <div className="surface-card mt-2 p-4">
                <textarea value={followUp} onChange={(e) => setFollowUp(e.target.value)} rows={3} placeholder="e.g., What if they get mad at me for not joining in?" className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
                <button onClick={() => run(followUp)} className="btn-gold mt-2 w-full py-2.5 text-sm">Ask</button>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <p className="text-sm font-semibold text-primary">MoralSphere</p>
          <h1 className="mt-2 font-display text-4xl leading-tight">What situation are you facing?</h1>
          <p className="mt-3 text-muted-foreground">No judgement here. Just honest, grace-filled wisdom for real life.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => setCategory(c)} className={`rounded-full border px-3.5 py-1.5 text-sm transition ${c === category ? "border-primary bg-primary text-primary-foreground" : "border-border bg-secondary text-secondary-foreground"}`}>{c}</button>
            ))}
          </div>
          <div className="surface-card mt-5 p-4 focus-within:border-primary">
            <textarea value={situation} onChange={(e) => setSituation(e.target.value)} rows={6} maxLength={3000} placeholder="e.g., My friends want me to gossip about someone, but I feel bad..." className="w-full resize-none bg-transparent leading-relaxed outline-none placeholder:text-muted-foreground" />
          </div>
          <button onClick={() => run()} disabled={loading} className="btn-gold mt-5 flex w-full items-center justify-center gap-2 py-4">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />} Seek Wisdom & Advice
          </button>
          <p className="mt-3 text-center text-xs text-muted-foreground">AI guidance isn't a replacement for a pastor, parent or counsellor.</p>
        </>
      )}
      <CrisisDialog open={crisis} triggered onClose={() => setCrisis(false)} />
    </AppShell>
  );
}
