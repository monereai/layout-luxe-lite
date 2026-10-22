import { useEffect, useRef, type MutableRefObject } from "react";
import type Phaser from "phaser";
import meadow from "@/assets/treasure/meadow.jpg";
import forest from "@/assets/treasure/forest.jpg";
import sky from "@/assets/treasure/sky.jpg";
import chest from "@/assets/treasure/chest.png";
import { PORTALS, RELICS, TILE_SIZE, walkable, type AdventureState, type Position } from "@/lib/treasure";

export type WorldControls = { direction: (x: number, y: number) => void; release: () => void; pause: (paused: boolean) => void; seek: (position: Position) => void };
type Props = { state: AdventureState; revision: number; avatar: string; controls: MutableRefObject<WorldControls | null>; onMove: (position: Position) => void; onInteract: () => void };
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
        portals: Phaser.GameObjects.Container[] = [];
        keys: Record<string, Phaser.Input.Keyboard.Key> | undefined;
        direction = { x: 0, y: 0 }; paused = false; moving = false; path: Position[] = []; lastState = ""; avatarKey = "lion"; serial = 0;
        preload() { this.load.image("meadow", meadow); this.load.image("forest", forest); this.load.image("sky", sky); this.load.image("chest", chest); this.load.image("lion", live.current.avatar); }
        create() {
          sceneRef.current = this;
          this.background = this.add.image(768, 768, live.current.state.zone).setDisplaySize(1536, 1536);
          this.player = this.add.image(0, 0, "lion").setDisplaySize(140, 140).setOrigin(.5, .8).setDepth(10);
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
          if (!walkable(live.current.state.zone, target.x, target.y)) return;
          const s = live.current.state; const open: Position[][] = [[{ x: s.x, y: s.y }]]; const seen = new Set([`${s.x},${s.y}`]);
          for (let i = 0; i < open.length; i++) {
            const path = open[i]; const end = path?.at(-1); if (!path || !end) continue;
            if (end.x === target.x && end.y === target.y) { this.path = path.slice(1); return; }
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const next = { x: end.x + (dx ?? 0), y: end.y + (dy ?? 0) }; const key = `${next.x},${next.y}`; if (!seen.has(key) && walkable(s.zone, next.x, next.y)) { seen.add(key); open.push([...path, next]); } }
          }
        }
        sync(force = false) {
          const s = live.current.state; const key = `${s.zone}:${s.relics.join()}:${s.gear.join()}:${live.current.revision}`;
          if (key === this.lastState && !force) return;
          const changedZone = this.lastState.split(":")[0] !== s.zone || this.lastState.split(":")[3] !== String(live.current.revision);
          this.lastState = key;
          this.background?.setTexture(s.zone);
          if (changedZone || force) { this.path = []; this.player?.setPosition((s.x + .5) * TILE_SIZE, (s.y + .5) * TILE_SIZE); this.cameras.main.centerOn((s.x + .5) * TILE_SIZE, (s.y + .5) * TILE_SIZE); }
          this.markers.forEach(m => m.destroy()); this.markers = [];
          this.portals.forEach(p => p.destroy()); this.portals = [];
          RELICS.filter(r => r.zone === s.zone && !s.relics.includes(r.id) && (!r.requires || s.gear.includes(r.requires))).forEach(r => {
            const marker = this.add.image((r.x + .5) * 64, (r.y + .5) * 64, "chest").setDisplaySize(57, 57).setDepth(3).setInteractive({ useHandCursor: true });
            marker.on("pointerdown", (_: unknown, __: unknown, ___: unknown, event: Phaser.Types.Input.EventData) => { event.stopPropagation(); if (!this.paused) this.seek(r); });
            if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) this.tweens.add({ targets: marker, y: marker.y - 5, alpha: .8, duration: 1300, yoyo: true, repeat: -1 });
            this.markers.push(marker);
          });
          PORTALS[s.zone].forEach(p => {
            const ring = this.add.text(0, 0, s.unlocked.includes(p.target) ? "🌀" : "🔒", { fontSize: "44px" }).setOrigin(.5);
            const label = this.add.text(0, 34, p.target === "forest" ? "FOREST" : p.target === "sky" ? "SKY ISLES" : "MEADOW", { fontFamily: "Nunito", fontSize: "12px", backgroundColor: getComputedStyle(document.documentElement).getPropertyValue("--background").trim(), padding: { x: 8, y: 4 } }).setOrigin(.5);
            const node = this.add.container((p.x + .5) * 64, (p.y + .5) * 64, [ring, label]); this.portals.push(node);
          });
        }
        override update() {
          if (!this.player) return;
          this.sync();
          if (this.paused || this.moving) return;
          const keys = this.keys;
          let dx = this.direction.x; let dy = this.direction.y;
          if (keys?.['LEFT']?.isDown || keys?.['A']?.isDown) dx = -1; else if (keys?.['RIGHT']?.isDown || keys?.['D']?.isDown) dx = 1;
          if (keys?.['UP']?.isDown || keys?.['W']?.isDown) dy = -1; else if (keys?.['DOWN']?.isDown || keys?.['S']?.isDown) dy = 1;
          const s = live.current.state;
          const next = dx || dy ? { x: s.x + dx, y: s.y + (dx ? 0 : dy) } : this.path.shift();
          if (!next || !walkable(s.zone, next.x, next.y)) return;
          live.current.onMove(next);
          this.moving = true;
          this.player.setFlipX(next.x < s.x);
          this.tweens.add({ targets: this.player, x: (next.x + .5) * 64, y: (next.y + .5) * 64, duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 90 : 150, onComplete: () => { this.moving = false; } });
        }
        setAvatar(src: string) {
          const key = `outfit-${++this.serial}`;
          this.load.image(key, src);
          this.load.once(`filecomplete-image-${key}`, () => { this.player?.setTexture(key); const old = this.avatarKey; this.avatarKey = key; if (old !== "lion") this.textures.remove(old); });
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