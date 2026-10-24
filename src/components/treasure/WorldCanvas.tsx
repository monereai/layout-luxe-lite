import { useEffect, useRef, type MutableRefObject } from "react";
import type Phaser from "phaser";
import meadowExtension from "@/assets/treasure/meadow-extension.jpg";
import garden from "@/assets/treasure/garden.jpg";
import meadow from "@/assets/treasure/meadow.jpg";
import forest from "@/assets/treasure/forest.jpg";
import ravine from "@/assets/treasure/ravine.jpg";
import lair from "@/assets/treasure/lair.jpg";
import razor from "@/assets/treasure/razor.png";
import vernon from "@/assets/treasure/vernon.png";
import { ELEMENTAL_GATES, MAP_TREES } from "@/lib/orchard";
import griffin from "@/assets/pets/golden-griffin.png";
import { worldRows, portalOpen, PORTALS, SCROLLS, SCROLL_COVERS, DUEL_TILES, DUEL_START, LAIR_DOOR, RAZOR, CAGE, TILE_SIZE, SCROLL_REVEAL, NPCS, ITEMS, DIGS, BELL, LILY_ROWS, PLATE_HERO, PLATE_PET, TRAPS, sessionDigs, canStep, worldPath, inChasm, onPlatform, isRevealed, itemVisible, type AdventureState, type Position } from "@/lib/treasure";

import { advanceAlong, easeVector, slideDirection, cornerTurn, boostRetryDelay, walkPose, walkBounce, walkHop, sprintActive, SPRINT_MULTIPLIER, stepStamina, STAMINA_MAX } from "@/lib/movement";

