import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { MonereFigure } from "@/components/MonereFigure";
import { useLang, useT } from "@/lib/i18n";
import { useProfile } from "@/lib/profile";
import { STORY_THEMES, type StoryThemeId, type StoryTurn } from "@/lib/story";
import { tellStory, type StoryResult } from "@/lib/story.functions";
import { useUserName } from "@/lib/username";

export const Route = createFileRoute("/story")({
  head: () => ({
    meta: [
      { title: "Story Mode — MonereAI" },
      { name: "description", content: "Choose Space Adventure, Mystery Detective, Magical Kingdom or Time Traveler, and let Monere the lion narrate an adventure where you decide what happens next." },
      { property: "og:title", content: "Story Mode — MonereAI" },
      { property: "og:description", content: "An interactive story where Monere the lion narrates and you choose what happens next." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StoryMode,
});

const LETTERS = ["A", "B", "C"];

function StoryMode() {
  const t = useT();
  const lang = useLang();
  const profile = useProfile();
  const userName = useUserName();
  const [theme, setTheme] = useState<StoryThemeId | null>(null);
  const [turns, setTurns] = useState<StoryTurn[]>([]);
  const [current, setCurrent] = useState<StoryResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  async function run(nextTurns: StoryTurn[], picked: StoryThemeId) {
    setBusy(true);
    setError(null);
    const res = await tellStory({
      data: { theme: picked, turns: nextTurns, userName: userName || undefined, profile, lang },
    });
    setBusy(false);
    if (res.ok) {
      setCurrent(res.story);
      return;
    }
    setError(res.error);
  }

  function start(id: StoryThemeId) {
    setTheme(id);
    setTurns([]);
    setCurrent(null);
    void run([], id);
  }

  function choose(label: string) {
    if (!current || !theme) return;
    const next = [...turns, { narration: current.narration, choice: label }];
    setTurns(next);
    setCurrent(null);
    void run(next, theme);
  }

  function reset() {
    setTheme(null);
    setTurns([]);
    setCurrent(null);
    setError(null);
  }

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [current, busy]);

  if (!theme) {
    return (
      <AppShell>
        <header className="mb-6">
          <h1 className="font-display text-3xl font-semibold text-foreground">{t("storyTitle")}</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("storySub")}</p>
        </header>
        <h2 className="mb-3 font-display text-lg font-semibold text-foreground">{t("storyChoose")}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {STORY_THEMES.map((s) => (
            <Button
              key={s.id}
              variant="ghost"
              onClick={() => start(s.id)}
              className="flex h-auto min-h-28 flex-col items-start gap-2 rounded-2xl border border-border bg-card px-5 py-5 text-left transition-colors hover:border-primary/50 hover:bg-primary/5"
            >
              <span className="text-3xl" aria-hidden="true">{s.emoji}</span>
              <span className="font-display text-xl font-semibold text-foreground">{s.name}</span>
              <span className="text-sm leading-relaxed text-muted-foreground">{s.blurb}</span>
            </Button>
          ))}
        </div>
      </AppShell>
    );
  }

  const themeInfo = STORY_THEMES.find((s) => s.id === theme)!;

  return (
    <AppShell>
      <header className="mb-5 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={reset} aria-label={t("storyNew")} title={t("storyNew")} className="text-muted-foreground">
          <ArrowLeft />
        </Button>
        <div className="min-w-0">
          <h1 className="truncate font-display text-2xl font-semibold text-foreground">
            <span aria-hidden="true">{themeInfo.emoji}</span> {themeInfo.name}
          </h1>
          <p className="text-xs text-muted-foreground">{t("storyTitle")}</p>
        </div>
      </header>

      <div className="flex flex-col gap-4">
        {turns.map((turn, i) => (
          <article key={i} className="rounded-2xl border border-border/60 bg-card/60 px-4 py-3">
            <p className="whitespace-pre-line text-[15px] leading-relaxed text-muted-foreground">{turn.narration}</p>
            <p className="mt-2 text-xs font-semibold text-primary">→ {turn.choice}</p>
          </article>
        ))}

        {current && (
          <article className="rounded-2xl border border-primary/30 bg-card px-4 py-4">
            <p className="whitespace-pre-line text-[16px] leading-relaxed text-foreground">{current.narration}</p>
          </article>
        )}

        {busy && (
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-card px-4 py-4">
            <MonereFigure gesture="think" className="h-16 w-16 shrink-0" alt="Monere thinking" />
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> {t("storyLoading")}
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
            <Button variant="link" size="sm" onClick={reset} className="mt-1 h-auto p-0 text-destructive underline">
              {t("storyNew")}
            </Button>
          </div>
        )}

        {current?.isEnding && (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-primary/40 bg-primary/10 px-5 py-7 text-center">
            <MonereFigure gesture="thumbs" className="h-40 w-40" alt="Monere cheering" />
            <p className="font-display text-2xl font-semibold text-primary">{t("storyEnd")}</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button onClick={() => start(theme)} className="rounded-full px-6 py-3 text-base">
                <Sparkles className="mr-2 h-5 w-5" aria-hidden="true" /> {t("storyAgain")}
              </Button>
              <Button variant="outline" onClick={reset} className="rounded-full px-6 py-3 text-base">
                {t("storyNew")}
              </Button>
            </div>
          </div>
        )}

        {!busy && !error && current && !current.isEnding && current.choices.length > 0 && (
          <div className="flex flex-col gap-3">
            {current.choices.map((label, i) => (
              <Button
                key={label}
                variant="ghost"
                onClick={() => choose(label)}
                className="flex h-auto min-h-16 w-full items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4 text-left text-base font-medium text-foreground transition-colors hover:border-primary/60 hover:bg-primary/10"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/10 font-display text-sm font-bold text-primary">
                  {LETTERS[i] ?? i + 1}
                </span>
                <span className="min-w-0 flex-1 leading-snug">{label}</span>
              </Button>
            ))}
          </div>
        )}
        <div ref={endRef} />
      </div>
    </AppShell>
  );
}
