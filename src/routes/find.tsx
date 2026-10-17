import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { RotateCcw, Trophy, Award, Star } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  HINT_COST, MAP_UNLOCK_FINDS, MINI_COUNT,
  allMapsComplete, makeSpots, mapUnlocked, recordHintSpend, recordMystery, recordComplete, recordMini, useGame, type Spot,
} from "@/lib/game";
import { grantMystery, saveShop, useShop, type ShopItem } from "@/lib/shop";
import { playChime, playPop } from "@/lib/sound";
import { usePointsWallet } from "@/hooks/usePointsWallet";
import { useCareRound } from "@/hooks/useCare";
import { toast as notify } from "sonner";

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
  const [roundKey, setRoundKey] = useState(0);
  const careRound = useCareRound("find", 3, roundKey);
  const foundRef = useRef(new Set<number>());
  const findLock = useRef(false);
  const [finding, setFinding] = useState(false);
  const [idx, setIdx] = useState(0);
  const scene = SCENES[idx] ?? { id: "jungle", name: "Jungle Park", src: "/find/jungle.webp" };
  // Spots are shuffled after mount so the server and first client render match.
  const [spots, setSpots] = useState<Spot[]>([]);
  useEffect(() => { setSpots(makeSpots()); }, []);
  const [found, setFound] = useState<Set<number>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  const [won, setWon] = useState(false);
  const shop = useShop();
  const [mystery, setMystery] = useState<ShopItem | null>(null);
  const [hint, setHint] = useState<number | null>(null);

  /** Spend 20 Wisdom Points to pulse a clue ring around one unfound Mini-Monere. */
  function showHint() {
    if (won || hint !== null || !careRound.canPlay) return;
    if (wallet < HINT_COST) {
      setToast(`A hint costs ${HINT_COST} Wisdom Points — complete more rounds first!`);
      return;
    }
    const remaining = spots.map((_, i) => i).filter((i) => !found.has(i));
    if (!remaining.length) return;
    recordHintSpend();
    const chosen = remaining[Math.floor(Math.random() * remaining.length)];
    if (chosen === undefined) return;
    setHint(chosen);
    setTimeout(() => setHint(null), 3500);
  }

  function newRound(next = idx) {
    if (findLock.current) return;
    const destination = SCENES[next];
    const previous = SCENES[next - 1];
    if (!destination) return;
    if (next !== idx && !mapUnlocked(game.finds, previous?.id)) {
      setToast(`Find ${MAP_UNLOCK_FINDS} Mini-Moneres in ${previous?.name} to unlock ${destination.name}!`);
      return;
    }
    foundRef.current = new Set();
    setRoundKey((n) => n + 1);
    setIdx(next); setSpots(makeSpots()); setFound(new Set()); setToast(null); setWon(false); setHint(null);
  }

  async function tap(i: number) {
    if (findLock.current || foundRef.current.has(i) || won || !careRound.canPlay) return;
    findLock.current = true;
    setFinding(true);
    try {
      const state = await careRound.rewardFind(i);
      if (state) notify.success(`Mini-Monere found! +${state.energyAwarded} Energy`, { duration: 2000 });
      else notify("Mini-Monere found! Sign in to earn Energy.", { duration: 2000 });
    } catch {
      notify.error("Couldn't save your Energy. Tap the Mini-Monere to try again.");
      return;
    } finally {
      findLock.current = false;
      setFinding(false);
    }
    const next = new Set(foundRef.current).add(i);
    foundRef.current = next;
    setFound(next);
    playPop();
    recordMini(scene.id);
    if (next.size >= MINI_COUNT) {
      recordComplete(); setToast(null);
      void careRound.complete([...next]);
      const finds = { ...game.finds, [scene.id]: (game.finds[scene.id] ?? 0) + 1 };
      if (!game.mystery && allMapsComplete(finds, SCENES.map((s) => s.id))) {
        const gift = grantMystery(shop);
        if (gift && recordMystery(gift.item.id)) { saveShop(gift.state); setMystery(gift.item); }
      }
      setTimeout(() => { playChime("win"); setWon(true); }, 600);
    } else {
      setToast("Mini-Monere found!");
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

      <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {SCENES.map((s, i) => {
          const open = mapUnlocked(game.finds, SCENES[i - 1]?.id);
          return (
            <Button key={s.id} variant="outline" onClick={() => newRound(i)} className={`h-auto whitespace-normal rounded-full px-2 py-1.5 text-xs ${i === idx ? "border-primary bg-primary/15 text-primary" : open ? "border-border text-muted-foreground" : "border-border text-muted-foreground/50"}`}>{open ? s.name : `🔒 ${s.name}`}</Button>
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

      <div className="mt-2 flex justify-center">
        <Button variant="outline"
          onClick={showHint}
          disabled={!careRound.canPlay || hint !== null || won || found.size >= MINI_COUNT}
          className="rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary transition hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          💡 Monere's Hint — {HINT_COST} points
        </Button>
      </div>

      <p className="mt-2 min-h-5 text-center text-sm font-medium text-primary" aria-live="polite">{toast}</p>
      {careRound.error && !won && <div className="my-2 text-center"><p role="alert" className="text-sm text-muted-foreground">{careRound.error}</p><Button variant="outline" onClick={careRound.retry}>Try again</Button></div>}

      <div className="mt-1 overflow-auto rounded-2xl border border-border">
        <div className="relative w-full min-w-[720px] md:min-w-0">
          <img src={scene.src} alt={`${scene.name} hidden-object scene`} width={1536} height={1024} draggable={false} className="block w-full select-none" />
          {spots.map((s, i) => {
            const isFound = found.has(i);
            return (
              <Button variant="ghost"
                key={`${idx}-${i}`}
                onClick={() => tap(i)}
                disabled={finding || !careRound.canPlay || found.size === MINI_COUNT}
                aria-label={isFound ? "Mini-Monere found" : hint === i ? "Monere's clue points here" : "Hidden spot"}
                className={`absolute h-auto min-h-0 -translate-x-1/2 -translate-y-1/2 rounded-full p-0 hover:bg-transparent disabled:opacity-100 ${isFound ? "ring-2 ring-primary" : ""} ${hint === i ? "ring-4 ring-primary motion-safe:animate-pulse ring-offset-4 ring-offset-background" : ""}`}
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
              </Button>
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
            All {MINI_COUNT} Mini-Moneres collected. {careRound.pending ? "Saving your reward…" : careRound.reward}
          </DialogDescription>
          {careRound.error && <div><p role="alert" className="text-sm text-muted-foreground">{careRound.error}</p><Button variant="outline" disabled={careRound.pending} onClick={careRound.retry}>Retry reward</Button></div>}
          <p className="text-sm">"Sharp eyes! Patience and noticing the small things are a big part of wisdom."</p>
          {mystery && (
            <div className="rounded-2xl border border-primary/40 bg-primary/10 p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-primary">🎁 Mystery reward — every map complete!</p>
              <img src={mystery.src} alt="" className="mx-auto my-2 h-20 w-20 object-contain" />
              <p className="text-sm font-semibold">{mystery.name}</p>
              <p className="text-xs text-muted-foreground">It's yours free and Monere is wearing it now.</p>
            </div>
          )}
          <Button className="btn-gold mt-2 w-full" disabled={careRound.pending || !!careRound.error} onClick={() => newRound()}><RotateCcw /> Play again</Button>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
