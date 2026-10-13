import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { BookmarkPlus, MessageCircleQuestion, Share2, ArrowLeft, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { WisdomCards } from "@/components/WisdomCards";
import { CrisisDialog } from "@/components/CrisisDialog";
import { CategoryPicker, CATEGORIES } from "@/components/CategoryPicker";
import { seekWisdom, type Wisdom } from "@/lib/wisdom.functions";
import { detectCrisis } from "@/lib/crisis";
import { saveEntry } from "@/lib/journal";
import { MonereMentor } from "@/components/MonereMentor";
import { Button } from "@/components/ui/button";

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
  const [category, setCategory] = useState<string>(CATEGORIES[0]?.title ?? "Friendship & Peer Pressure");
  const [situation, setSituation] = useState("");
  const [loading, setLoading] = useState(false);
  const [wisdom, setWisdom] = useState<Wisdom | null>(null);
  const [crisis, setCrisis] = useState(false);
  const [followOpen, setFollowOpen] = useState(false);
  const [followUp, setFollowUp] = useState("");
  const [saved, setSaved] = useState(false);

  async function run(extra?: string) {
    const text = extra ?? situation;
    if (text.trim().length < 3) { toast("Tell us a little about what's going on first."); return; }
    if (detectCrisis(text)) setCrisis(true);
    setLoading(true);
    const res = await ask({
      data: extra
        ? { category, situation, followUp: extra, previous: JSON.stringify(wisdom) }
        : { category, situation },
    }).catch(() => ({ ok: false as const, error: "Couldn't connect. Please try again." }));
    setLoading(false);
    if (!res.ok) { toast.error(res.error); return; }
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
      {loading ? (
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
          <MonereMentor />
          <p className="mt-5 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            What's on your mind?
          </p>
          <CategoryPicker value={category} onChange={setCategory} />
          <div className="surface-card mt-3 p-4 focus-within:border-primary">
            <textarea aria-label="What situation are you facing?" value={situation} onChange={(e) => setSituation(e.target.value)} rows={4} maxLength={3000} placeholder="e.g., My friends want me to gossip about someone, but I feel bad..." className="w-full resize-none bg-transparent leading-relaxed outline-none placeholder:text-muted-foreground" />
          </div>
          <Button onClick={() => run()} disabled={loading} className="btn-gold mt-5 h-auto w-full py-4"><ShieldCheck /> Talk to Monere</Button>
          <p className="mt-3 text-center text-xs text-muted-foreground">AI guidance isn't a replacement for a pastor, parent or counsellor.</p>
        </>
      )}
      <CrisisDialog open={crisis} triggered onClose={() => setCrisis(false)} />
    </AppShell>
  );
}