export type WorldEffect = { kind: "gust" | "victory" | "rumble" | null; n: number };
export type WorldControls = { direction: (x: number, y: number) => void; release: () => void; pause: (paused: boolean) => void; seek: (position: Position) => void };
type Props = { state: AdventureState; revision: number; avatar: string; energy: number; controls: MutableRefObject<WorldControls | null>; onBoost: (mode: "sprint" | "dash") => Promise<boolean>; onMove: (position: Position) => void; figure: MutableRefObject<HTMLDivElement | null>; pet: MutableRefObject<HTMLDivElement | null>; onInteract: () => void; onNotice: (message: string) => void; effect: WorldEffect };
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
        velocity = { x: 0, y: 0 }; target: Position | null = null; sprintUntil = 0; dashUntil = 0; boosting = false; boostGeneration = 0; retryAt = { sprint: 0, dash: 0 }; lastTap = { key: "", time: 0 }; turnInput = { x: 0, y: 0 }; turnUntil = 0; stamina = STAMINA_MAX; staminaBar: Phaser.GameObjects.Graphics | null = null;
        pathTarget = false; walkElapsed = 0; effectN = 0; lastLily = -1; fog?: Phaser.GameObjects.Image;
        preload() { this.load.image("meadow-extension", meadowExtension); this.load.image("garden", garden); this.load.image("meadow", meadow); this.load.image("wood", forest); this.load.image("ravine", ravine); this.load.image("lair", lair); this.load.image("razor", razor); this.load.image("vernon", vernon); this.load.image("griffin", griffin); this.load.image("lion", live.current.avatar); }
        create() {
          sceneRef.current = this;
          // Oversized base layer so no empty canvas shows past the map edges while the camera eases.
          this.background = this.add.image(768, 768, live.current.state.zone).setDisplaySize(1536, 1536).setDepth(0);
          this.cameras.main.setRoundPixels(true);
          this.player = this.add.image(0, 0, "lion").setDisplaySize(140, 140).setOrigin(.5, .8).setDepth(10).setAlpha(0);
          this.base = this.player.scaleX; this.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          this.shadow = this.add.ellipse(0, 0, 70, 18, 0x000000, .28).setDepth(9);
          const fitCamera = () => this.cameras.main.setZoom(Math.max(.85, this.scale.width / 1536, this.scale.height / 1536));
          this.cameras.main.setBounds(0, 0, 1536, 1536);
          fitCamera(); this.scale.on("resize", fitCamera);
          this.cameras.main.startFollow(this.player, false, .12, .12);
          this.keys = this.input.keyboard?.addKeys("UP,DOWN,LEFT,RIGHT,W,A,S,D,E,SPACE,SHIFT") as Record<string, Phaser.Input.Keyboard.Key> | undefined;
          this.input.keyboard?.on("keydown", (event: KeyboardEvent) => {
            const key = event.key.toLowerCase();
            const input = ({ arrowup: { x: 0, y: -1 }, w: { x: 0, y: -1 }, arrowdown: { x: 0, y: 1 }, s: { x: 0, y: 1 }, arrowleft: { x: -1, y: 0 }, a: { x: -1, y: 0 }, arrowright: { x: 1, y: 0 }, d: { x: 1, y: 0 } } as Record<string, Position>)[key];
            if (event.repeat || this.paused || !input) return;
            const now = this.time.now;
            this.turnInput = input; this.turnUntil = now + 200;
            if (this.lastTap.key === key && now - this.lastTap.time < 280) void this.boost("dash");
            this.lastTap = { key, time: now };
          });
          this.input.keyboard?.on("keydown-E", () => { if (!this.paused) live.current.onInteract(); });
          this.input.keyboard?.on("keydown-SPACE", () => { if (!this.paused) live.current.onInteract(); });
          this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => { if (!this.paused) this.seek({ x: Math.floor(pointer.worldX / 64), y: Math.floor(pointer.worldY / 64) }); });
          live.current.controls.current = { direction: (x, y) => { if (this.paused) return; const key = `${x},${y}`, now = this.time.now; if (this.lastTap.key === key && now - this.lastTap.time < 280) void this.boost("dash"); this.lastTap = { key, time: now }; this.turnInput = { x, y }; this.turnUntil = now + 200; this.direction = { x, y }; this.path = []; }, release: () => { this.direction = { x: 0, y: 0 }; }, pause: paused => { this.paused = paused; if (paused) { this.boostGeneration++; this.turnUntil = 0; this.target = null; this.velocity = { x: 0, y: 0 }; const s = live.current.state; this.player?.setPosition((s.x + .5) * TILE_SIZE, (s.y + .5) * TILE_SIZE); } this.direction = { x: 0, y: 0 }; this.path = []; }, seek: position => this.seek(position) };
          this.sync(true);
          this.game.events.on(P.Core.Events.BLUR, () => { this.direction = { x: 0, y: 0 }; this.path = []; });
        }
        seek(target: Position) {
          const s = live.current.state;
          const notify = live.current.onNotice;
          if (s.zone === "lair" && target.y <= 10 && !s.gates.includes("lair")) {
            this.path = worldPath(s, { x: LAIR_DOOR.x, y: LAIR_DOOR.y + 1 }) ?? [];
            notify(s.scrolls.includes("lair") ? "Answer the inner door's riddle to reach Razor's answer stones." : "Find the Scroll of Wisdom on the ledge first, then unlock the inner door.");
            return;
          }
          if (s.zone === "lair" && inChasm(target.x, target.y) && !s.gear.includes("goggles")) {
            notify("Get the Goggles of Truth from Rocco in Shadow Ravine to cross to the ledge."); return;
          }
          const path = worldPath(s, target);
          if (path) this.path = path;
          else if (s.zone === "lair") notify("That is the chasm edge. Follow the stone crossing to the ledge.");
        }
        sync(force = false) {
          const s = live.current.state; const key = `${s.zone}:${live.current.revision}:${s.x},${s.y}:${s.scrolls.join()}:${s.gates.join()}:${s.duel}:${s.rescued}:${s.gear.join()}:${s.items.length}:${s.dug.length}:${s.lily}:${s.pet ? 1 : 0}:${s.quests.length}:${s.met.length}:${(s.fog[s.zone] ?? []).length}`;
          const fx = live.current.effect;
          if (fx.n !== this.effectN) { this.effectN = fx.n; if (fx.kind === "gust") this.gust(); if (fx.kind === "victory") this.victory(); if (fx.kind === "rumble") this.rumble(); }
          if (key === this.lastState && !force) return;
          const changedZone = this.lastState.split(":")[0] !== s.zone || this.lastState.split(":")[1] !== String(live.current.revision);
          this.lastState = key;
          this.background?.setTexture(s.zone);
          this.cameras.main.setBounds(0, 0, 1536, worldRows(s.zone) * 64);
          const far = this.player && Math.abs(this.player.x - (s.x + .5) * TILE_SIZE) + Math.abs(this.player.y - (s.y + .5) * TILE_SIZE) > TILE_SIZE * 1.5;
          if (changedZone || force || (far && !this.moving)) { this.boostGeneration++; this.turnUntil = 0; this.path = []; this.trail = []; this.direction = { x: 0, y: 0 }; if (this.player) this.tweens.killTweensOf(this.player); this.moving = false; this.target = null; this.velocity = { x: 0, y: 0 }; this.player?.setPosition((s.x + .5) * TILE_SIZE, (s.y + .5) * TILE_SIZE); if (changedZone || force) this.cameras.main.centerOn((s.x + .5) * TILE_SIZE, (s.y + .5) * TILE_SIZE); }
          this.portals.forEach(p => p.destroy()); this.portals = [];
          this.scenery.forEach(item => item.destroy()); this.scenery = [];
          const hex = (token: string) => { const c = document.createElement("canvas").getContext("2d"); if (!c) return "#888888"; c.fillStyle = getComputedStyle(document.documentElement).getPropertyValue(token).trim() || "#888"; c.fillRect(0, 0, 1, 1); const [r, g, b] = c.getImageData(0, 0, 1, 1).data; return `#${[r, g, b].map(v => (v ?? 0).toString(16).padStart(2, "0")).join("")}`; };
          const color = (token: string) => P.Display.Color.HexStringToColor(hex(token)).color;
          const at = (p: Position) => [(p.x + .5) * 64, (p.y + .5) * 64] as const;
          const text = (p: Position, t: string, size = 36) => { const o = this.add.text(...at(p), t, { fontSize: `${size}px` }).setOrigin(.5).setDepth(3); this.scenery.push(o); return o; };
          if (s.zone !== "garden" && !s.scrolls.includes(s.zone)) {
            // The scroll hides inside a landscape prop; it only peeks out when Monere is right beside it.
            text(SCROLLS[s.zone], SCROLL_COVERS[s.zone], 52);
            if (Math.abs(SCROLLS[s.zone].x - s.x) + Math.abs(SCROLLS[s.zone].y - s.y) <= SCROLL_REVEAL) {
              const scroll = text(SCROLLS[s.zone], "📜", 30).setDepth(4).setInteractive({ useHandCursor: true });
              scroll.setPosition(at(SCROLLS[s.zone])[0] + 12, at(SCROLLS[s.zone])[1] - 14);
              scroll.on("pointerdown", (_: unknown, __: unknown, ___: unknown, event: Phaser.Types.Input.EventData) => { event.stopPropagation(); if (!this.paused) this.seek(SCROLLS[s.zone]); });
            }
          }
          const rect = (x: number, y: number, w: number, h: number, c: number, a: number, depth = 1) => { const r = this.add.rectangle(x * 64 + w * 32, y * 64 + h * 32, w * 64, h * 64, c, a).setDepth(depth); this.scenery.push(r); return r; };
          if (s.zone === "meadow") {
            // Overlap the original bank with a feathered texture edge so the scenery
            // stays continuous without stretching the original map or moving its bridge.
            const key = "meadow-extension-blended";
            if (!this.textures.exists(key)) {
              const texture = this.textures.createCanvas(key, 1536, 576);
              if (texture) {
                const ctx = texture.getContext();
                ctx.drawImage(this.textures.get("meadow-extension").getSourceImage() as HTMLImageElement, 0, 0, 1536, 576);
                ctx.globalCompositeOperation = "destination-in";
                const edge = ctx.createLinearGradient(0, 0, 0, 64);
                edge.addColorStop(0, "rgba(0,0,0,0)"); edge.addColorStop(1, "rgba(0,0,0,1)");
                ctx.fillStyle = edge; ctx.fillRect(0, 0, 1536, 576); texture.refresh();
              }
            }
            const extension = this.add.image(768, 1760, key).setDisplaySize(1536, 576).setDepth(0); this.scenery.push(extension);
          }
          // Map text labels are intentionally disabled: hints live in the quest log and on-tap messages.
          const label = (_p: Position, _t: string) => {};
          const bob = (o: Phaser.GameObjects.Text) => { if (!this.reduced) this.tweens.add({ targets: o, y: o.y - 5, duration: 1100, yoyo: true, repeat: -1, ease: "Sine.easeInOut" }); return o; };
          // Energy Orchards: sealed elemental gates and Energy Trees (actionable via the interact button).
          ELEMENTAL_GATES.filter(g => g.zone === s.zone).forEach(g => bob(text(g.at, g.icon, 44)));
          MAP_TREES.filter(t => t.zone === s.zone).forEach(t => { text(t.at, "🌳", 65); text(t.at, "🍎", 11).setPosition(...at(t.at)).setX(at(t.at)[0] - 13).setY(at(t.at)[1] - 12).setDepth(4); text(t.at, "🍐", 10).setX(at(t.at)[0] + 14).setY(at(t.at)[1] - 6).setDepth(4); });
          if (s.zone === "wood") {
            // Dark cave (north-east): a soft radial shadow, never a rectangular tint box.
            const lit = s.gear.includes("lantern");
            const cave = this.add.circle(20 * 64, 4.5 * 64, 150, 0x05040a, lit ? .18 : .55).setDepth(2); this.scenery.push(cave);
            if (lit) { const glow = this.add.circle(20 * 64, 4 * 64, 150, color("--points"), .12).setDepth(2); this.scenery.push(glow); } else text({ x: 19, y: 4 }, "🌑", 40);
            label({ x: 19, y: 6 }, lit ? "Lit cave" : "Dark cave · needs Lantern");
            // Moving lily pads on the river (no flat colour overlay).
            [17, 18].forEach((row, r) => { const pad = text({ x: LILY_ROWS[r]![s.lily]!, y: row }, "🪷", 46); const prev = LILY_ROWS[r]![(s.lily + 2) % 3]!; if (!this.reduced && this.lastLily !== s.lily) { pad.x = (prev + .5) * 64; this.tweens.add({ targets: pad, x: (LILY_ROWS[r]![s.lily]! + .5) * 64, duration: 700, ease: "Sine.easeInOut" }); } });
            this.lastLily = s.lily; text(BELL, "🛎️", 36); label(BELL, "Frog bell");
          }
          if (s.zone === "ravine") {
            const boots = s.gear.includes("boots"); text({ x: 17, y: 6 }, boots ? "🧗" : "⛰️", 36); label({ x: 17, y: 6 }, boots ? "Cliffs" : "Cliffs · needs Climbing Boots");
            const vault = s.quests.includes("vault");
            // Plates keep their coloured circles only; decorative emblems (lion head, temple pillar) are hidden.
            [PLATE_HERO, PLATE_PET].forEach((pl, i) => { const c = this.add.circle(...at(pl), 24, i ? color("--energy") : color("--points"), vault ? .2 : .45).setStrokeStyle(3, i ? color("--energy") : color("--points")).setDepth(2); this.scenery.push(c); });
          }
          if (s.zone === "lair") {
            const goggles = s.gear.includes("goggles");
            // Keep the floor art unobstructed: a feathered pit and separate stone slabs,
            // never large coloured rectangles over the terrain.
            const pitKey = "lair-pit";
            if (!this.textures.exists(pitKey)) {
              const texture = this.textures.createCanvas(pitKey, 512, 448);
              if (texture) {
                const ctx = texture.getContext(); const shade = ctx.createRadialGradient(256, 224, 50, 256, 224, 270);
                shade.addColorStop(0, hex("--adventure-pit")); shade.addColorStop(1, "transparent");
                ctx.fillStyle = shade; ctx.fillRect(0, 0, 512, 448); texture.refresh();
              }
            }
            const pit = this.add.image(6 * 64, 15.5 * 64, pitKey).setAlpha(.26).setDepth(1); this.scenery.push(pit);
            // No slab tile grid: Monere walks directly on the floor artwork.
            void goggles; void onPlatform;
          }
          // Human NPCs are drawn from full-body artwork: emoji people glyphs render as head-and-shoulders busts.
          const npcSprite: Record<string, string> = { vernon: "vernon" };
          NPCS.filter(n => n.zone === s.zone).forEach(n => {
            const key = npcSprite[n.id];
            if (key && this.textures.exists(key)) {
              const o = this.add.image(...at(n), key).setDisplaySize(105.6, 105.6).setOrigin(.5, .62).setDepth(3); this.scenery.push(o);
              if (!this.reduced) this.tweens.add({ targets: o, y: o.y - 5, duration: 1100, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
            } else bob(text(n, n.icon, 50));
            label(n, n.name.split(" ")[0]!); if (!s.quests.includes(n.id)) text({ x: n.x, y: n.y - 1 }, s.met.includes(n.id) ? "💬" : "❗", 26);
          });
          ITEMS.filter(i => i.zone === s.zone && !s.items.includes(i.id) && itemVisible(s, i) && (s.zone !== "wood" || i.id !== "acorn-2" || s.gear.includes("lantern"))).forEach(i => { const o = bob(text(i, i.icon, 34)); if (i.id.startsWith("seed-")) o.setDepth(8); if (!this.reduced) this.tweens.add({ targets: o, angle: 8, duration: 700, yoyo: true, repeat: -1 }); });
          sessionDigs(s).filter(d => d.zone === s.zone).forEach(d => { const done = s.dug.includes(d.id); const m = this.add.ellipse(...at(d), 46, 20, 0x5a3a1c, done ? .35 : .8).setDepth(2); this.scenery.push(m); if (!done) { const x = text(d, "✖", 22); x.setY(x.y - 2); if (!this.reduced) this.tweens.add({ targets: x, alpha: .4, duration: 800, yoyo: true, repeat: -1 }); } });
          // Fog of war: one soft-edged canvas mask over the whole map. Terrain stays faintly visible underneath,
          // and each explored chunk is erased with a radial gradient so edges blend instead of forming dark blocks.
          const FOG = 512, k = FOG / (worldRows(s.zone) * 64); const fogTex = (this.textures.exists("fog") ? this.textures.get("fog") : this.textures.createCanvas("fog", FOG, FOG)) as Phaser.Textures.CanvasTexture;
          const ctx = fogTex.getContext(); ctx.globalCompositeOperation = "source-over"; ctx.clearRect(0, 0, FOG, FOG); ctx.fillStyle = "rgba(20, 16, 12, 0.8)"; ctx.fillRect(0, 0, FOG, FOG);
          ctx.globalCompositeOperation = "destination-out";
          for (let cx = 0; cx < 6; cx++) for (let cy = 0; cy < worldRows(s.zone) / 4; cy++) if (isRevealed(s, s.zone, cx * 4, cy * 4)) {
            const gx = (cx * 4 + 2) * 64 * k, gy = (cy * 4 + 2) * 64 * k, r = 256 * 1.15 * k; const grad = ctx.createRadialGradient(gx, gy, r * .35, gx, gy, r);
            grad.addColorStop(0, "rgba(0,0,0,1)"); grad.addColorStop(1, "rgba(0,0,0,0)"); ctx.fillStyle = grad; ctx.fillRect(gx - r, gy - r, r * 2, r * 2);
          }
          ctx.globalCompositeOperation = "source-over"; fogTex.refresh();
          if (!this.fog) this.fog = this.add.image(0, 0, "fog").setOrigin(0).setDepth(7);
          this.fog.setDisplaySize(worldRows(s.zone) * 64, worldRows(s.zone) * 64);
          if (s.zone === "lair") {
            if (!s.gates.includes("lair")) { const door = this.add.text((LAIR_DOOR.x + .5) * 64, 10 * 64, s.scrolls.includes("lair") ? "❓" : "🔒", { fontSize: "32px" }).setOrigin(.5).setDepth(4); this.scenery.push(door); }
            DUEL_TILES.forEach((t, i) => {
              const [cx, cy] = at(t); const g = this.add.graphics().setDepth(2); this.scenery.push(g);
              const gold = color("--points"), deep = color("--adventure-stone");
              g.fillStyle(gold, s.rescued ? .12 : .28).fillRoundedRect(cx - 34, cy - 34, 68, 68, 16); // outer glow
              g.fillStyle(0x000000, .35).fillRoundedRect(cx - 27, cy - 23, 56, 56, 12); // drop shadow
              g.fillStyle(deep, .95).fillRoundedRect(cx - 28, cy - 28, 56, 56, 12); // stone body
              // bevel: lit top-left rim, shaded bottom-right rim, recessed face
              g.fillStyle(0xffffff, .22).fillRoundedRect(cx - 28, cy - 28, 56, 10, { tl: 12, tr: 12, bl: 0, br: 0 });
              g.fillStyle(0xffffff, .14).fillRect(cx - 28, cy - 20, 6, 36);
              g.fillStyle(0x000000, .28).fillRoundedRect(cx - 28, cy + 20, 56, 8, { tl: 0, tr: 0, bl: 12, br: 12 });
              g.fillStyle(0x000000, .18).fillRect(cx + 22, cy - 20, 6, 40);
              g.fillStyle(0x000000, .12).fillRoundedRect(cx - 21, cy - 19, 43, 40, 7);
              // carved-stone texture: deterministic speckles and two hairline cracks
              for (let k = 0; k < 14; k++) { const h = Math.sin((i + 1) * 97.3 + k * 12.9898) * 43758.5453; const fx = h - Math.floor(h); const fy = (h * 7.13) - Math.floor(h * 7.13); g.fillStyle(k % 2 ? 0xffffff : 0x000000, k % 2 ? .1 : .16).fillCircle(cx - 18 + fx * 36, cy - 18 + fy * 36, 1 + (k % 3) * .5); }
              g.lineStyle(1, 0x000000, .22).beginPath().moveTo(cx - 20, cy - 8 + i * 3).lineTo(cx - 12, cy - 4 + i * 2).lineTo(cx - 8, cy + 2).strokePath();
              g.lineStyle(1, 0x000000, .18).beginPath().moveTo(cx + 18, cy + 12 - i * 2).lineTo(cx + 11, cy + 8).lineTo(cx + 9, cy + 16).strokePath();
              g.lineStyle(3, gold, 1).strokeRoundedRect(cx - 28, cy - 28, 56, 56, 12);
              g.lineStyle(1.5, gold, .55).strokeRoundedRect(cx - 21, cy - 21, 42, 42, 8);
              const label = this.add.text(cx, cy, "ABC"[i]!, { fontSize: "30px", fontFamily: "Fredoka, sans-serif", fontStyle: "700", color: hex("--points"), stroke: "#3a2200", strokeThickness: 5 }).setOrigin(.5).setDepth(3);
              label.setShadow(0, 2, "#000", 4, true, true); this.scenery.push(label);
              if (!this.reduced && !s.rescued) { this.tweens.add({ targets: [g, label], alpha: .78, duration: 900 + i * 150, yoyo: true, repeat: -1, ease: "Sine.easeInOut" }); }
            });
            if (!s.rescued) { const hy = this.add.image(...at(RAZOR), "razor").setDisplaySize(130, 130).setDepth(5); this.scenery.push(hy); }
            const [gx, gy] = at(CAGE);
            const g = this.add.image(gx, gy, "griffin").setDisplaySize(72, 72).setDepth(5); this.scenery.push(g);
            if (!s.rescued) {
              // Styled cage: dark metallic bars with top/bottom frame and a gold lock.
              const cage = this.add.graphics().setDepth(6); this.scenery.push(cage);
              const w = 84, h = 92, l = gx - w / 2, t = gy - h / 2;
              cage.fillStyle(0x000000, .25).fillRoundedRect(l + 3, t + 4, w, h, 8);
              for (let i = 0; i < 6; i++) { const bx = l + 8 + i * ((w - 16) / 5); cage.fillStyle(0x2b2d33, 1).fillRect(bx - 2.5, t + 8, 5, h - 16); cage.fillStyle(0x9aa0aa, .55).fillRect(bx - 2.5, t + 8, 1.5, h - 16); }
              [t, t + h - 10].forEach(y => { cage.fillStyle(0x3a3d45, 1).fillRoundedRect(l, y, w, 10, 4); cage.fillStyle(0xb8bec8, .4).fillRect(l + 3, y + 1, w - 6, 2); });
              cage.fillStyle(0x3a3d45, 1).fillRoundedRect(l - 4, t - 8, w + 8, 8, 4);
              cage.fillStyle(color("--points"), 1).fillRoundedRect(gx - 9, gy + 4, 18, 15, 3);
              cage.lineStyle(3, color("--points"), 1).beginPath().arc(gx, gy + 4, 6, Math.PI, 0).strokePath();
              cage.fillStyle(0x3a2200, 1).fillCircle(gx, gy + 10, 2.2).fillRect(gx - 1, gy + 10, 2, 5);
            }
          }
          PORTALS[s.zone].forEach(p => {
            const open = portalOpen(s, p);
            const ring = this.add.text(0, 0, p.target === "garden" ? open ? "🌸" : "🔒" : open ? "🌀" : s.scrolls.includes(s.zone) ? "❓" : "🔒", { fontSize: "44px" }).setOrigin(.5);
            const label = this.add.text(0, 34, p.target === "garden" ? "VERNON’S GARDEN" : p.target === "wood" ? "LONELY WOOD" : p.target === "ravine" ? "SHADOW RAVINE" : p.target === "lair" ? "RAZOR'S LAIR" : "MEADOW", { fontFamily: "Nunito", fontSize: "12px", color: getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim(), backgroundColor: getComputedStyle(document.documentElement).getPropertyValue("--background").trim(), padding: { x: 8, y: 4 } }).setOrigin(.5);
            const node = this.add.container((p.x + .5) * 64, (p.y + .5) * 64, [ring, label]).setDepth(4); this.portals.push(node);
          });
        }
        gust() {
          const p = this.player; if (!p) return;
          for (let i = 0; i < 10; i++) { const w = this.add.text(p.x + (Math.random() - .5) * 80, p.y - 40 + Math.random() * 60, "〰", { fontSize: "28px" }).setDepth(12).setAlpha(.9); this.tweens.add({ targets: w, y: w.y + 90, alpha: 0, duration: 600 + Math.random() * 300, onComplete: () => w.destroy() }); }
          this.cameras.main.shake(250, .004);
        }
        rumble() {
          if (this.reduced) return;
          this.cameras.main.shake(700, .012);
          for (let i = 0; i < 14; i++) { const d = this.add.text((CAGE.x + .5) * 64 + (Math.random() - .5) * 360, (CAGE.y + .5) * 64 - 40 + (Math.random() - .5) * 160, ["🪨", "✦", "•"][i % 3]!, { fontSize: "18px" }).setDepth(12); this.tweens.add({ targets: d, y: d.y + 110 + Math.random() * 90, angle: Math.random() * 180 - 90, alpha: 0, duration: 650 + Math.random() * 400, onComplete: () => d.destroy() }); }
        }
        victory() {
          const hy = this.scenery.find(o => (o as Phaser.GameObjects.Image).texture?.key === "razor") as Phaser.GameObjects.Image | undefined;
          if (hy) this.tweens.add({ targets: hy, x: -200, alpha: 0, duration: 1400 });
          for (let i = 0; i < 24; i++) { const c = this.add.text((CAGE.x + .5) * 64, (CAGE.y + .5) * 64, ["✨", "⭐", "🎉"][i % 3]!, { fontSize: "26px" }).setDepth(12); this.tweens.add({ targets: c, x: c.x + (Math.random() - .5) * 400, y: c.y + (Math.random() - .5) * 400, alpha: 0, duration: 1400, onComplete: () => c.destroy() }); }
        }
        async boost(mode: "sprint" | "dash") {
          if (this.boosting || this.paused || this.time.now < this.retryAt[mode]) return;
          this.retryAt[mode] = this.time.now + boostRetryDelay(mode);
          const generation = this.boostGeneration;
          this.boosting = true;
          try { if (await live.current.onBoost(mode) && generation === this.boostGeneration && !this.paused) { if (mode === "dash") this.dashUntil = this.time.now + 220; else if (this.keys?.['SHIFT']?.isDown) this.sprintUntil = this.time.now + 1000; } }
          catch { /* ordinary movement remains available */ } finally { this.boosting = false; }
        }
        override update(_time: number, delta: number) {
          const p = this.player; if (!p) return;
          this.sync();
          const dt = Math.min(delta, 50) / 1000;
          const keys = this.keys;
          let dx = this.direction.x, dy = this.direction.y;
          if (keys?.['LEFT']?.isDown || keys?.['A']?.isDown) dx = -1; else if (keys?.['RIGHT']?.isDown || keys?.['D']?.isDown) dx = 1;
          if (keys?.['UP']?.isDown || keys?.['W']?.isDown) dy = -1; else if (keys?.['DOWN']?.isDown || keys?.['S']?.isDown) dy = 1;
          if (this.paused) { dx = 0; dy = 0; this.path = []; }
          if (!this.target && !this.paused) {
            const s = live.current.state;
            const buffered = this.time.now < this.turnUntil ? slideDirection(s, this.turnInput, (x, y) => canStep(s, x, y)) : null;
            const slide = buffered ?? slideDirection(s, { x: dx, y: dy }, (x, y) => canStep(s, x, y));
            const next = slide ? { x: s.x + slide.x, y: s.y + slide.y } : dx || dy ? undefined : this.path.shift();
            if (next && canStep(s, next.x, next.y)) {
              this.pathTarget = !dx && !dy && !buffered;
              if (buffered) this.turnUntil = 0;
              this.target = { x: (next.x + .5) * 64, y: (next.y + .5) * 64 };
              this.facing = next.x > s.x ? "east" : next.x < s.x ? "west" : next.y < s.y ? "north" : "south";
            }
          }
          const intent = !this.paused && (dx || dy || this.pathTarget || this.path.length || this.time.now < this.turnUntil);
          const wantsSprint = !this.paused && !!this.target && !!intent && !!keys?.['SHIFT']?.isDown && this.stamina > 0 && live.current.energy > 0;
          const sprinting = sprintActive(wantsSprint, !!this.target, live.current.energy, this.stamina, this.sprintUntil, this.time.now);
          this.stamina = stepStamina(this.stamina, sprinting, !intent && Math.hypot(this.velocity.x, this.velocity.y) < 2, dt);
          if (wantsSprint && this.time.now >= this.sprintUntil) void this.boost("sprint");
          const multiplier = this.time.now < this.dashUntil ? 3 : sprinting && this.stamina > 0 ? SPRINT_MULTIPLIER : 1;
          live.current.figure.current?.setAttribute("data-speed-multiplier", String(multiplier));
          const speed = this.target && intent ? 305 * multiplier : 0;
          const offset = this.target ? { x: this.target.x - p.x, y: this.target.y - p.y } : { x: 0, y: 0 };
          const distance = Math.hypot(offset.x, offset.y);
          this.velocity = easeVector(this.velocity, distance ? { x: offset.x / distance * speed, y: offset.y / distance * speed } : { x: 0, y: 0 }, dt);
          if (this.target && this.time.now < this.turnUntil) {
            const s = live.current.state, at = { ...s, x: Math.floor(this.target.x / 64), y: Math.floor(this.target.y / 64) };
            const perpendicular = offset.x ? this.turnInput.y !== 0 : this.turnInput.x !== 0;
            if (perpendicular && cornerTurn(p, this.target, this.turnInput, (x, y) => canStep(at, x, y), TILE_SIZE)) this.turnUntil = this.time.now + 200;
          }
          if (this.target) {
            const along = distance ? Math.max(0, (this.velocity.x * offset.x + this.velocity.y * offset.y) / distance) : 0;
            const next = advanceAlong(p, this.target, along, dt); p.setPosition(next.x, next.y);
            if (Math.hypot(p.x - this.target.x, p.y - this.target.y) < .5) {
              p.setPosition(this.target.x, this.target.y);
              live.current.onMove({ x: Math.floor(this.target.x / 64), y: Math.floor(this.target.y / 64) });
              this.target = null;
            }
          }
          this.moving = !!this.target && Math.hypot(this.velocity.x, this.velocity.y) > 2;
          this.animate();
          this.drawStamina();
        }
        drawStamina() {
          const p = this.player; if (!p) return;
          this.staminaBar ??= this.add.graphics().setDepth(9999);
          const g = this.staminaBar; g.clear();
          if (this.paused || (this.stamina >= STAMINA_MAX && !this.keys?.['SHIFT']?.isDown)) return;
          const w = 44, x = p.x - w / 2, y = p.y - 52;
          g.fillStyle(0x000000, .45).fillRoundedRect(x - 1, y - 1, w + 2, 7, 3);
          g.fillStyle(this.stamina < 25 ? 0xff7a59 : 0x00e5ff, 1).fillRoundedRect(x, y, w * this.stamina / STAMINA_MAX, 5, 2);
        }
        animate() {
          const p = this.player; const el = live.current.figure.current; if (!p) return;
          const keys = this.keys;
          const held = !!(this.direction.x || this.direction.y || ["LEFT", "RIGHT", "UP", "DOWN", "W", "A", "S", "D"].some(k => keys?.[k]?.isDown));
          const walking = !this.paused && this.moving;
          const cycleActive = !this.paused && (walking || held);
          this.walkElapsed = cycleActive ? this.walkElapsed + this.game.loop.delta : 0;
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
            el.dataset["walkFrame"] = String(walkPose(this.walkElapsed, cycleActive && !this.reduced));
            el.dataset["moving"] = walking ? "true" : "false";
            const body = el.firstElementChild as HTMLElement | null;
            if (body) {
              body.classList.remove("walk-bounce", "idle-breath");
              const hop = walkHop(this.time.now / 1000, cycleActive && !this.reduced);
              const breathe = !cycleActive && !this.reduced ? 1 + Math.sin(this.time.now / 600) * 0.012 : 1;
              body.style.transform = `translateY(${(hop.y + walkBounce(this.time.now / 1000, false)) * cam.zoom}px) scale(${hop.sx}, ${hop.sy * breathe})`;
            }
          }
          // Companion follows the path Monere walked half a second ago.
          const now = this.time.now; this.trail.push({ t: now, x: p.x, y: p.y, walking });
          while (this.trail.length > 2 && (this.trail[1]?.t ?? now) <= now - 500) this.trail.shift();
          const past = this.trail[0]; const pet = live.current.pet.current;
          if (pet && past) {
            const stay = live.current.state.pet; const found = this.trail.find(e => e.t >= now - 500) ?? past;
            const lag = stay ? { x: (stay.x + .5) * 64, y: (stay.y + .5) * 64, walking: false, t: now } : found;
            const px = lag.x; const py = lag.y;
            pet.style.transform = `translate(${(px - cam.worldView.x) * cam.zoom}px, ${(py - cam.worldView.y) * cam.zoom}px)`;
            pet.style.setProperty("--pet-size", `${70 * cam.zoom}px`);
            pet.dataset["facing"] = lag.x > p.x + 2 ? "west" : lag.x < p.x - 2 ? "east" : pet.dataset["facing"] ?? "east";
            const body = pet.firstElementChild; body?.classList.toggle("walk-bounce", lag.walking); body?.classList.toggle("idle-breath", !lag.walking);
          }
          if ((walking || cycleActive) && !this.reduced && this.time.now - this.lastStep > 220) { this.lastStep = this.time.now; this.dust(p.x, p.y + 6); }
        }
        dust(x: number, y: number) {
          for (let i = 0; i < 4; i++) {
            const puff = this.add.circle(x + (Math.random() - .5) * 30, y, 5 + Math.random() * 5, 0xd9c4a0, .7).setDepth(11);
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
      game = new P.Game({ type: P.AUTO, parent: element, backgroundColor: "#1d1710", width: element.clientWidth, height: element.clientHeight, scale: { mode: P.Scale.RESIZE, autoCenter: P.Scale.CENTER_BOTH }, scene: World, render: { antialias: true }, audio: { noAudio: true }, input: { keyboard: { capture: [37, 38, 39, 40, 32] } } });
      const resize = new ResizeObserver(() => game?.scale.resize(element.clientWidth, element.clientHeight)); resize.observe(element);
      game.events.once("destroy", () => resize.disconnect());
    });
    return () => { disposed = true; live.current.controls.current = null; sceneRef.current = null; game?.destroy(true); };
  }, []);
  useEffect(() => { const scene = sceneRef.current as (Phaser.Scene & { setAvatar?: (src: string) => void }) | null; scene?.setAvatar?.(props.avatar); }, [props.avatar]);
  return <div ref={host} className="absolute inset-0 touch-none" role="img" aria-label={`Treasure world: ${props.state.zone}. Monere at ${props.state.x}, ${props.state.y}.`} />;
}