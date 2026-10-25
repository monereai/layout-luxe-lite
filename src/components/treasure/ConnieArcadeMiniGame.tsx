import { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import { ArrowLeft, ArrowRight, DoorOpen, Play, RotateCcw, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TouchDirectionButton, type TouchArrow } from "@/components/ui/touch-direction-button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ARCADE_MAX_MISSES, ARCADE_TICK_MS, ARCADE_WIN_CATCHES, arcadeStep, newArcade, type ArcadeInput } from "@/lib/arcade-game";
import { playSound } from "@/lib/audio";

const FRUIT_ICONS = ["🍎", "🍊", "🍋", "🍇", "🍓"];

/** Isolated browser-only Phaser scene: an 80's neon fruit catcher, no shared world controls or collision state. */
export default function ConnieArcadeMiniGame({ avatar, onComplete, onExit }: {
  avatar: string; onComplete: (trace: ArcadeInput[]) => Promise<void>; onExit: () => void;
}) {
  const [mount, setMount] = useState<HTMLDivElement | null>(null);
  const [snapshot, setSnapshot] = useState(newArcade), [busy, setBusy] = useState(false), [error, setError] = useState<string | null>(null);
  const direction = useRef<ArcadeInput>("idle");
  const callbacks = useRef({ onComplete }); callbacks.current = { onComplete };
  const stopped = useRef(false), trace = useRef<ArcadeInput[]>([]);
  const started = useRef(false);
  const retrySave = useRef<(() => Promise<void>) | null>(null);
  const [ready, setReady] = useState(false), [playing, setPlaying] = useState(false);
  const [round, setRound] = useState(0);
  const start = () => { started.current = true; setPlaying(true); };
  /** Entry notification shown when Monere enters Connie's arcade. */
  const [entryNotice, setEntryNotice] = useState(true);
  useEffect(() => { if (!entryNotice) return; const t = setTimeout(() => setEntryNotice(false), 4500); return () => clearTimeout(t); }, [entryNotice]);
  useEffect(() => {
    if (!mount) return;
    let state = newArcade(), elapsed = 0, alive = true, working = false;
    started.current = false; setReady(false); setPlaying(false);
    trace.current = []; stopped.current = false;
    const css = getComputedStyle(document.documentElement);
    // CSS computed tokens may be oklch; canvas resolves them before Phaser reads RGB.
    const swatch = document.createElement("canvas").getContext("2d");
    const color = (name: string) => { if (!swatch) return 0; swatch.fillStyle = css.getPropertyValue(name).trim(); swatch.fillRect(0, 0, 1, 1); const p = swatch.getImageData(0, 0, 1, 1).data; return ((p[0] ?? 0) << 16) + ((p[1] ?? 0) << 8) + (p[2] ?? 0); };
    async function saveWin() {
      if (working) return;
      working = true; stopped.current = true; setBusy(true); setError(null);
      try { await callbacks.current.onComplete([...trace.current]); }
      catch { if (alive) setError("The prize couldn’t be saved. Please try again."); }
      finally { working = false; if (alive) setBusy(false); }
    }
    retrySave.current = saveWin;
    class ArcadeScene extends Phaser.Scene {
      player?: Phaser.GameObjects.Image;
      fruits: Phaser.GameObjects.Text[] = [];
      preload() { this.load.image("monere", avatar); }
      create() {
        const g = this.add.graphics();
        // 80's neon grid backdrop.
        g.lineStyle(1, color("--energy"), .3);
        for (let y = 60; y <= 540; y += 40) g.lineBetween(0, y, 600, y);
        for (let x = 0; x <= 600; x += 40) g.lineBetween(x, 60, x, 540);
        g.lineStyle(3, color("--points")); g.lineBetween(20, 470, 580, 470);
        // The prize scroll glows above the arcade.
        this.add.text(284, 14, "📜", { fontSize: "30px" });
        this.player = this.add.image(300, 470, "monere").setDisplaySize(52, 58).setOrigin(.5, .9).setDepth(3);
        if (alive) setReady(true);
      }
      override update(_time: number, dt: number) {
        if (stopped.current || working || document.hidden) return;
        if (!started.current && direction.current !== "idle") start();
        if (!started.current) return;
        elapsed += Math.min(dt, ARCADE_TICK_MS);
        if (elapsed < ARCADE_TICK_MS) return;
        elapsed -= ARCADE_TICK_MS;
        const input = direction.current;
        const next = arcadeStep(state, input);
        if (next.catches > state.catches) playSound("success.mp3", .2);
        if (next.misses > state.misses) playSound("expulsion.mp3", .25);
        state = next; trace.current.push(input); setSnapshot(state);
        this.player?.setPosition(state.x, 470); if (input !== "idle") this.player?.setFlipX(input === "left");
        this.fruits.forEach(f => f.destroy());
        this.fruits = state.fruits.map(f => this.add.text(f.x, f.y, FRUIT_ICONS[f.kind] ?? "🍎", { fontSize: "26px" }).setOrigin(.5));
        if (state.won) { playSound("victory.mp3", .5); void saveWin(); }
        if (state.lost) { stopped.current = true; setError("The fruit got away! Press play to try again."); }
        if (trace.current.length >= 23990) { stopped.current = true; setError("Round finished. Press play to try again."); }
      }
    }
    const game = new Phaser.Game({ type: Phaser.CANVAS, parent: mount, width: 600, height: 540, backgroundColor: color("--background"), scene: ArcadeScene, input: { keyboard: false }, audio: { noAudio: true }, banner: false, scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH } });
    const keys: Record<string, ArcadeInput> = { arrowleft: "left", a: "left", arrowright: "right", d: "right" };
    const down = (e: KeyboardEvent) => { const d = keys[e.key.toLowerCase()]; if (!d) return; e.preventDefault(); e.stopImmediatePropagation(); direction.current = d; };
    const up = (e: KeyboardEvent) => { const d = keys[e.key.toLowerCase()]; if (!d) return; e.preventDefault(); e.stopImmediatePropagation(); if (direction.current === d) direction.current = "idle"; };
    const blur = () => { direction.current = "idle"; };
    window.addEventListener("keydown", down, true); window.addEventListener("keyup", up, true); window.addEventListener("blur", blur);
    return () => { alive = false; retrySave.current = null; window.removeEventListener("keydown", down, true); window.removeEventListener("keyup", up, true); window.removeEventListener("blur", blur); game.destroy(true); };
  }, [mount, avatar, round]);
  return <Dialog open><DialogContent showCloseButton={false} className="garden-game-modal" onEscapeKeyDown={e => e.preventDefault()} onPointerDownOutside={e => e.preventDefault()} onInteractOutside={e => e.preventDefault()}>
      <div className="flex flex-wrap items-center justify-between gap-2"><div><DialogTitle className="text-xl text-primary">Connie’s 80’s Arcade</DialogTitle><DialogDescription>Win the second scroll 📜 · +20 Coins · catch {ARCADE_WIN_CATCHES} fruits · {ARCADE_MAX_MISSES} misses ends the round</DialogDescription></div><span className="flex items-center gap-1 font-display text-points" aria-label={`Caught ${snapshot.catches} of ${ARCADE_WIN_CATCHES} fruits`}><ScrollText size={18} />{snapshot.catches}/{ARCADE_WIN_CATCHES}</span></div>
    <div ref={setMount} className="garden-game-board" data-tick={snapshot.tick} data-state={JSON.stringify(snapshot)} role="img" aria-label={`80's arcade fruit catcher. Monere at position ${snapshot.x}, ${snapshot.catches} fruits caught, ${snapshot.misses} missed.`} />
    {!playing && <Button disabled={!ready} onClick={start}><Play />{ready ? "Start arcade game" : "Opening arcade…"}</Button>}
    <div className="flex items-center justify-between gap-2"><div className="harvest-pad">{[{ d: "left", Icon: ArrowLeft, c: "" }, { d: "right", Icon: ArrowRight, c: "" }].map(({ d, Icon, c }) => <TouchDirectionButton arrow={`Arrow${d.charAt(0).toUpperCase()}${d.slice(1)}` as TouchArrow} key={d} size="icon" variant="secondary" className={c} aria-label={`Arcade move ${d}`} disabled={busy || stopped.current}><Icon /></TouchDirectionButton>)}</div><div className="flex flex-wrap justify-end gap-2"><Button size="icon" variant="ghost" title="Return to Connie" aria-label="Leave arcade game" disabled={busy} onClick={onExit}><DoorOpen /></Button></div></div>
    {entryNotice && <p role="status" aria-live="polite" className="garden-entry-notice text-sm font-bold text-primary">🕹️ Catch {ARCADE_WIN_CATCHES} fruits to win the second scroll!</p>}
    <ul aria-label="Arcade controls" className="garden-keys">{[["← →", "A D", "Move Monere"], ["📜", "", `Catch ${ARCADE_WIN_CATCHES} fruits to win`], ["🍎", "", `${ARCADE_MAX_MISSES} misses ends the round`]].map(([a, b, label]) => <li key={label}><kbd>{a}</kbd>{b && <kbd>{b}</kbd>}<span>{label}</span></li>)}</ul>
    {error && <div className="flex flex-wrap items-center gap-3"><p role="alert" className="text-sm text-destructive">{error}</p>{snapshot.won && <Button disabled={busy} onClick={() => void retrySave.current?.()}><RotateCcw />Retry Save</Button>}</div>}
    {stopped.current && !snapshot.won && <Button disabled={busy} onClick={() => { setError(null); setRound(r => r + 1); }}><RotateCcw />Play again</Button>}
  </DialogContent></Dialog>;
}
