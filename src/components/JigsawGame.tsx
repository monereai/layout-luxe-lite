import { useEffect, useMemo, useRef, useState } from "react";
import { Eye, EyeOff, Lock, Puzzle, RotateCcw, Star, Zap } from "lucide-react";
import { toast as notify } from "sonner";
import { Button } from "@/components/ui/button";
import { jigsawSolved, jigsawUnlocked, lockedSlots, recordJigsaw, shufflePieces, useGame } from "@/lib/game";
import { playChime, playPop } from "@/lib/sound";
import { useCareRound } from "@/hooks/useCare";

const IMAGE = "/find/jungle.webp";
const BURST = [0, 45, 90, 135, 180, 225, 270, 315];
const LEVELS = [
  { size: 3, label: "Easy" },
  { size: 4, label: "Medium" },
  { size: 5, label: "Hard" },
  { size: 6, label: "Crazy Hard" },
] as const;
type Size = (typeof LEVELS)[number]["size"];

export function JigsawGame() {
  const game = useGame();
  const [size, setSize] = useState<Size>(3);
  const [roundKey, setRoundKey] = useState(0);
  const careRound = useCareRound("jigsaw", size, roundKey);
  const moves = useRef<[number, number][]>([]);
  const rewarded = useRef(new Set<number>());
  const n = size * size;
  // Shuffled after mount so server and first client render match.
  const [order, setOrder] = useState<number[]>(() => Array.from({ length: 9 }, (_, i) => i));
  const [picked, setPicked] = useState<number | null>(null);
  const [preview, setPreview] = useState(false);
  const [done, setDone] = useState(false);
  const [drag, setDrag] = useState<number | null>(null);

  function reset(s: Size = size) {
    moves.current = [];
    rewarded.current = new Set();
    setRoundKey((k) => k + 1);
    setSize(s); setOrder(shufflePieces(s * s)); setPicked(null); setDone(false);
  }
  useEffect(() => { reset(3); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (careRound.round) { setOrder(careRound.round.order); moves.current = []; setPicked(null); }
  }, [careRound.round]);

  function swap(a: number, b: number) {
    if (done || a === b || !careRound.canPlay) return;
    const next = [...order];
    const first = next[a]; const second = next[b];
    if (first === undefined || second === undefined) return;
    [next[a], next[b]] = [second, first];
    moves.current.push([a, b]);
    setOrder(next); setPicked(null); playPop();
    // Award +1 Energy the first time each piece lands in its correct slot.
    for (let i = 0; i < next.length; i++) {
      if (next[i] === i && !rewarded.current.has(i)) {
        rewarded.current.add(i);
        void careRound.rewardFind(i).then((state) => {
          if (state) notify.success(
            <span className="flex items-center gap-1.5"><Zap aria-hidden="true" className="h-4 w-4 shrink-0 fill-primary text-primary" /><span>Piece placed! +{state.energyAwarded ?? 0}</span></span>,
            { duration: 2000 },
          );
        }).catch(() => { rewarded.current.delete(i); });
      }
    }
    if (jigsawSolved(next)) { setDone(true); recordJigsaw(size); playChime("win"); void careRound.complete(moves.current); }
  }

  function tap(i: number) {
    if (done || !careRound.canPlay) return;
    if (picked === null) setPicked(i);
    else swap(picked, i);
  }

  const placed = order.filter((p, i) => p === i).length;

  return (
    <section className="surface-card mt-6 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><Puzzle className="h-5 w-5 text-primary" />Monere's Jigsaw</h2>
        <div className="flex flex-wrap gap-1">
          {LEVELS.map(({ size: s, label }) => {
            const locked = !jigsawUnlocked(s, game);
            return (
              <Button variant="outline" key={s} disabled={locked || careRound.pending} onClick={() => reset(s)} title={locked ? `Finish the previous puzzle to unlock ${label}` : undefined} className={`h-auto gap-1 rounded-full px-2.5 py-1 text-xs ${size === s ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"} ${locked ? "opacity-50" : ""}`}>
                {locked && <Lock className="h-3 w-3" />}{label} · {s * s}
              </Button>
            );
          })}
        </div>
      </div>
      {careRound.error && <div className="my-2"><p role="alert" className="text-sm text-muted-foreground">{careRound.error}</p><Button variant="outline" disabled={careRound.pending} onClick={careRound.retry}>{done ? "Retry reward" : "Try again"}</Button></div>}

      <div className="mt-3 flex items-center justify-between rounded-full border border-primary/40 px-4 py-1.5 text-sm font-semibold" aria-live="polite">
        <span>Pieces Placed: <span className="text-primary">{placed} / {n}</span></span>
        <Button variant="ghost" onClick={() => setPreview((p) => !p)} className="h-auto gap-1 p-0 text-xs text-primary">
          {preview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}{preview ? "Hide Preview" : "Show Preview"}
        </Button>
      </div>

      {preview && <img src={IMAGE} alt="Completed puzzle preview" className="mx-auto mt-3 w-1/2 rounded-xl border border-border" />}

      <div className="relative mt-3">
        <div className="grid aspect-[3/2] w-full overflow-hidden rounded-2xl border border-border" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
          {order.slice(0, n).map((p, i) => (
            <Button variant="ghost"
              key={i}
              aria-label={`Piece ${i + 1}`}
              draggable={!done && careRound.canPlay}
              disabled={done || !careRound.canPlay}
              onDragStart={() => setDrag(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (drag !== null) swap(drag, i); setDrag(null); }}
              onClick={() => tap(i)}
              className={`h-full w-full rounded-none border border-background/40 p-0 transition disabled:opacity-100 ${picked === i ? "z-10 ring-4 ring-primary" : ""} ${done ? "border-transparent" : ""}`}
              style={{
                backgroundImage: `url(${IMAGE})`,
                backgroundSize: `${size * 100}% ${size * 100}%`,
                backgroundPosition: `${((p % size) / (size - 1)) * 100}% ${(Math.floor(p / size) / (size - 1)) * 100}%`,
              }}
            />
          ))}
        </div>
        {done && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            {BURST.map((deg) => (
              <Star key={deg} aria-hidden="true" className="absolute h-6 w-6 fill-primary text-primary motion-safe:animate-[star-burst_0.9s_ease-out_forwards]" style={{ "--deg": `${deg}deg` } as React.CSSProperties} />
            ))}
            <p aria-live="polite" className="max-w-full rounded-full bg-background/90 px-4 py-2 text-center font-display text-base font-semibold text-primary">🎉 Puzzle complete! {careRound.pending ? "Saving reward…" : careRound.reward}</p>
          </div>
        )}
      </div>

      <Button variant="secondary" disabled={careRound.pending || (done && !!careRound.error)} className="mt-3 w-full rounded-full" onClick={() => reset()}><RotateCcw /> Shuffle / Play Again</Button>
    </section>
  );
}
