import { useEffect, useState } from "react";
import { Eye, EyeOff, Lock, Puzzle, RotateCcw, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JIGSAW_BONUS, jigsawSolved, jigsawUnlocked, recordJigsaw, shufflePieces, useGame } from "@/lib/game";
import { playChime, playPop } from "@/lib/sound";

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
  const n = size * size;
  // Shuffled after mount so server and first client render match.
  const [order, setOrder] = useState<number[]>(() => Array.from({ length: 9 }, (_, i) => i));
  const [picked, setPicked] = useState<number | null>(null);
  const [preview, setPreview] = useState(false);
  const [done, setDone] = useState(false);
  const [drag, setDrag] = useState<number | null>(null);

  function reset(s: Size = size) {
    setSize(s); setOrder(shufflePieces(s * s)); setPicked(null); setDone(false);
  }
  useEffect(() => { reset(3); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function swap(a: number, b: number) {
    if (done || a === b) return;
    const next = [...order];
    [next[a], next[b]] = [next[b]!, next[a]!];
    setOrder(next); setPicked(null); playPop();
    if (jigsawSolved(next)) { setDone(true); recordJigsaw(size); playChime("win"); }
  }

  function tap(i: number) {
    if (done) return;
    if (picked === null) setPicked(i);
    else swap(picked, i);
  }

  const placed = order.filter((p, i) => p === i).length;

  return (
    <section className="surface-card mt-6 p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><Puzzle className="h-5 w-5 text-primary" />Monere's Jigsaw</h2>
        <div className="flex gap-1">
          {LEVELS.map(({ size: s, label }) => {
            const locked = !jigsawUnlocked(s, game);
            return (
              <button key={s} disabled={locked} onClick={() => reset(s)} title={locked ? `Finish the previous puzzle to unlock ${label}` : undefined} className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${size === s ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"} ${locked ? "opacity-50" : ""}`}>
                {locked && <Lock className="h-3 w-3" />}{label} · {s * s}
              </button>
            );
          })}
        </div>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Tap two pieces to swap them, or drag one onto another. Finish for +{JIGSAW_BONUS} Wisdom Points. Complete a puzzle to unlock the next level.</p>

      <div className="mt-3 flex items-center justify-between rounded-full border border-primary/40 px-4 py-1.5 text-sm font-semibold" aria-live="polite">
        <span>Pieces Placed: <span className="text-primary">{placed} / {n}</span></span>
        <button onClick={() => setPreview((p) => !p)} className="flex items-center gap-1 text-xs text-primary">
          {preview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}{preview ? "Hide Preview" : "Show Preview"}
        </button>
      </div>

      {preview && <img src={IMAGE} alt="Completed puzzle preview" className="mx-auto mt-3 w-1/2 rounded-xl border border-border" />}

      <div className="relative mt-3">
        <div className="grid aspect-[3/2] w-full overflow-hidden rounded-2xl border border-border" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
          {order.slice(0, n).map((p, i) => (
            <button
              key={i}
              aria-label={`Piece ${i + 1}`}
              draggable={!done}
              onDragStart={() => setDrag(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (drag !== null) swap(drag, i); setDrag(null); }}
              onClick={() => tap(i)}
              className={`border border-background/40 transition ${picked === i ? "z-10 ring-4 ring-primary" : ""} ${done ? "border-transparent" : ""}`}
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
            <p className="rounded-full bg-background/90 px-4 py-2 font-display text-lg font-semibold text-primary">🎉 Puzzle complete! +{JIGSAW_BONUS} points</p>
          </div>
        )}
      </div>

      <Button variant="secondary" className="mt-3 w-full rounded-full" onClick={() => reset()}><RotateCcw /> Shuffle / Play Again</Button>
    </section>
  );
}
