import { useState } from "react";
import { Check, Lock, HeartHandshake, BookOpen, LifeBuoy, ShieldCheck } from "lucide-react";
import lion from "@/assets/monere-lion.png";
import { CategoryPicker } from "@/components/CategoryPicker";
import { Button } from "@/components/ui/button";

export const ONBOARDED_KEY = "monereai-onboarded";

export const ONBOARD_TOPICS = [
  { label: "Friendship", category: "Friendship & Peer Pressure" },
  { label: "School", category: "School, Exams & Honesty" },
  { label: "Social Media", category: "Social Media & Digital Ethics" },
  { label: "Family", category: "Family & Home Life" },
  { label: "Dating", category: "Dating & Healthy Relationships" },
  { label: "Integrity", category: "Personal Integrity & Truth" },
  { label: "Mental Well-Being", category: "Mental Well-Being & Stress" },
  { label: "Faith", category: "Future, Purpose & Faith" },
] as const;

const SAMPLES = [
  { text: "My friends want me to join in gossiping about someone, but it feels wrong.", category: "Friendship & Peer Pressure" },
  { text: "I'm stressed about an exam and tempted to look at someone else's answers.", category: "School, Exams & Honesty" },
  { text: "Scrolling social media makes me compare myself and feel not good enough.", category: "Social Media & Digital Ethics" },
];

const POINTS = [
  { icon: Lock, title: "Private by design", body: "Your reflections stay on your device. No public profile." },
  { icon: HeartHandshake, title: "Zero judgment", body: "A calm space to talk about real stuff — no shame." },
  { icon: BookOpen, title: "Grounded faith wisdom", body: "Practical advice anchored in Scripture and grace." },
  { icon: LifeBuoy, title: "Safety first", body: "Free 24/7 helplines are always one tap away." },
];

export function OnboardingModal({ onDone }: { onDone: (r: { category: string[]; situation: string | undefined }) => void }) {
  const [step, setStep] = useState(0);
  const [topics, setTopics] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [sampleCat, setSampleCat] = useState<string | undefined>();

  const finish = (situation?: string) => {
    window.localStorage.setItem(ONBOARDED_KEY, "true");
    onDone({ category: topics.length ? topics : sampleCat ? [sampleCat] : [], situation });
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Welcome to MonereAI" className="fixed inset-0 z-50 flex items-end justify-center bg-background/90 backdrop-blur-sm sm:items-center">
      <div className="surface-card relative flex max-h-[100dvh] w-full max-w-md flex-col overflow-y-auto rounded-b-none p-6 sm:rounded-3xl">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex gap-1.5" aria-label={`Step ${step + 1} of 4`}>
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-primary" : "w-1.5 bg-muted"}`} />
            ))}
          </div>
          <button onClick={() => finish()} className="text-xs text-muted-foreground hover:text-primary">Skip</button>
        </div>

        {step === 0 && (
          <div className="text-center">
            <img src={lion} alt="Monere the lion in his navy cap" className="mentor-avatar mx-auto h-56 w-56 object-contain" />
            <p className="mx-auto mt-2 w-fit rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary">This week: “Courage starts with one honest step.”</p>
            <h2 className="mt-4 font-display text-2xl font-semibold">Meet Monere, Your AI Mentor 🦁</h2>
            <p className="mt-2 text-sm text-muted-foreground">Hey! I'm here to help you face life's tough choices with wisdom and courage.</p>
            <Button onClick={() => setStep(1)} className="btn-gold mt-6 h-auto w-full py-4">Get Started</Button>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="font-display text-2xl font-semibold">A safe space, always</h2>
            <ul className="mt-5 grid gap-4">
              {POINTS.map(({ icon: Icon, title, body }) => (
                <li key={title} className="flex gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"><Icon className="h-4 w-4" /></span>
                  <div><p className="font-semibold">{title}</p><p className="text-sm text-muted-foreground">{body}</p></div>
                </li>
              ))}
            </ul>
            <Button onClick={() => setStep(2)} className="btn-gold mt-6 h-auto w-full py-4">Got It, Let's Continue</Button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="font-display text-2xl font-semibold">What's on your heart lately?</h2>
            <p className="mt-1 text-sm text-muted-foreground">Tap 2–3 topics that feel closest right now.</p>
            <CategoryPicker value={topics} onChange={setTopics} />
            <Button onClick={() => setStep(3)} className="btn-gold mt-6 h-auto w-full py-4">Continue</Button>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="font-display text-2xl font-semibold">What are you facing today?</h2>
            <p className="mt-1 text-sm text-muted-foreground">Tap an example or write your own.</p>
            <div className="mt-4 grid gap-2">
              {SAMPLES.map((s) => (
                <button key={s.text} onClick={() => { setText(s.text); setSampleCat(s.category); }}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm transition-colors ${text === s.text ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}>
                  {s.text}
                </button>
              ))}
            </div>
            <textarea aria-label="Your situation" value={text} onChange={(e) => { setText(e.target.value); setSampleCat(undefined); }} rows={3} maxLength={3000}
              placeholder="e.g., My friends want me to gossip about someone, but I feel bad..."
              className="mt-3 w-full resize-none rounded-2xl border border-border bg-transparent p-3 text-sm outline-none focus:border-primary placeholder:text-muted-foreground" />
            <Button onClick={() => finish(text.trim() || undefined)} className="btn-gold mt-4 h-auto w-full py-4"><ShieldCheck /> Ask Monere</Button>
          </div>
        )}
      </div>
    </div>
  );
}
