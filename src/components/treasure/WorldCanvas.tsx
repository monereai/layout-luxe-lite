import { useEffect, useRef, type MutableRefObject } from "react";
import type Phaser from "phaser";
import meadow from "@/assets/treasure/meadow.jpg";
import forest from "@/assets/treasure/forest.jpg";
import ravine from "@/assets/treasure/ravine.jpg";
import lair from "@/assets/treasure/lair.jpg";
import razor from "@/assets/treasure/razor.png";
import griffin from "@/assets/pets/golden-griffin.png";
import { PORTALS, SCROLLS, DUEL_TILES, DUEL_START, LAIR_DOOR, RAZOR, CAGE, TILE_SIZE, SCROLL_REVEAL, canStep, type AdventureState, type Position } from "@/lib/treasure";

export type WorldEffect = { kind: "gust" | "victory" | null; n: number };
export type WorldControls = { direction: (x: number, y: number) => void; release: () => void; pause: (paused: boolean) => void; seek: (position: Position) => void };
type Props = { state: AdventureState; revision: number; avatar: string; controls: MutableRefObject<WorldControls | null>; onMove: (position: Position) => void; figure: MutableRefObject<HTMLDivElement | null>; pet: MutableRefObject<HTMLDivElement | null>; onInteract: () => void; effect: WorldEffect };
export function WorldCanvas(props: Props) {
  const host = useRef<HTMLDivElement>(null);
  const live = useRef(props); live.current = props;
  const sceneRef = useRef<Phaser.Scene | null>(null);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let disposed = false;
    let game: Phaser.Game | undefined;
    void import("phaser").then(({ default: P }) => {
      if (disposed) return;
      class World extends P.Scene {
        player?: Phaser.GameObjects.Image;
        background?: Phaser.GameObjects.Image;
        markers: Phaser.GameObjects.Image[] = [];
        portals: Phaser.GameObjects.Container[] = []; scenery: Phaser.GameObjects.GameObject[] = [];
        keys: Record<string, Phaser.Input.Keyboard.Key> | undefined;
        direction = { x: 0, y: 0 }; paused = false; moving = false; path: Position[] = []; lastState = ""; avatarKey = "lion"; serial = 0;
        shadow?: Phaser.GameObjects.Ellipse; base = 1; phase = 0; stride = 0; facing = "south"; depthScale = 1; lastStep = 0; reduced = false; yaw = 0; trail: { t: number; x: number; y: number; walking: boolean }[] = [];
        effectN = 0;
        preload() { this.load.image("meadow", meadow); this.load.image("wood", forest); this.load.image("ravine", ravine); this.load.image("lair", lair); this.load.image("razor", razor); this.load.image("griffin", griffin); this.load.image("lion", live.current.avatar); }
        create() {
          sceneRef.current = this;
          this.background = this.add.image(768, 768, live.current.state.zone).setDisplaySize(1536, 1536);
          this.player = this.add.image(0, 0, "lion").setDisplaySize(140, 140).setOrigin(.5, .8).setDepth(10).setAlpha(0);
          this.base = this.player.scaleX; this.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          this.shadow = this.add.ellipse(0, 0, 70, 18, 0x000000, .28).setDepth(9);
          const fitCamera = () => this.cameras.main.setZoom(Math.max(.85, this.scale.width / 1536, this.scale.height / 1536));
          this.cameras.main.setBounds(0, 0, 1536, 1536);
          fitCamera(); this.scale.on("resize", fitCamera);
          this.cameras.main.startFollow(this.player, false, .12, .12);
          this.keys = this.input.keyboard?.addKeys("UP,DOWN,LEFT,RIGHT,W,A,S,D,E,SPACE") as Record<string, Phaser.Input.Keyboard.Key> | undefined;
          this.input.keyboard?.on("keydown-E", () => { if (!this.paused) live.current.onInteract(); });
          this.input.keyboard?.on("keydown-SPACE", () => { if (!this.paused) live.current.onInteract(); });
          this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => { if (!this.paused) this.seek({ x: Math.floor(pointer.worldX / 64), y: Math.floor(pointer.worldY / 64) }); });
          live.current.controls.current = { direction: (x, y) => { this.direction = { x, y }; this.path = []; }, release: () => { this.direction = { x: 0, y: 0 }; }, pause: paused => { this.paused = paused; this.direction = { x: 0, y: 0 }; this.path = []; }, seek: position => this.seek(position) };
          this.sync(true);
          this.game.events.on(P.Core.Events.BLUR, () => { this.direction = { x: 0, y: 0 }; this.path = []; });
        }
        seek(target: Position) {
          if (!canStep(live.current.state, target.x, target.y)) return;
          const s = live.current.state; const open: Position[][] = [[{ x: s.x, y: s.y }]]; const seen = new Set([`${s.x},${s.y}`]);
          for (let i = 0; i < open.length; i++) {
            const path = open[i]; const end = path?.at(-1); if (!path || !end) continue;
            if (end.x === target.x && end.y === target.y) { this.path = path.slice(1); return; }
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const next = { x: end.x + (dx ?? 0), y: end.y + (dy ?? 0) }; const key = `${next.x},${next.y}`; if (!seen.has(key) && canStep(s, next.x, next.y)) { seen.add(key); open.push([...path, next]); } }
          }
        }
        sync(force = false) {
          const s = live.current.state; const key = `${s.zone}:${live.current.revision}:${s.x},${s.y}:${s.scrolls.join()}:${s.gates.join()}:${s.duel}:${s.rescued}`;
          const fx = live.current.effect;
          if (fx.n !== this.effectN) { this.effectN = fx.n; if (fx.kind === "gust") this.gust(); if (fx.kind === "victory") this.victory(); }
          if (key === this.lastState && !force) return;
          const changedZone = this.lastState.split(":")[0] !== s.zone || this.lastState.split(":")[1] !== String(live.current.revision);
          this.lastState = key;
          this.background?.setTexture(s.zone);
          const far = this.player && Math.abs(this.player.x - (s.x + .5) * TILE_SIZE) + Math.abs(this.player.y - (s.y + .5) * TILE_SIZE) > TILE_SIZE * 1.5;
          if (changedZone || force || (far && !this.moving)) { this.path = []; this.tweens.killTweensOf(this.player!); this.moving = false; this.player?.setPosition((s.x + .5) * TILE_SIZE, (s.y + .5) * TILE_SIZE); if (changedZone || force) this.cameras.main.centerOn((s.x + .5) * TILE_SIZE, (s.y + .5) * TILE_SIZE); }
          this.portals.forEach(p => p.destroy()); this.portals = [];
          this.scenery.forEach(item => item.destroy()); this.scenery = [];
          const color = (token: string) => P.Display.Color.HexStringToColor(getComputedStyle(document.documentElement).getPropertyValue(token).trim()).color;
          const at = (p: Position) => [(p.x + .5) * 64, (p.y + .5) * 64] as const;
          const text = (p: Position, t: string, size = 36) => { const o = this.add.text(...at(p), t, { fontSize: `${size}px` }).setOrigin(.5).setDepth(3); this.scenery.push(o); return o; };
          if (!s.scrolls.includes(s.zone) && Math.abs(SCROLLS[s.zone].x - s.x) + Math.abs(SCROLLS[s.zone].y - s.y) <= SCROLL_REVEAL) {
            const scroll = text(SCROLLS[s.zone], "📜", 44).setInteractive({ useHandCursor: true });
            scroll.on("pointerdown", (_: unknown, __: unknown, ___: unknown, event: Phaser.Types.Input.EventData) => { event.stopPropagation(); if (!this.paused) this.seek(SCROLLS[s.zone]); });
            if (!this.reduced) this.tweens.add({ targets: scroll, y: scroll.y - 6, alpha: .75, duration: 1200, yoyo: true, repeat: -1 });
          }
          if (s.zone === "lair") {
            if (!s.gates.includes("lair")) { const door = this.add.rectangle((LAIR_DOOR.x + .5) * 64, 10 * 64, 64, 128, color("--primary"), .55).setDepth(4); this.scenery.push(door); text(LAIR_DOOR, s.scrolls.includes("lair") ? "❓" : "🔒", 32).setY(10 * 64); }
            DUEL_TILES.forEach((t, i) => { const r = this.add.rectangle(...at(t), 60, 60, color("--points"), s.rescued ? .2 : .45).setStrokeStyle(3, color("--primary")).setDepth(2); this.scenery.push(r); text(t, "ABC"[i]!, 28); });
            const start = this.add.circle(...at(DUEL_START), 20, color("--energy"), .4).setDepth(2); this.scenery.push(start);
            if (!s.rescued) { const hy = this.add.image(...at(RAZOR), "razor").setDisplaySize(130, 130).setDepth(5); this.scenery.push(hy); }
            const g = this.add.image(...at(CAGE), "griffin").setDisplaySize(110, 110).setDepth(5); this.scenery.push(g);
            if (!s.rescued) for (let i = -2; i <= 2; i++) { const bar = this.add.rectangle(at(CAGE)[0] + i * 22, at(CAGE)[1], 5, 120, color("--foreground"), .8).setDepth(6); this.scenery.push(bar); }
          }
          PORTALS[s.zone].forEach(p => {
            const open = !p.forward || s.gates.includes(s.zone);
            const ring = this.add.text(0, 0, open ? "🌀" : s.scrolls.includes(s.zone) ? "❓" : "🔒", { fontSize: "44px" }).setOrigin(.5);
            const label = this.add.text(0, 34, p.target === "wood" ? "LONELY WOOD" : p.target === "ravine" ? "SHADOW RAVINE" : p.target === "lair" ? "RAZOR'S LAIR" : "MEADOW", { fontFamily: "Nunito", fontSize: "12px", color: getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim(), backgroundColor: getComputedStyle(document.documentElement).getPropertyValue("--background").trim(), padding: { x: 8, y: 4 } }).setOrigin(.5);
            const node = this.add.container((p.x + .5) * 64, (p.y + .5) * 64, [ring, label]).setDepth(4); this.portals.push(node);
          });
        }
        gust() {
          const p = this.player; if (!p) return;
          for (let i = 0; i < 10; i++) { const w = this.add.text(p.x + (Math.random() - .5) * 80, p.y - 40 + Math.random() * 60, "〰", { fontSize: "28px" }).setDepth(12).setAlpha(.9); this.tweens.add({ targets: w, y: w.y + 90, alpha: 0, duration: 600 + Math.random() * 300, onComplete: () => w.destroy() }); }
          this.cameras.main.shake(250, .004);
        }
        victory() {
          const hy = this.scenery.find(o => (o as Phaser.GameObjects.Image).texture?.key === "razor") as Phaser.GameObjects.Image | undefined;
          if (hy) this.tweens.add({ targets: hy, x: -200, alpha: 0, duration: 1400 });
          for (let i = 0; i < 24; i++) { const c = this.add.text((CAGE.x + .5) * 64, (CAGE.y + .5) * 64, ["✨", "⭐", "🎉"][i % 3]!, { fontSize: "26px" }).setDepth(12); this.tweens.add({ targets: c, x: c.x + (Math.random() - .5) * 400, y: c.y + (Math.random() - .5) * 400, alpha: 0, duration: 1400, onComplete: () => c.destroy() }); }
        }
        override update() {
          if (!this.player) return;
          this.sync();
          this.animate();
          if (this.paused || this.moving) return;
          const keys = this.keys;
          let dx = this.direction.x; let dy = this.direction.y;
          if (keys?.['LEFT']?.isDown || keys?.['A']?.isDown) dx = -1; else if (keys?.['RIGHT']?.isDown || keys?.['D']?.isDown) dx = 1;
          if (keys?.['UP']?.isDown || keys?.['W']?.isDown) dy = -1; else if (keys?.['DOWN']?.isDown || keys?.['S']?.isDown) dy = 1;
          const s = live.current.state;
          const next = dx || dy ? { x: s.x + dx, y: s.y + (dx ? 0 : dy) } : this.path.shift();
          if (!next || !canStep(s, next.x, next.y)) return;
          live.current.onMove(next);
          this.moving = true;
          this.facing = next.x > s.x ? "east" : next.x < s.x ? "west" : next.y < s.y ? "north" : "south";
          
          this.tweens.add({ targets: this.player, x: (next.x + .5) * 64, y: (next.y + .5) * 64, duration: 210, onComplete: () => { this.moving = false; } });
        }
        animate() {
          const p = this.player; const el = live.current.figure.current; if (!p) return;
          const keys = this.keys;
          const held = !!(this.direction.x || this.direction.y || ["LEFT", "RIGHT", "UP", "DOWN", "W", "A", "S", "D"].some(k => keys?.[k]?.isDown));
          const walking = !this.paused && (this.moving || this.path.length > 0 || held);
          const cam = this.cameras.main;
          this.shadow?.setPosition(p.x, p.y + 4);
          if (el) {
            el.style.transform = `translate(${(p.x - cam.worldView.x) * cam.zoom}px, ${(p.y - cam.worldView.y) * cam.zoom}px)`;
            el.style.setProperty("--monere-size", `${140 * cam.zoom}px`);
            el.dataset["facing"] = this.facing;
            // Turn smoothly through the turnaround's in-between angles (45° each): South 0, East 90, North 180, West 270.
            const target = ({ south: 0, east: 90, north: 180, west: 270 } as Record<string, number>)[this.facing] ?? 0;
            const diff = ((target - this.yaw + 540) % 360) - 180;
            this.yaw = (this.yaw + diff * Math.min(1, this.game.loop.delta / 70) + 360) % 360;
            el.dataset["frame"] = String(Math.round(this.yaw / 45) % 8);
            el.dataset["moving"] = walking ? "true" : "false";
            const body = el.firstElementChild; body?.classList.toggle("walk-bounce", walking); body?.classList.toggle("idle-breath", !walking);
          }
          // Companion follows the path Monere walked half a second ago.
          const now = this.time.now; this.trail.push({ t: now, x: p.x, y: p.y, walking });
          while (this.trail.length > 2 && (this.trail[1]?.t ?? now) <= now - 500) this.trail.shift();
          const past = this.trail[0]; const pet = live.current.pet.current;
          if (pet && past) {
            const lag = this.trail.find(e => e.t >= now - 500) ?? past;
            const px = lag.x; const py = lag.y;
            pet.style.transform = `translate(${(px - cam.worldView.x) * cam.zoom}px, ${(py - cam.worldView.y) * cam.zoom}px)`;
            pet.style.setProperty("--pet-size", `${70 * cam.zoom}px`);
            pet.dataset["facing"] = lag.x > p.x + 2 ? "west" : lag.x < p.x - 2 ? "east" : pet.dataset["facing"] ?? "east";
            const body = pet.firstElementChild; body?.classList.toggle("walk-bounce", lag.walking); body?.classList.toggle("idle-breath", !lag.walking);
          }
          if (walking && this.time.now - this.lastStep > 260) { this.lastStep = this.time.now; this.dust(p.x, p.y + 6); }
        }
        dust(x: number, y: number) {
          for (let i = 0; i < 3; i++) {
            const puff = this.add.circle(x + (Math.random() - .5) * 30, y, 4 + Math.random() * 4, 0xf3e3c3, .55).setDepth(8);
            this.tweens.add({ targets: puff, x: puff.x - (this.facing === "east" ? 1 : this.facing === "west" ? -1 : 0) * (8 + Math.random() * 10), y: y - 6 - Math.random() * 8, scale: 1.8, alpha: 0, duration: 420, onComplete: () => puff.destroy() });
          }
        }
        setAvatar(src: string) {
          const key = `outfit-${++this.serial}`;
          this.load.image(key, src);
          this.load.once(`filecomplete-image-${key}`, () => { if (this.player) { this.player.setTexture(key).setDisplaySize(140, 140); this.base = this.player.scaleX; } const old = this.avatarKey; this.avatarKey = key; if (old !== "lion") this.textures.remove(old); });
          this.load.start();
        }
      }
      game = new P.Game({ type: P.AUTO, parent: element, transparent: true, width: element.clientWidth, height: element.clientHeight, scale: { mode: P.Scale.RESIZE, autoCenter: P.Scale.CENTER_BOTH }, scene: World, render: { antialias: true }, audio: { noAudio: true }, input: { keyboard: { capture: [37, 38, 39, 40, 32] } } });
      const resize = new ResizeObserver(() => game?.scale.resize(element.clientWidth, element.clientHeight)); resize.observe(element);
      game.events.once("destroy", () => resize.disconnect());
    });
    return () => { disposed = true; live.current.controls.current = null; sceneRef.current = null; game?.destroy(true); };
  }, []);
  useEffect(() => { const scene = sceneRef.current as (Phaser.Scene & { setAvatar?: (src: string) => void }) | null; scene?.setAvatar?.(props.avatar); }, [props.avatar]);
  return <div ref={host} className="absolute inset-0 touch-none" role="img" aria-label={`Treasure world: ${props.state.zone}. Monere at ${props.state.x}, ${props.state.y}.`} />;
}