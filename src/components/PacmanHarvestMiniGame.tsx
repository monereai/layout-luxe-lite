import { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, DoorOpen, Sun, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { MAZE, MAZE_TICK_MS, cellId, mazeCells, mazeStep, newMaze, powerActive, type MazeDirection } from "@/lib/harvest-maze";
import { playSound } from "@/lib/audio";

/** Browser-only Phaser maze; the server replays the input trace before depositing rewards. */
export function PacmanHarvestMiniGame({ avatar, onFinish }: { avatar: string; onFinish: (trace: MazeDirection[], expelled: boolean) => Promise<void> }) {
  const [mount, setMount] = useState<HTMLDivElement | null>(null);
  const direction = useRef<MazeDirection>("idle");
  const trace = useRef<MazeDirection[]>([]), finish = useRef(onFinish), stopped = useRef(false);
  const [snapshot, setSnapshot] = useState(newMaze), [saving, setSaving] = useState(false), [error, setError] = useState<string | null>(null);
  finish.current = onFinish;
  async function deposit(expelled: boolean) {
    if (saving) return;
    stopped.current = true; setSaving(true); setError(null);
    try { await finish.current(trace.current, expelled); }
    catch { setError("Your harvest is safe here. Try saving it again."); setSaving(false); }
  }
  const depositRef = useRef(deposit); depositRef.current = deposit;
  useEffect(() => {
    const parent = mount; if (!parent) return;
    let state = newMaze(), started = false, elapsed = 0;
    const css = getComputedStyle(document.documentElement);
    const color = (token: string) => css.getPropertyValue(token).trim();
    class HarvestScene extends Phaser.Scene {
      player?: Phaser.GameObjects.Image;
      shadows: Phaser.GameObjects.Image[] = [];
      dots = new Map<number, Phaser.GameObjects.Image>();
      preload() { this.load.image("monere", avatar); }
      create() {
        const texture = (key: string, draw: (c: CanvasRenderingContext2D) => void) => { const t = this.textures.createCanvas(key, 40, 40); const c = t?.getContext(); if (c) { draw(c); t?.refresh(); } };
        texture("wall", c => { c.fillStyle = color("--maze-wall"); c.beginPath(); c.roundRect(2, 2, 36, 36, 7); c.fill(); c.strokeStyle = color("--maze-edge"); c.lineWidth = 2; c.stroke(); });
        texture("dot", c => { c.fillStyle = color("--energy"); c.shadowColor = color("--energy"); c.shadowBlur = 10; c.beginPath(); c.arc(20, 20, 4, 0, Math.PI * 2); c.fill(); });
        texture("sun", c => { c.strokeStyle = color("--points"); c.fillStyle = color("--points"); c.lineWidth = 2; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; c.beginPath(); c.moveTo(20 + Math.cos(a) * 11, 20 + Math.sin(a) * 11); c.lineTo(20 + Math.cos(a) * 16, 20 + Math.sin(a) * 16); c.stroke(); } c.beginPath(); c.arc(20, 20, 8, 0, Math.PI * 2); c.fill(); });
        texture("shadow", c => { c.fillStyle = color("--maze-shadow"); c.strokeStyle = color("--maze-edge"); c.lineWidth = 2; c.beginPath(); c.moveTo(6, 32); c.lineTo(6, 18); c.bezierCurveTo(6, 0, 34, 0, 34, 18); c.lineTo(34, 32); c.lineTo(27, 27); c.lineTo(20, 32); c.lineTo(13, 27); c.closePath(); c.fill(); c.stroke(); c.fillStyle = color("--foreground"); c.fillRect(13, 15, 4, 6); c.fillRect(24, 15, 4, 6); });
        MAZE.forEach((row, y) => [...row].forEach((c, x) => { if (c === "#") this.add.image(x * 40 + 20, y * 40 + 20, "wall"); }));
        mazeCells.forEach(p => { if (!state.collected.includes(cellId(p))) this.dots.set(cellId(p), this.add.image(p.x * 40 + 20, p.y * 40 + 20, p.sun ? "sun" : "dot")); });
        this.player = this.add.image(state.player.x * 40 + 20, state.player.y * 40 + 20, "monere").setDisplaySize(38, 38).setDepth(3);
        this.shadows = state.chasers.map(c => this.add.image(c.x * 40 + 20, c.y * 40 + 20, "shadow").setDepth(2));
      }
      override update(_time: number, dt: number) {
        if (stopped.current || document.hidden) return;
        if (direction.current !== "idle") started = true;
        if (!started) return;
        elapsed += Math.min(dt, MAZE_TICK_MS); if (elapsed < MAZE_TICK_MS) return; elapsed -= MAZE_TICK_MS;
        const old = state; state = mazeStep(state, direction.current); trace.current.push(direction.current); setSnapshot(state);
        for (const id of state.collected) { this.dots.get(id)?.destroy(); this.dots.delete(id); }
        if (state.energy > old.energy) playSound(state.powerUntil > old.powerUntil ? "success.mp3" : "energy_pickup.mp3", .2);
        if (this.player) { this.tweens.add({ targets: this.player, x: state.player.x * 40 + 20, y: state.player.y * 40 + 20, duration: 180 }); if (direction.current === "left" || direction.current === "right") this.player.setFlipX(direction.current === "left"); }
        this.shadows.forEach((c, i) => { const p = state.chasers[i]; if (p) this.tweens.add({ targets: c, x: p.x * 40 + 20, y: p.y * 40 + 20, alpha: powerActive(state) ? .45 : 1, duration: 180 }); });
        if (state.ended || trace.current.length >= 3000) { stopped.current = true; if (state.ended === "expelled") playSound("expulsion.mp3", .5); void depositRef.current(state.ended === "expelled"); }
      }
    }
    const game = new Phaser.Game({ type: Phaser.CANVAS, parent, width: 600, height: 520, transparent: true, scene: HarvestScene, audio: { noAudio: true }, banner: false, scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH } });
    const keys: Record<string, MazeDirection> = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right", w: "up", s: "down", a: "left", d: "right" };
    const down = (e: KeyboardEvent) => { const d = keys[e.key.length === 1 ? e.key.toLowerCase() : e.key]; if (d) { e.preventDefault(); e.stopPropagation(); direction.current = d; } };
    const up = (e: KeyboardEvent) => { const d = keys[e.key.length === 1 ? e.key.toLowerCase() : e.key]; if (direction.current === d) direction.current = "idle"; };
    const blur = () => { direction.current = "idle"; };
    window.addEventListener("keydown", down, true); window.addEventListener("keyup", up, true); window.addEventListener("blur", blur);
    return () => { window.removeEventListener("keydown", down, true); window.removeEventListener("keyup", up, true); window.removeEventListener("blur", blur); game.destroy(true); };
  }, [avatar, mount]);
  const power = Math.max(0, Math.ceil((snapshot.powerUntil - snapshot.tick) * MAZE_TICK_MS / 1000));
  return <Dialog open onOpenChange={() => { if (!saving) void deposit(snapshot.ended === "expelled"); }}><DialogContent showCloseButton={false} className="harvest-modal" onPointerDownOutside={e => e.preventDefault()} onInteractOutside={e => e.preventDefault()}>
    <div className="flex flex-wrap items-center justify-between gap-3"><div><DialogTitle className="text-xl text-primary">Monere’s Energy Orchard</DialogTitle><DialogDescription>Sunlit harvest</DialogDescription></div><span role="status" aria-label={`Collected ${snapshot.energy} Energy`} className="flex items-center gap-1 font-display text-xl text-energy"><Zap />+{snapshot.energy}</span></div>
    <div className="flex items-center justify-between gap-2 text-sm"><span className="text-muted-foreground">{snapshot.collected.length - 1} / {mazeCells.length - 1}</span><span role="status" className={power ? "text-points" : "text-muted-foreground"}><Sun className="mr-1 inline h-4 w-4" />{power ? `Sun Power · ${power}s` : "Golden Suns"}</span></div>
    <div ref={setMount} className="harvest-board" role="img" aria-label="Orchard maze with Monere, glowing Energy dots, four Golden Suns and three Shadow Chasers" />
    <div className="flex items-end justify-between gap-3"><div className="harvest-pad" aria-label="Maze movement">{[{ d: "up", Icon: ArrowUp, c: "col-start-2" }, { d: "left", Icon: ArrowLeft, c: "row-start-2" }, { d: "down", Icon: ArrowDown, c: "row-start-2 col-start-2" }, { d: "right", Icon: ArrowRight, c: "row-start-2 col-start-3" }].map(({ d, Icon, c }) => <Button key={d} variant="secondary" size="icon" aria-label={`Maze move ${d}`} className={c} disabled={saving || stopped.current} onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); direction.current = d as MazeDirection; }} onPointerUp={() => { direction.current = "idle"; }} onPointerCancel={() => { direction.current = "idle"; }} onLostPointerCapture={() => { direction.current = "idle"; }}><Icon /></Button>)}</div><Button disabled={saving} variant="outline" onClick={() => void deposit(snapshot.ended === "expelled")}><DoorOpen />{saving ? "Saving Energy…" : error ? "Retry save" : "Keep harvest"}</Button></div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </DialogContent></Dialog>;
}