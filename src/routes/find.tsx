import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Lightbulb, ZoomIn, ZoomOut, RotateCcw, Trophy, Award } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { recordFind, useGame } from "@/lib/game";
import monere from "@/assets/monere-wave.png";
import school from "@/assets/game/school.jpg";
import arcade from "@/assets/game/arcade.jpg";
import jungle from "@/assets/game/jungle.jpg";

const SCENES = [
  { id: "school", name: "School Grounds", src: school, x: 0.6, y: 0.8, hint: "Monere loves a quiet spot near the bushes, not far from the bike racks." },
  { id: "arcade", name: "Arcade", src: arcade, x: 0.06, y: 0.14, hint: "Look up high — he likes to watch the action from above the claw machines." },
  { id: "jungle", name: "Jungle Camp", src: jungle, x: 0.57, y: 0.62, hint: "He's taking a coffee break between the campfire and the river." },
];

export const Route = createFileRoute("/find")({
  head: () => ({
    meta: [
      { title: "Where's Monere? — MonereAI" },
      { name: "description", content: "Find Monere the Lion hidden in busy scenes, earn Wisdom Points, and unlock the Master Detective badge." },
      { property: "og:title", content: "Where's Monere? — MonereAI" },
      { property: "og:description", content: "A hidden-object mini-game: spot Monere the Lion in busy scenes and earn Wisdom Points." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FindGame,
});

function chime() {
  try {
    const ctx = new AudioContext();
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.frequency.value = f; o.type = "triangle";
      const t = ctx.currentTime + i * 0.12;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.2, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
      o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + 0.45);
    });
  } catch { /* audio unavailable */ }
}

function FindGame() {
  const game = useGame();
  const [idx, setIdx] = useState(0);
  const scene = SCENES[idx] ?? SCENES[0]!;
  const [zoom, setZoom] = useState(2);
  const [start, setStart] = useState(() => Date.now());
  const [found, setFound] = useState<null | { secs: number; pts: number }>(null);
  const [hint, setHint] = useState(false);
  const [miss, setMiss] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => { const el = box.current; if (el) { el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2; el.scrollTop = (el.scrollHeight - el.clientHeight) / 2; } }, [idx, zoom]);

  function reset(next = idx) { setIdx(next); setFound(null); setHint(false); setStart(Date.now()); }
  function hit() {
    if (found) return;
    const s = (Date.now() - start) / 1000;
    chime();
    setFound({ secs: Math.round(s), pts: recordFind(scene.id, Math.round(s), hint) });
  }
  function missed() { if (found) return; setMiss(true); setTimeout(() => setMiss(false), 350); }

  return (
    <AppShell>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Where's Monere?</h1>
          <p className="text-sm text-muted-foreground">Spot the lion hiding in the crowd.</p>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <p className="font-bold text-primary"><Trophy className="mr-1 inline h-3.5 w-3.5" />{game.points} Wisdom Points</p>
          {game.detective && <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 font-bold text-primary-foreground"><Award className="h-3 w-3" />Master Detective</p>}
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        {SCENES.map((s, i) => (
          <button key={s.id} onClick={() => reset(i)} className={`flex-1 rounded-full border px-2 py-1.5 text-xs ${i === idx ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"}`}>{s.name}</button>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-end gap-1">
        <Button size="icon" variant="secondary" aria-label="Zoom out" onClick={() => setZoom((z) => Math.max(1, z - 0.5))}><ZoomOut /></Button>
        <Button size="icon" variant="secondary" aria-label="Zoom in" onClick={() => setZoom((z) => Math.min(4, z + 0.5))}><ZoomIn /></Button>
      </div>

      <div ref={box} className={`surface-card relative mt-2 aspect-[4/3] w-full overflow-auto p-0 ${miss ? "animate-[shake_0.35s]" : ""}`} style={{ touchAction: "pan-x pan-y" }}>
        <div className="relative" style={{ width: `${zoom * 100}%` }} onClick={missed}>
          <img src={scene.src} alt={`${scene.name} crowd scene`} width={1536} height={1152} className="block w-full select-none" draggable={false} />
          <button
            aria-label="Monere"
            onClick={(e) => { e.stopPropagation(); hit(); }}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${scene.x * 100}%`, top: `${scene.y * 100}%`, width: "4.5%" }}
          >
            <img src={monere} alt="" draggable={false} className={`w-full ${found ? "animate-bounce drop-shadow-[0_0_12px_hsl(var(--primary))]" : ""}`} />
            {found && <span className="absolute inset-[-60%] animate-ping rounded-full border-4 border-primary" />}
          </button>
          {hint && !found && (
            <span className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full border-2 border-dashed border-primary/70"
              style={{ left: `${(scene.x + 0.05) * 100}%`, top: `${(scene.y - 0.04) * 100}%`, width: "28%", aspectRatio: "1" }} />
          )}
        </div>
      </div>

      {found ? (
        <div className="surface-card mt-4 p-5 text-center">
          <p className="text-3xl">🎉</p>
          <p className="mt-1 font-display text-xl font-semibold">You found Monere!</p>
          <p className="mt-1 text-sm text-muted-foreground">Time: {found.secs}s · +{found.pts} Wisdom Points{game.best[scene.id] !== undefined && ` · Best ${game.best[scene.id]}s`}</p>
          <p className="mt-2 text-sm">"Sharp eyes! Noticing the small things is a big part of wisdom."</p>
          <p className="mt-2 text-xs text-primary">Master Detective badge unlocked in Monere's Wardrobe</p>
          <Button className="btn-gold mt-4 w-full" onClick={() => reset((idx + 1) % SCENES.length)}><RotateCcw /> Next scene</Button>
        </div>
      ) : (
        <>
          <Button variant="secondary" className="mt-4 w-full rounded-full" onClick={() => setHint(true)} disabled={hint}><Lightbulb /> Monere's Hint</Button>
          {hint && <p className="mt-2 text-center text-sm text-muted-foreground">{scene.hint} <span className="text-xs">(hints halve your points)</span></p>}
        </>
      )}
    </AppShell>
  );
}
