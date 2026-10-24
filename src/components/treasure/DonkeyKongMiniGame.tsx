import { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, DoorOpen, RotateCcw, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import gardenArt from "@/assets/treasure/garden.jpg";
import { GARDEN_TICK_MS, LADDERS, PLATFORM_Y, gardenStep, gardenPlayerY, gardenBarrelY, newGarden, type GardenInput } from "@/lib/garden-game";
import { playSound } from "@/lib/audio";

/** Isolated browser-only Phaser scene: no shared world controls or collision state. */
export default function DonkeyKongMiniGame({ avatar, energy, onJump, onComplete, onExit }: {
  avatar: string; energy: number; onJump: (trace: GardenInput[]) => Promise<void>;
  onComplete: (trace: GardenInput[]) => Promise<void>; onExit: () => void;
}) {
  const [mount, setMount] = useState<HTMLDivElement | null>(null);
  const [snapshot, setSnapshot] = useState(newGarden), [busy, setBusy] = useState(false), [error, setError] = useState<string | null>(null);
  const direction = useRef<GardenInput>("idle"), command = useRef<GardenInput | null>(null);
  const callbacks = useRef({ onJump, onComplete, energy }); callbacks.current = { onJump, onComplete, energy };
  const stopped = useRef(false), trace = useRef<GardenInput[]>([]);
  const retry = useRef<(() => void) | null>(null);
  useEffect(() => {
    if (!mount) return;
    let state = newGarden(), elapsed = 0, alive = true, working = false;
    trace.current = []; stopped.current = false;
    const css = getComputedStyle(document.documentElement);
    const token = (name: string) => Phaser.Display.Color.ValueToColor(css.getPropertyValue(name).trim()).color;
    // CSS computed tokens may be oklch; canvas resolves them before Phaser reads RGB.
    const swatch = document.createElement("canvas").getContext("2d");
    const color = (name: string) => { if (!swatch) return token(name); swatch.fillStyle = css.getPropertyValue(name).trim(); swatch.fillRect(0, 0, 1, 1); const p = swatch.getImageData(0, 0, 1, 1).data; return ((p[0] ?? 0) << 16) + ((p[1] ?? 0) << 8) + (p[2] ?? 0); };
    async function saveWin() {
      if (working) return;
      working = true; stopped.current = true; setBusy(true); setError(null);
      try { await callbacks.current.onComplete([...trace.current]); }
      catch { if (alive) { setError("The reward couldn’t be saved. Please try again."); retry.current = () => void saveWin(); } }
      finally { working = false; if (alive) setBusy(false); }
    }
    class GardenScene extends Phaser.Scene {
      player?: Phaser.GameObjects.Image;
      hazards: Phaser.GameObjects.Arc[] = [];
      preload() { this.load.image("monere", avatar); this.load.image("garden", gardenArt); }
      create() {
        this.add.image(300, 270, "garden").setDisplaySize(600, 540).setAlpha(.3);
        const g = this.add.graphics();
        for (const y of PLATFORM_Y) {
          g.fillStyle(color("--garden-girder")); g.fillRoundedRect(24, y + 10, 552, 16, 3);
          g.lineStyle(2, color("--garden-rivet"));
          for (let x = 30; x < 570; x += 30) { g.strokeTriangle(x, y + 12, x + 14, y + 24, x + 28, y + 12); }
        }
        LADDERS.forEach((x, level) => { const bottom = PLATFORM_Y[level] ?? 450; const top = PLATFORM_Y[level + 1] ?? 90; g.lineStyle(5, color("--energy")); g.lineBetween(x - 13, top + 12, x - 13, bottom + 12); g.lineBetween(x + 13, top + 12, x + 13, bottom + 12); g.lineStyle(3, color("--energy")); for (let y = top + 16; y < bottom; y += 14) g.lineBetween(x - 13, y, x + 13, y); });
        g.fillStyle(color("--points")); g.fillRoundedRect(38, 52, 46, 32, 4); g.lineStyle(3, color("--foreground")); g.strokeRoundedRect(38, 52, 46, 32, 4);
        this.add.text(48, 51, "🌱", { fontSize: "26px" });
        this.player = this.add.image(60, 450, "monere").setDisplaySize(48, 54).setOrigin(.5, .85).setDepth(3);
      }
      override update(_time: number, dt: number) {
        if (stopped.current || working || document.hidden) return;
        elapsed += Math.min(dt, GARDEN_TICK_MS);
        if (elapsed < GARDEN_TICK_MS) return;
        elapsed -= GARDEN_TICK_MS;
        const input = command.current ?? direction.current; command.current = null;
        const next = gardenStep(state, input);
        if (next.jumps > state.jumps) {
          if (callbacks.current.energy < 5) { setError("Monere needs 5 Energy to jump."); return; }
          working = true; setBusy(true);
          void callbacks.current.onJump([...trace.current, input]).then(() => { if (alive) { state = next; trace.current.push(input); playSound("success.mp3", .2); setError(null); } }).catch(() => { if (alive) setError("Jump unavailable. Your Energy was not spent."); }).finally(() => { working = false; if (alive) setBusy(false); });
          return;
        }
        if (next.hits > state.hits) playSound("expulsion.mp3", .25);
        state = next; trace.current.push(input); setSnapshot(state);
        this.player?.setPosition(state.x, gardenPlayerY(state)).setFlipX(input === "left");
        this.hazards.forEach(b => b.destroy());
        this.hazards = state.barrels.map(b => { const circle = this.add.circle(b.x, gardenBarrelY(b) - 6, 14, color("--garden-barrel")).setStrokeStyle(4, color("--points")); return circle; });
        if (state.won) { playSound("victory.mp3", .5); void saveWin(); }
        if (trace.current.length >= 23990) { stopped.current = true; setError("Round finished. Return to the garden and try again."); }
      }
    }
    const game = new Phaser.Game({ type: Phaser.CANVAS, parent: mount, width: 600, height: 540, backgroundColor: color("--background"), scene: GardenScene, audio: { noAudio: true }, banner: false, scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH } });
    const keys: Record<string, GardenInput> = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down", " ": "jump" };
    const down = (e: KeyboardEvent) => { const d = keys[e.key]; if (!d) return; e.preventDefault(); e.stopImmediatePropagation(); if (d === "jump") { if (!e.repeat) command.current = d; } else direction.current = d; };
    const up = (e: KeyboardEvent) => { if (!keys[e.key]) return; e.preventDefault(); e.stopImmediatePropagation(); if (direction.current === keys[e.key]) direction.current = "idle"; };
    const blur = () => { direction.current = "idle"; command.current = null; };
    window.addEventListener("keydown", down, true); window.addEventListener("keyup", up, true); window.addEventListener("blur", blur);
    return () => { alive = false; window.removeEventListener("keydown", down, true); window.removeEventListener("keyup", up, true); window.removeEventListener("blur", blur); game.destroy(true); };
  }, [mount, avatar]);
  return <Dialog open><DialogContent showCloseButton={false} className="garden-game-modal" onEscapeKeyDown={e => e.preventDefault()} onPointerDownOutside={e => e.preventDefault()} onInteractOutside={e => e.preventDefault()}>
    <div className="flex flex-wrap items-center justify-between gap-2"><div><DialogTitle className="text-xl text-primary">Vernon’s Seed Hopper</DialogTitle><DialogDescription>Garden challenge · +50 Energy · +20 Coins</DialogDescription></div><span className="flex items-center gap-1 font-display text-energy" aria-label={`Garden Energy ${energy}`}><Zap size={18} />{energy}/100</span></div>
    <div ref={setMount} className="garden-game-board" data-tick={snapshot.tick} role="img" aria-label={`Four girder platforms with ladders and rolling barrels. Monere on platform ${snapshot.level + 1}, position ${snapshot.x}.`} />
    <div className="flex items-center justify-between gap-2"><div className="harvest-pad">{[{ d: "up", Icon: ArrowUp, c: "col-start-2" }, { d: "left", Icon: ArrowLeft, c: "row-start-2" }, { d: "down", Icon: ArrowDown, c: "row-start-2 col-start-2" }, { d: "right", Icon: ArrowRight, c: "row-start-2 col-start-3" }].map(({ d, Icon, c }) => <Button key={d} size="icon" variant="secondary" className={c} aria-label={`Garden move ${d}`} disabled={busy || stopped.current} onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); direction.current = d as GardenInput; }} onPointerUp={() => { direction.current = "idle"; }} onPointerCancel={() => { direction.current = "idle"; }} onLostPointerCapture={() => { direction.current = "idle"; }}><Icon /></Button>)}</div><div className="flex flex-wrap justify-end gap-2"><Button disabled={busy || stopped.current || energy < 5} onClick={() => { command.current = "jump"; }}><ArrowUp />Jump · 5<Zap size={14} /></Button><Button size="icon" variant="outline" title="Reset position" aria-label="Reset garden position" disabled={busy || stopped.current} onClick={() => { command.current = "reset"; }}><RotateCcw /></Button><Button size="icon" variant="ghost" title="Return to Meadow" aria-label="Leave garden challenge" disabled={busy} onClick={onExit}><DoorOpen /></Button></div></div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}{stopped.current && retry.current && <Button disabled={busy} onClick={() => retry.current?.()}>Save reward</Button>}
  </DialogContent></Dialog>;
}