import { MonereFigure } from "@/components/MonereFigure";
import { setUserName } from "@/lib/username";
import { PROFILE_OPTIONS, setProfile, type Profile } from "@/lib/profile";
import { useState } from "react";
import { Lock, HeartHandshake, BookOpen, LifeBuoy, ShieldCheck, UserRound } from "lucide-react";
import { CategoryPicker } from "@/components/CategoryPicker";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { PassCodeLink } from "@/components/PassCodeDialog";

export const ONBOARDED_KEY = "monereai-onboarded";

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

export function OnboardingModal({ onDone }: { onDone: (result: { category: string[]; situation: string | undefined }) => void }) {
  const [step, setStep] = useState(0);
  const t = useT();
  const [topics, setTopics] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [profileInput, setProfileInput] = useState<Profile | undefined>();
  const [sampleCat, setSampleCat] = useState<string | undefined>();

  const finish = (situation?: string) => {
    window.localStorage.setItem(ONBOARDED_KEY, "true");
    if (nameInput.trim()) setUserName(nameInput);
    if (profileInput) setProfile(profileInput);
    onDone({ category: topics.length ? topics : sampleCat ? [sampleCat] : [], situation });
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Welcome to MonereAI" className="fixed inset-0 z-50 flex items-end justify-center bg-background/90 backdrop-blur-sm sm:items-center">
      <div className="surface-card relative flex z-40 max-h-[90dvh] w-full max-w-md flex-col overflow-y-auto overscroll-contain rounded-b-none p-6 sm:rounded-3xl">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex gap-1.5" aria-label={`Step ${step + 1} of 5`}>
            {[0, 1, 2, 3, 4].map((index) => (
              <span key={index} className={`h-1.5 rounded-full transition-all ${index === step ? "w-6 bg-primary" : "w-1.5 bg-muted"}`} />
            ))}
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => finish()} className="h-auto px-1 text-xs text-muted-foreground">{t("skip")}</Button>
        </div>

        {step === 0 && (
          <div className="text-center">
            <MonereFigure gesture="wave" alt="Monere the lion waving hello" className="mentor-avatar mx-auto h-56 w-56" />
            <p className="mx-auto mt-2 w-fit rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary">This week: “Courage starts with one honest step.”</p>
            <h2 className="mt-4 font-display text-2xl font-semibold">{t("meet")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t("meetSub")}</p>
            <label htmlFor="onb-name" className="mt-5 block text-left text-sm font-medium">{t("nameQ")}</label>
            <input id="onb-name" value={nameInput} maxLength={30} onChange={(event) => setNameInput(event.target.value)} placeholder={t("namePh")} className="mt-2 w-full rounded-2xl border border-border bg-input/40 px-4 py-3 text-sm outline-none focus:border-primary" />
            <div className="action-bar mt-5"><Button onClick={() => { if (nameInput.trim()) setUserName(nameInput); setStep(1); }} className="btn-gold h-auto w-full py-4">{t("getStarted")}</Button></div>
          </div>
        )}

        {step === 1 && (
          <div>
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-primary"><UserRound /></span>
            <h2 className="mt-4 font-display text-2xl font-semibold">{t("profileQ")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("profileSub")}.</p>
            <div role="radiogroup" aria-label="Choose your profile" className="mt-5 grid gap-3">
              {PROFILE_OPTIONS.map((option) => (
                <Button
                  key={option.id}
                  type="button"
                  variant="outline"
                  role="radio"
                  aria-checked={profileInput === option.id}
                  onClick={() => setProfileInput(option.id)}
                  className={`h-auto min-w-0 justify-start whitespace-normal rounded-lg p-4 text-left ${profileInput === option.id ? "border-primary bg-primary/10 ring-2 ring-primary" : "border-border"}`}
                >
                  <span><span className="block font-semibold">{option.id === "young-man" ? t("youngMan") : t("youngWoman")}</span><span className="mt-1 block text-xs font-normal leading-relaxed text-muted-foreground">{option.description}</span></span>
                </Button>
              ))}
            </div>
            <div className="action-bar mt-5"><Button disabled={!profileInput} onClick={() => { if (profileInput) setProfile(profileInput); setStep(2); }} className="btn-gold h-auto w-full py-4">{t("continue")}</Button></div>
          </div>
        )}

        {step === 2 && (
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
            <div className="action-bar mt-5"><Button onClick={() => setStep(3)} className="btn-gold h-auto w-full py-4">{t("gotIt")}</Button></div>
            <PassCodeLink className="mx-auto mt-4 block" />
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="font-display text-2xl font-semibold">{t("heartQ")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("heartSub")}</p>
            <CategoryPicker value={topics} onChange={setTopics} />
            <div className="action-bar mt-5"><Button onClick={() => setStep(4)} className="btn-gold h-auto w-full py-4">{t("continue")}</Button></div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 className="font-display text-2xl font-semibold">{t("facingQ")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("facingSub")}</p>
            <div className="mt-4 grid gap-2">
              {SAMPLES.map((sample) => (
                <Button key={sample.text} type="button" variant="outline" onClick={() => { setText(sample.text); setSampleCat(sample.category); }} className={`h-auto min-w-0 justify-start whitespace-normal rounded-lg px-4 py-3 text-left text-sm ${text === sample.text ? "border-primary bg-primary/10" : "border-border"}`}>
                  {sample.text}
                </Button>
              ))}
            </div>
            <textarea aria-label="Your situation" value={text} onChange={(event) => { setText(event.target.value); setSampleCat(undefined); }} rows={3} maxLength={3000} placeholder={t("placeholder")} className="mt-3 w-full resize-none rounded-2xl border border-border bg-transparent p-3 text-sm outline-none focus:border-primary placeholder:text-muted-foreground" />
            <div className="action-bar mt-5"><Button onClick={() => finish(text.trim() || undefined)} className="btn-gold h-auto w-full py-4"><ShieldCheck /> {t("askMonere")}</Button></div>
          </div>
        )}
      </div>
    </div>
  );
}
