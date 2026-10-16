import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RotateCcw, Trophy, Award, Star } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  COMPLETION_BONUS, HINT_COST, MAP_UNLOCK_FINDS, MINI_COUNT, POINTS_PER_MINI,
  allMapsComplete, makeSpots, mapUnlocked, recordHintSpend, recordMystery, recordComplete, recordMini, useGame, type Spot,
} from "@/lib/game";
import { grantMystery, saveShop, useShop, type ShopItem } from "@/lib/shop";
import { playChime, playPop } from "@/lib/sound";
import { usePointsWallet } from "@/hooks/usePointsWallet";

const MINI = "/find/mini.webp";
const SCENES = [
  { id: "jungle", name: "Jungle Park", src: "/find/jungle.webp" },
  { id: "space", name: "Space Station", src: "/find/space.webp" },
  { id: "school", name: "School Grounds", src: "/find/school.webp" },
  { id: "arcade", name: "Retro Arcade", src: "/find/arcade.webp" },
  { id: "beach", name: "Seaside Cove", src: "/find/beach.jpg" },
  { id: "castle", name: "Castle Courtyard", src: "/find/castle.jpg" },
];

export const Route = createFileRoute("/find")({
  head: () => ({
    meta: [
      { title: "Where's Monere? — MonereAI" },
      { name: "description", content: "Search a detailed picture for 10 hidden Mini-Moneres at your own pace and earn Wisdom Points." },
      { property: "og:title", content: "Where's Monere? — MonereAI" },
      { property: "og:description", content: "Spot all 10 Mini-Moneres hidden in the jungle park, space station, school grounds or retro arcade and earn Wisdom Points." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FindGame,
});

const BURST = [0, 60, 120, 180, 240, 300];

function FindGame() {
  const game = useGame();
  const wallet = usePointsWallet();
  const [idx, setIdx] = useState(0);
  const scene = SCENES[idx] ?? SCENES[0]!;
  // Spots are shuffled after mount so the server and first client render match.
  const [spots, setSpots] = useState<Spot[]>([]);
  useEffect(() => { setSpots(makeSpots()); }, []);
  const [found, setFound] = useState<Set<number>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  const [won, setWon] = useState(false);
  const shop = useShop();
  const [mystery, setMystery] = useState<ShopItem | null>(null);

  function newRound(next = idx) {
    if (next !== idx && !mapUnlocked(game.finds, next === 0 ? undefined : SCENES[next - 1]!.id)) {
      setToast(`Find ${MAP_UNLOCK_FINDS} Mini-Moneres in ${SCENES[next - 1]!.name} to unlock ${SCENES[next]!.name}!`);
      return;
    }
    setIdx(next); setSpots(makeSpots()); setFound(new Set()); setToast(null); setWon(false);
  }

  function tap(i: number) {
    if (found.has(i) || won) return;
    const next = new Set(found).add(i);
    setFound(next);
    playPop();
    recordMini(scene.id);
    if (next.size >= MINI_COUNT) {
      recordComplete(); setToast(null);
      const finds = { ...game.finds, [scene.id]: (game.finds[scene.id] ?? 0) + 1 };
      if (!game.mystery && allMapsComplete(finds, SCENES.map((s) => s.id))) {
        const gift = grantMystery(shop);
        if (gift && recordMystery(gift.item.id)) { saveShop(gift.state); setMystery(gift.item); }
      }
      setTimeout(() => { playChime("win"); setWon(true); }, 600);
    } else {
      setToast(`+${POINTS_PER_MINI} Wisdom Points!`);
    }
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Where's Monere?</h1>
          <p className="text-sm text-muted-foreground">Search the picture and tap the 10 tiny Mini-Moneres hidden inside. Pinch or scroll to look closer.</p>
        </div>
        <div className="shrink-0 text-xs text-muted-foreground sm:text-right">
          <p className="font-bold text-primary"><Trophy className="mr-1 inline h-3.5 w-3.5" />{wallet} Wisdom Points</p>
          <Link to="/shop" className="text-xs font-semibold text-primary hover:underline">Spend points in the Shop →</Link>
          {game.detective && <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 font-bold text-primary-foreground"><Award className="h-3 w-3" />Master Detective</p>}
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        {SCENES.map((s, i) => {
          const open = mapUnlocked(game.finds, i === 0 ? undefined : SCENES[i - 1]!.id);
          return (
            <button key={s.id} onClick={() => newRound(i)} className={`flex-1 rounded-full border px-2 py-1.5 text-xs ${i === idx ? "border-primary bg-primary/15 text-primary" : open ? "border-border text-muted-foreground" : "border-border text-muted-foreground/50"}`}>{open ? s.name : `🔒 ${s.name}`}</button>
          );
        })}
      </div>
      <p className="text-center text-xs text-muted-foreground/70">Find {MAP_UNLOCK_FINDS} Mini-Moneres in a map to unlock the next one.</p>

      <div className="sticky top-0 z-40 mt-3 flex items-center justify-between rounded-full border border-primary/40 bg-background/95 px-4 py-2 backdrop-blur" aria-live="polite">
        <p className="text-sm font-semibold text-foreground">Mini-Moneres Found: <span className="text-primary">{found.size} / {MINI_COUNT}</span></p>
        <div className="flex gap-0.5" aria-hidden="true">
          {Array.from({ length: MINI_COUNT }, (_, i) => (
            <span key={i} className={`h-2 w-2 rounded-full ${i < found.size ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>
      </div>

      <p className="mt-2 min-h-5 text-center text-sm font-medium text-primary" aria-live="polite">{toast}</p>

      <div className="mt-1 overflow-auto rounded-2xl border border-border">
        <div className="relative w-full min-w-[720px] md:min-w-0">
          <img src={scene.src} alt={`${scene.name} hidden-object scene`} width={1536} height={1024} draggable={false} className="block w-full select-none" />
          {spots.map((s, i) => {
            const isFound = found.has(i);
            return (
              <button
                key={`${idx}-${i}`}
                onClick={() => tap(i)}
                aria-label={isFound ? "Mini-Monere found" : "Hidden spot"}
                className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full ${isFound ? "ring-2 ring-primary" : ""}`}
                style={{ left: `${s.x}%`, top: `${s.y}%`, width: `${s.size}%` }}
              >
                <img
                  src={MINI}
                  alt=""
                  draggable={false}
                  className={`aspect-square w-full object-contain transition ${isFound ? "scale-125" : "opacity-70 saturate-50"}`}
                  style={{ transform: `rotate(${s.rot}deg)` }}
                />
                {isFound && BURST.map((deg) => (
                  <Star
                    key={deg}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-1/2 top-1/2 h-3 w-3 fill-primary text-primary motion-safe:animate-[star-burst_0.7s_ease-out_forwards]"
                    style={{ "--deg": `${deg}deg` } as React.CSSProperties}
                  />
                ))}
              </button>
            );
          })}
        </div>
      </div>

      <Button variant="secondary" className="mt-4 w-full rounded-full" onClick={() => newRound()}><RotateCcw /> Hide them somewhere new</Button>

      <Dialog open={won} onOpenChange={(o) => !o && setWon(false)}>
        <DialogContent className="max-w-sm text-center">
          <p className="text-4xl" aria-hidden="true">🎉</p>
          <DialogTitle className="font-display text-2xl">You Found Them All!</DialogTitle>
          <DialogDescription>
            All {MINI_COUNT} Mini-Moneres collected. +{MINI_COUNT * POINTS_PER_MINI} for the finds and a +{COMPLETION_BONUS} completion bonus!
          </DialogDescription>
          <p className="text-sm">"Sharp eyes! Patience and noticing the small things are a big part of wisdom."</p>
          {mystery && (
            <div className="rounded-2xl border border-primary/40 bg-primary/10 p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-primary">🎁 Mystery reward — every map complete!</p>
              <img src={mystery.src} alt="" className="mx-auto my-2 h-20 w-20 object-contain" />
              <p className="text-sm font-semibold">{mystery.name}</p>
              <p className="text-xs text-muted-foreground">It's yours free and Monere is wearing it now.</p>
            </div>
          )}
          <Button className="btn-gold mt-2 w-full" onClick={() => newRound()}><RotateCcw /> Play again</Button>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
