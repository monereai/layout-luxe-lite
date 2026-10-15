import { Link } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { RotateCcw, Trophy, Award } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  COMPLETION_BONUS, GRID_SIZE, MINI_COUNT, POINTS_PER_MINI,
  makeGrid, recordComplete, recordMini, useGame, type Tile,
} from "@/lib/game";
import monere from "@/assets/monere-wave.png";

const SCENES = [
  { id: "jungle", name: "Jungle Camp", obstacles: ["🌳", "🌿", "🪨", "⛺", "🌴", "🍃", "🌲", "🪵"] },
  { id: "school", name: "School Grounds", obstacles: ["🌳", "🚲", "🎒", "🪨", "🏫", "🌷", "📚", "🌲"] },
  { id: "sky", name: "Cloud Hills", obstacles: ["☁️", "🌥️", "🌳", "🪨", "🌫️", "⛰️", "🎈", "🌿"] },
];

const DECOYS = [
  { emoji: "🐒", text: "Oops, just a monkey! Keep searching!" },
  { emoji: "🍂", text: "Just rustling leaves… Keep looking!" },
  { emoji: "🐿️", text: "A cheeky squirrel! Monere's not here." },
];

export const Route = createFileRoute("/find")({
  head: () => ({
    meta: [
      { title: "Where's Monere? — MonereAI" },
      { name: "description", content: "Hunt for 10 Mini-Moneres hidden under bushes, rocks and tents, dodge the decoys, and earn Wisdom Points." },
      { property: "og:title", content: "Where's Monere? — MonereAI" },
      { property: "og:description", content: "Find all 10 hidden Mini-Moneres on a cluttered 8x8 grid and earn Wisdom Points." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FindGame,
});

function chime(final = false) {
  try {
    const ctx = new AudioContext();
    const notes = final ? [523.25, 659.25, 783.99, 1046.5] : [783.99, 1046.5];
    notes.forEach((f, i) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.frequency.value = f; o.type = "triangle";
      const t = ctx.currentTime + i * 0.1;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.18, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + 0.4);
    });
  } catch { /* audio unavailable */ }
}

function FindGame() {
  const game = useGame();
  const [idx, setIdx] = useState(0);
  const scene = SCENES[idx] ?? SCENES[0]!;
  const [grid, setGrid] = useState<Tile[]>(() => makeGrid(8));
  const [open, setOpen] = useState<Set<number>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  const [shake, setShake] = useState<number | null>(null);
  const [won, setWon] = useState(false);

  const found = grid.filter((t, i) => t.kind === "mini" && open.has(i)).length;

  function newRound(next = idx) {
    setIdx(next); setGrid(makeGrid(8)); setOpen(new Set()); setToast(null); setWon(false);
  }

  function tap(i: number) {
    const tile = grid[i];
    if (!tile || won) return;
    if (tile.kind === "empty" && !open.has(i)) {
      setShake(i); setTimeout(() => setShake(null), 350);
      setOpen((s) => new Set(s).add(i));
      return;
    }
    if (open.has(i)) return;
    setOpen((s) => new Set(s).add(i));
    if (tile.kind === "decoy") {
      const d = DECOYS[tile.obstacle % DECOYS.length]!;
      setToast(d.text);
      return;
    }
    recordMini();
    const nowFound = found + 1;
    if (nowFound >= MINI_COUNT) {
      chime(true); recordComplete(); setToast(null); setWon(true);
    } else {
      chime(); setToast(`+${POINTS_PER_MINI} Wisdom Points!`);
    }
  }

  return (
    <AppShell>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Where's Monere?</h1>
          <p className="text-sm text-muted-foreground">Tap the bushes, rocks and tents to find 10 hidden Mini-Moneres.</p>
        </div>
        <div className="shrink-0 text-right text-xs text-muted-foreground">
          <p className="font-bold text-primary"><Trophy className="mr-1 inline h-3.5 w-3.5" />{game.points} Wisdom Points</p>
          <Link to="/shop" className="text-xs font-semibold text-primary hover:underline">Spend points in the Shop →</Link>
          {game.detective && <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 font-bold text-primary-foreground"><Award className="h-3 w-3" />Master Detective</p>}
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        {SCENES.map((s, i) => (
          <button key={s.id} onClick={() => newRound(i)} className={`flex-1 rounded-full border px-2 py-1.5 text-xs ${i === idx ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"}`}>{s.name}</button>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between rounded-full border border-primary/40 bg-primary/10 px-4 py-2" aria-live="polite">
        <p className="text-sm font-semibold text-foreground">Mini-Moneres Found: <span className="text-primary">{found} / {MINI_COUNT}</span></p>
        <div className="flex gap-0.5" aria-hidden="true">
          {Array.from({ length: MINI_COUNT }, (_, i) => (
            <span key={i} className={`h-2 w-2 rounded-full ${i < found ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>
      </div>

      <p className="mt-2 min-h-5 text-center text-sm font-medium text-primary" aria-live="polite">{toast}</p>

      <div
        className="surface-card mx-auto mt-1 grid w-full max-w-xl gap-1 p-2"
        style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }}
      >
        {grid.map((tile, i) => {
          const isOpen = open.has(i);
          const decoy = DECOYS[tile.obstacle % DECOYS.length]!;
          return (
            <button
              key={i}
              onClick={() => tap(i)}
              aria-label={isOpen ? (tile.kind === "mini" ? "Mini-Monere found" : tile.kind === "decoy" ? "Decoy" : "Empty") : `Tile ${i + 1}`}
              className={`relative flex aspect-square items-center justify-center rounded-md text-xl transition-colors sm:text-2xl ${
                isOpen
                  ? tile.kind === "mini" ? "bg-primary/25 ring-2 ring-primary" : tile.kind === "decoy" ? "bg-accent/40" : "bg-muted/30"
                  : "bg-secondary hover:bg-secondary/70"
              } ${shake === i ? "animate-[shake_0.35s]" : ""}`}
            >
              {!isOpen && <span aria-hidden="true">{scene.obstacles[tile.obstacle % scene.obstacles.length]}</span>}
              {isOpen && tile.kind === "mini" && <img src={monere} alt="" draggable={false} className="h-4/5 w-4/5 animate-[bounce_0.6s_ease-out_1] object-contain" />}
              {isOpen && tile.kind === "decoy" && <span aria-hidden="true">{decoy.emoji}</span>}
              {isOpen && tile.kind === "empty" && <span aria-hidden="true" className="text-xs text-muted-foreground">·</span>}
            </button>
          );
        })}
      </div>

      <Button variant="secondary" className="mt-4 w-full rounded-full" onClick={() => newRound()}><RotateCcw /> Shuffle a new grid</Button>

      <Dialog open={won} onOpenChange={(o) => !o && setWon(false)}>
        <DialogContent className="max-w-sm text-center">
          <p className="text-4xl" aria-hidden="true">🎉</p>
          <DialogTitle className="font-display text-2xl">You Found Them All!</DialogTitle>
          <DialogDescription>
            All {MINI_COUNT} Mini-Moneres collected. +{MINI_COUNT * POINTS_PER_MINI} for the finds and a +{COMPLETION_BONUS} completion bonus!
          </DialogDescription>
          <p className="text-sm">"Sharp eyes! Patience and noticing the small things are a big part of wisdom."</p>
          <Button className="btn-gold mt-2 w-full" onClick={() => newRound()}><RotateCcw /> Play again</Button>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
