import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { ClientOnly, Link, useNavigate } from "@tanstack/react-router";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Award, Backpack, BookOpen, Check, Compass, Flag, LockKeyhole, Map, Music, Music2, ScrollText, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { MonereFigure } from "@/components/MonereFigure";
import { PETS, usePets } from "@/lib/pets";
import { useAdventure } from "@/hooks/useAdventure";
import { worldRows, canEnter, portalOpen, ZONES, PORTALS, SCROLLS, sessionDigs, npcClue, gateRiddle, duelRiddle, NPCS, ITEMS, DIGS, DIG_ENERGY, GEAR, TREASURES, near, questClue, duelTileAt, duelLanding, interactionHere, sideQuests, isRevealed, worldPath, type ZoneId, type Npc, type AdventureState } from "@/lib/treasure";
import { equippedItems, useShop } from "@/lib/shop";
import { playBackgroundMusic, playSound, resumeBackgroundMusic, setMusicMuted, setSoundsMuted, stopBackgroundMusic } from "@/lib/audio";
import { combinationLook, itemsDrawnIn } from "@/lib/shop-combinations";
import { clothingFrames, composeCharacterFrame } from "@/lib/character-art";
import type { WorldControls, WorldEffect } from "./WorldCanvas";
import garden from "@/assets/treasure/garden.jpg";
import meadow from "@/assets/treasure/meadow.jpg";
import forest from "@/assets/treasure/forest.jpg";
import ravine from "@/assets/treasure/ravine.jpg";
import lair from "@/assets/treasure/lair.jpg";
import griffin from "@/assets/pets/golden-griffin.png";
import razor from "@/assets/treasure/razor.png";
import { SideZone } from "./SideZone";
import { useOrchardEnergy } from "@/hooks/useOrchardEnergy";
import { ELEMENTAL_GATES, SIDE_ZONES, canOpenGate, gateEnergyCost, gateNear, mapTreeNear, type SideZoneId, type TreeId } from "@/lib/orchard";
import { Zap } from "lucide-react";
import groveImg from "@/assets/treasure/grove.jpg";
import cavernsImg from "@/assets/treasure/caverns.jpg";
import petShopMark from "@/assets/shop/pet-shop.png";
import { saveHarvestRecord } from "@/lib/harvest-records";
import { SUPPORTER_PAYMENT_URL } from "@/lib/supporter";
import { createWalkingFrames } from "@/lib/walking-frames";
import { MAP_ENTRANCES, replayMaze, type MazeDirection } from "@/lib/harvest-maze";
import type { GardenInput } from "@/lib/garden-game";

const PacmanHarvestMiniGame = lazy(() => import("../PacmanHarvestMiniGame").then(m => ({ default: m.PacmanHarvestMiniGame })));
const WorldCanvas = lazy(() => import("./WorldCanvas").then(m => ({ default: m.WorldCanvas })));
const DonkeyKongMiniGame = lazy(() => import("./DonkeyKongMiniGame"));
const maps: Record<ZoneId, string> = { meadow, wood: forest, ravine, lair, garden };
const INTRO = "Razor the Hyena has stolen the Golden Griffin from the Pet Shop and fled to Lonely Wood! Help Monere and his companion collect the 4 hidden scrolls, solve the ancient gatekeeper riddles, and outsmart Razor in a final Riddle Duel to rescue the Griffin. Along the way, lift the fog, help friendly villagers, earn explorer gear and let your pet dig for buried treasure!";

export function TreasureGame() {
  const navigate = useNavigate();
  const game = useAdventure(); const { state } = game;
  const controls = useRef<WorldControls | null>(null);
  const figure = useRef<HTMLDivElement | null>(null);
  const petRef = useRef<HTMLDivElement | null>(null);
  const pets = usePets();
  const companion = PETS.find(p => p.id === pets.active) ?? PETS.find(p => p.id === "puppy");
  const [panel, setPanel] = useState<"logbook" | "map" | null>(null);
  const [npc, setNpc] = useState<Npc | null>(null);
  const [intro, setIntro] = useState(true);
  const [found, setFound] = useState<ZoneId | null>(null);
  const [riddle, setRiddle] = useState<ZoneId | null>(null);
  const [wrong, setWrong] = useState<number | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const [effect, setEffect] = useState<WorldEffect>({ kind: null, n: 0 });
  const [busy, setBusy] = useState(false);
  const [sound, setSound] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [chapter, setChapter] = useState(false);
  const [support, setSupport] = useState(false);
  const [side, setSide] = useState<SideZoneId | null>(null);
  const [travelling, setTravelling] = useState(false);
  const [harvestMaze, setHarvestMaze] = useState<{ tree: TreeId; round: string } | null>(null);
  const [gardenRound, setGardenRound] = useState<string | null>(null);
  const openingGarden = useRef(false);
  const [sideReset, setSideReset] = useState(0);
  const startingHarvest = useRef(false);
  const orchard = useOrchardEnergy();
  const audio = useRef<AudioContext | null>(null);
  const [avatar, setAvatar] = useState("/monere/looks/default/0.webp");
  const [turn, setTurn] = useState<Record<number, string[]>>({});
  const shop = useShop();
  useEffect(() => {
    let cancelled = false;
    const look = combinationLook(shop.equipped) ?? "default"; const src = `/monere/looks/${look}/0.webp`;
    const drawn = new Set(itemsDrawnIn(look, shop.equipped)); const extras = equippedItems(shop).filter(i => !drawn.has(i.id));
    if (!extras.length) setAvatar(src);
    else void composeCharacterFrame(src, clothingFrames(extras, 0), 0).then(image => { if (!cancelled) setAvatar(image); }).catch(() => { if (!cancelled) setAvatar(src); });
    void Promise.all([0, 1, 2, 3, 4, 5, 6, 7].map(async frame => {
      const base = `/monere/looks/${look}/${frame}.webp`;
      const source = extras.length ? await composeCharacterFrame(base, clothingFrames(extras, frame), frame).catch(() => base) : base;
      return [frame, await createWalkingFrames(source).catch(() => [source, source, source, source])] as const;
    })).then(entries => { if (!cancelled) setTurn(Object.fromEntries(entries)); });
    return () => { cancelled = true; };
  }, [shop.equipped]);
  const victory = game.loaded && state.rescued;
  const blocked = state.zone === "garden" || !!gardenRound || !!harvestMaze || !!side || !!panel || !!npc || intro || !!found || !!riddle || chapter || support || victory || busy;
  useEffect(() => {
    if (!game.loaded || state.zone !== "garden" || gardenRound || openingGarden.current) return;
    openingGarden.current = true; setIntro(false); setPanel(null); setBusy(true);
    void game.prepareHarvest().then(() => orchard.beginGarden()).then(setGardenRound).catch(async () => {
      setNotice("The garden challenge couldn’t open. Please try entering again.");
      await game.act({ action: "portal", id: "meadow" });
    }).finally(() => { openingGarden.current = false; setBusy(false); });
  }, [game.loaded, state.zone, gardenRound]);
  async function finishGarden(trace: GardenInput[]) {
    if (!gardenRound) return;
    const result = await orchard.gardenAction(gardenRound, trace, true);
    game.harvestReturn(result.state ?? { ...state, zone: "meadow", x: 12, y: 27, pet: null, quests: [...new Set([...state.quests, "vernon-garden"])] });
    setGardenRound(null);
    setNotice(`Vernon’s garden complete! +${result.gained} Energy · +${result.points} Coins${orchard.guest ? " (guest preview)" : ""}.`);
  }
  async function leaveGarden() {
    setBusy(true);
    try { await game.act({ action: "portal", id: "meadow" }); setGardenRound(null); }
    finally { setBusy(false); }
  }
  useEffect(() => { if (victory) { setIntro(false); setPanel(null); setNpc(null); setFound(null); setRiddle(null); playSound("victory.mp3", 0.7); } }, [victory]);
  useEffect(() => { if (!celebrate) return; const timer = setTimeout(() => setCelebrate(false), 2300); return () => clearTimeout(timer); }, [celebrate]);
  useEffect(() => { controls.current?.pause(blocked); }, [blocked]);
  useEffect(() => { const enabled = (() => { try { return localStorage.getItem("monere-treasure-sound") !== "off"; } catch { return true; } })(); setSound(enabled); setSoundsMuted(!enabled); return () => { void audio.current?.close(); }; }, []);
  const [music, setMusic] = useState(true);
  useEffect(() => { const on = (() => { try { return localStorage.getItem("monere-treasure-music") !== "off"; } catch { return true; } })(); setMusic(on); setMusicMuted(!on); const start = () => resumeBackgroundMusic(); window.addEventListener("pointerdown", start); window.addEventListener("keydown", start); return () => { window.removeEventListener("pointerdown", start); window.removeEventListener("keydown", start); stopBackgroundMusic(); }; }, []);
  useEffect(() => { playBackgroundMusic(side ? SIDE_ZONES[side].music : state.zone === "lair" ? "lair_theme.mp3" : state.zone === "ravine" ? "desert_theme.mp3" : "forest_theme.mp3"); }, [state.zone, side]);
  useEffect(() => { if (!notice) return; const t = setTimeout(() => setNotice(null), 4500); return () => clearTimeout(t); }, [notice]);
  function tone(notes: number[]) {
    if (!sound) return;
    try { const c = audio.current ?? new AudioContext(); audio.current = c; void c.resume(); notes.forEach((f, i) => { const o = c.createOscillator(); const g = c.createGain(); o.connect(g); g.connect(c.destination); o.frequency.value = f; g.gain.setValueAtTime(.07, c.currentTime + i * .1); g.gain.exponentialRampToValueAtTime(.001, c.currentTime + i * .1 + .35); o.start(c.currentTime + i * .1); o.stop(c.currentTime + i * .1 + .36); }); } catch { /* sound optional */ }
  }
  const chime = () => tone([523, 659, 784]);
  const zone = state.zone === "garden" ? { id: "garden", name: "Vernon’s Garden", icon: "🌸" } : ZONES.find(z => z.id === state.zone);
  const gate = gateNear(state.zone, state); const tree = mapTreeNear(state.zone, state);
  const here = gate ? { kind: "orchard-gate" as const, label: `Open ${gate.name}`, icon: gate.icon } : tree ? { kind: "orchard-tree" as const, label: "Harvest Energy Tree", icon: "🌳" } : interactionHere(state);
  async function pick(id: TreeId) {
    if (harvestMaze || busy || startingHarvest.current) return false;
    startingHarvest.current = true;
    setBusy(true);
    try { await game.prepareHarvest(); const round = await orchard.beginMaze(id); setHarvestMaze({ tree: id, round }); return true; }
    catch (e) { setNotice(e instanceof Error ? e.message : "The harvest couldn't be saved."); return false; }
    finally { startingHarvest.current = false; setBusy(false); }
  }
  async function enterSide(target: SideZoneId) {
    playSound("success.mp3", 0.5);
    setSide(target);
    // Crystal Gate IS the maze entrance: never mount the old cave/tree walk.
    if (target === "caverns" && !await pick("caverns-1")) setSide(null);
  }
  async function finishHarvest(collectedEnergy: number, trace: MazeDirection[], expelled: boolean) {
    if (!harvestMaze) return;
    if (replayMaze(trace).energy !== collectedEnergy) throw new Error("The collected Energy could not be verified.");
    const result = await orchard.finishMaze(harvestMaze.tree, harvestMaze.round, trace);
    if (result.state) game.harvestReturn(result.state);
    else if (expelled && !side) game.harvestReturn({ ...state, ...MAP_ENTRANCES[state.zone], pet: null });
    if (expelled && side) setSideReset(v => v + 1);
    try { saveHarvestRecord(game.user?.id ?? "guest", collectedEnergy); } catch { /* optional local record */ }
    setHarvestMaze(null);
    if (side === "caverns") setSide(null);
    setNotice(`${expelled ? "Whoosh! Safely back at the entrance." : "Harvest gathered!"} +${result.gained} Energy${orchard.guest ? " (guest preview)" : ""}.`);
  }
  const portal = here?.kind === "portal" ? PORTALS[state.zone].find(p => p.target === here.id) : undefined;

  // Riddle Duel: when Monere settles on a tile, ask the server whether it was the right answer.
  const settled = useRef("");
  useEffect(() => {
    const tile = duelTileAt(state); const key = duelLanding(state, settled.current, blocked);
    if (tile < 0) { settled.current = ""; return; }
    if (!key) return;
    const timer = setTimeout(async () => {
      settled.current = key; setBusy(true);
      try {
        const step = state.duel; const next = await game.act({ action: "duel", x: tile });
        if (next.duel > step) { playSound("success.mp3", 0.6); if (next.rescued) { tone([523, 659, 784, 1046]); setEffect(e => ({ kind: "rumble", n: e.n + 1 })); setCelebrate(true); window.setTimeout(() => setEffect(e => ({ kind: "victory", n: e.n + 1 })), 850); } else setNotice(`Correct! Riddle ${next.duel + 1} of 3…`); }
        else { tone([330, 247]); setEffect(e => ({ kind: "gust", n: e.n + 1 })); setNotice("Whoosh! Razor's gust blows you back to the start mark. Try again!"); }
      } catch { /* hook reports */ } finally { setBusy(false); }
    }, 400);
    return () => clearTimeout(timer);
  }, [state.x, state.y, state.duel, state.zone, blocked]);

  async function run(action: Parameters<typeof game.act>[0]) { setBusy(true); try { return await game.act(action); } catch { return null; } finally { setBusy(false); } }
  const landOpen = (id: ZoneId) => canEnter(state, id);
  function walkNear(cur: AdventureState, at: { x: number; y: number }): AdventureState | null {
    if (near(cur, at)) return cur;
    const options = [[0, 1], [0, -1], [1, 0], [-1, 0]].map(([dx, dy]) => worldPath(cur, { x: at.x + dx!, y: at.y + dy! })).filter((p): p is NonNullable<typeof p> => !!p).sort((a, b) => a.length - b.length);
    const path = options[0]; if (!path) return null;
    for (const p of path) { game.move(p); cur = { ...cur, ...p }; }
    return cur;
  }
  /** Travels to an unlocked land through the real portals, so every step is validated like normal walking. */
  async function journey(target: ZoneId, gateTo?: SideZoneId) {
    if (!landOpen(target) || travelling) return;
    setTravelling(true); setPanel(null); setSide(null);
    try {
      let cur: AdventureState = state;
      for (let hop = 0; hop < 6 && cur.zone !== target; hop++) {
        if (cur.zone === "garden" || (cur.zone === "meadow" && target === "garden")) {
          const nextZone = cur.zone === "garden" ? "meadow" : "garden";
          const exit = PORTALS[cur.zone].find(p => p.target === nextZone);
          if (!exit || !walkNear(cur, exit)) { setNotice("Monere can't reach the garden path."); return; }
          cur = await game.act({ action: "portal", id: nextZone });
          continue;
        }
        const ci = ZONES.findIndex(z => z.id === cur.zone), ti = ZONES.findIndex(z => z.id === (target === "garden" ? "meadow" : target));
        const nextZone = ZONES[ci + (ti > ci ? 1 : -1)]!.id;
        const portal = PORTALS[cur.zone].find(p => p.target === nextZone);
        const at = portal && walkNear(cur, portal); if (!portal || !at) { setNotice("Monere can't find a clear path there yet."); return; }
        const next = await game.act({ action: "portal", id: nextZone }); if (!next || next.zone === cur.zone) { setNotice("That path is still blocked."); return; }
        cur = next;
      }
      if (gateTo) {
        const g = ELEMENTAL_GATES.find(g => g.target === gateTo)!;
        if (!walkNear(cur, g.at)) { setNotice(`Monere can't reach the ${g.name} from here.`); return; }
        if (!canOpenGate(orchard.energy, g.target)) { setNotice(`The ${g.name} is sealed. Monere needs ${gateEnergyCost(g.target)} Energy to open it.`); return; }
        await enterSide(gateTo);
      } else setNotice(`Welcome to ${target === "garden" ? "Vernon’s Garden" : ZONES.find(z => z.id === target)?.name}!`);
    } finally { setTravelling(false); }
  }
  async function interact() {
    if (blocked) return;
    if (gate) { if (!canOpenGate(orchard.energy, gate.target)) { setNotice(`The ${gate.name} is sealed. Monere needs ${gateEnergyCost(gate.target)} Energy to open it — harvest an Energy Tree!`); return; } await enterSide(gate.target); return; }
    if (tree) { await pick(tree.id); return; }
    const h = interactionHere(state);
    if (!h) {
      if (state.zone === "lair" && near(state, { x: 12, y: 10 }) && !state.gates.includes("lair")) { if (state.scrolls.includes("lair")) { setWrong(null); setRiddle("lair"); } else setNotice("The carved door is locked. Find the Scroll of Wisdom first."); return; }
      setNotice("Nothing here. Explore the fog, talk to friends and follow your quest scroll."); return;
    }
    if (h.kind === "scroll") { const next = await run({ action: "collect" }); if (next?.scrolls.includes(state.zone)) { chime(); setFound(state.zone); } return; }
    if (h.kind === "gate") { setWrong(null); setRiddle(state.zone); return; }
    if (h.kind === "item") { const it = ITEMS.find(i => i.id === h.id)!; const next = await run({ action: "pick", id: it.id }); if (next?.items.includes(it.id)) { chime(); setNotice(`You found a ${it.name}! ${it.icon}`); } return; }
    if (h.kind === "npc") { const n = NPCS.find(n => n.id === h.id)!; void run({ action: "talk", id: n.id }); setNpc(n); return; }
    if (h.kind === "dig") {
      const d = sessionDigs(state).find(d => d.id === h.id); if (!d) return;
      const next = await run({ action: "dig", id: d.id });
      if (next?.dug.includes(d.id)) { void orchard.gainDig(); tone([392, 523, 659]); const t = d.item ? TREASURES[d.item] : null; setNotice(t ? `Your pet dug up ${t.name}! ${t.icon} +${DIG_ENERGY} Energy` : game.user ? `Your pet dug up ${d.points} coins! 🪙 +${DIG_ENERGY} Energy` : `Your pet dug up ${d.points} coins! 🪙 +${DIG_ENERGY} Energy. Sign in to keep them as points.`); }
      return;
    }
    if (h.kind === "bell") { const next = await run({ action: "bell" }); if (next) { playSound("bell.mp3", 0.6); setNotice(next.lily === 1 ? "Ribbit! The lily pads line up — hop across now!" : "Ding! The lily pads drift to new spots…"); } return; }
    if (h.kind === "stay") { const next = await run({ action: "stay" }); if (next?.pet) setNotice("Your pet sits on the paw plate. Now step onto the lion plate!"); return; }
    if (h.kind === "switch") { const next = await run({ action: "switch" }); if (next?.quests.includes("vault")) { chime(); setNotice(game.user ? "Click-clunk! The Stone Vault opens: Sun Stone ☀️ + 40 points!" : "Click-clunk! The Stone Vault opens: Sun Stone ☀️! Sign in to earn the points."); } return; }
    if (h.kind === "portal" && portal) {
      if (!portalOpen(state, portal)) {
        if (portal.target === "garden") { setNotice("Return all three magic seeds to Vernon to open his garden portal."); return; } setNotice(state.scrolls.includes(state.zone) ? "Answer the gatekeeper's riddle to open this gate." : "Find this land's hidden scroll first."); return; }
      await run({ action: "portal", id: portal.target });
    }
  }
  async function deliver(n: Npc) {
    const next = await run({ action: "deliver", id: n.id });
    if (next?.quests.includes(n.id)) { tone([523, 659, 784, 1046]); setNotice(`WOW… YOU FOUND MY ITEMS! HERE IS YOUR REWARD 🎁 — ${n.name}: “${n.thanks}”${game.user ? "" : " Sign in to keep reward points."}`); setNpc(null); }
  }
  async function answer(i: number) {
    if (!riddle) return;
    if (i !== gateRiddle(state, riddle).answer) { setWrong(i); tone([330, 247]); return; }
    setBusy(true);
    try { const next = await game.act({ action: "answer", id: riddle, x: i }); if (!next.gates.includes(riddle)) { setNotice("That answer couldn't be saved. Please try again."); return; } playSound("success.mp3", 0.6); setRiddle(null); setNotice(riddle === "lair" ? "The inner door rumbles open. Razor awaits!" : "Correct! The gate swings open."); }
    catch { setNotice("That answer couldn't be saved. Please try again."); } finally { setBusy(false); }
  }
  const action = here?.label ?? "Search";
  async function finish(destination: "play" | "menu") {
    if (busy) return;
    setBusy(true); controls.current?.pause(true);
    try {
      if (!await game.restart()) return;
      settled.current = ""; setPanel(null); setNpc(null); setFound(null); setRiddle(null); setWrong(null); setCelebrate(false); setNotice(null); setEffect({ kind: null, n: 0 }); setIntro(false);
      if (destination === "menu") await navigate({ to: "/" });
    } finally { setBusy(false); }
  }
  if (!zone) return null;
  return <section className="treasure-game" aria-label="The Rescue of the Golden Griffin">
    <header className="treasure-hud">
      <div className="flex min-w-0 items-center gap-3"><span className="hidden h-10 w-10 items-center justify-center rounded-lg border border-primary/35 bg-primary/10 text-primary sm:flex"><Compass /></span><div className="min-w-0"><p className="text-[10px] font-bold uppercase text-primary">The Rescue of the Golden Griffin</p><h1 className="truncate font-display text-lg sm:text-2xl">{side ? SIDE_ZONES[side].name : zone.name}</h1></div></div>
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
        <span className="treasure-energy" aria-label={`Energy ${orchard.energy} of 100`} title="Energy"><Zap className="h-4 w-4" /><span><span style={{ width: `${orchard.energy}%` }} /></span><span className="hidden text-sm sm:inline">{orchard.energy}</span></span>
        <span className="flex items-center gap-1.5 font-display text-lg text-points" aria-label={`${state.scrolls.length} of 4 scrolls collected`}><ScrollText className="h-4 w-4" />{state.scrolls.length}<span className="text-xs text-muted-foreground">/4</span></span>
        <Button size="sm" variant="outline" className="gap-1.5 border-points/50 text-points" title="Support Project" aria-label="Support Project" onClick={() => window.open(SUPPORTER_PAYMENT_URL, "_blank", "noopener,noreferrer")}><span aria-hidden="true">⭐</span><span className="hidden lg:inline">Support Project</span></Button>
        <Button size="icon" variant="ghost" title={music ? "Turn music off" : "Turn music on"} aria-label={music ? "Turn music off" : "Turn music on"} aria-pressed={music} onClick={() => { const next = !music; setMusic(next); setMusicMuted(!next); try { localStorage.setItem("monere-treasure-music", next ? "on" : "off"); } catch { /* storage optional */ } }}>{music ? <Music /> : <Music2 className="opacity-40" />}</Button>
        <Button size="icon" variant="ghost" title={sound ? "Mute sound" : "Enable sound"} aria-label={sound ? "Mute sound" : "Enable sound"} onClick={() => { setSound(!sound); setSoundsMuted(sound); localStorage.setItem("monere-treasure-sound", sound ? "off" : "on"); }}>{sound ? <Volume2 /> : <VolumeX />}</Button>
        <Button size="icon" variant="outline" aria-label="Open world map" title="World map" onClick={() => setPanel("map")}><Map /></Button>
        <Button variant="default" className="gap-2" aria-label="Open logbook" onClick={() => setPanel("logbook")}><Backpack /><span className="hidden sm:inline">Logbook</span></Button>
      </div>
    </header>
    <div className="treasure-viewport">
      <img src={maps[state.zone]} alt="" width={1536} height={1536} className="absolute inset-0 h-full w-full object-cover" />
      {game.loaded ? <ClientOnly><Suspense fallback={<div className="treasure-loading">Preparing your adventure…</div>}><WorldCanvas state={state} revision={game.revision} avatar={avatar} controls={controls} figure={figure} pet={petRef} effect={effect} energy={orchard.energy} onBoost={async mode => { await game.prepareHarvest(); return orchard.boost(mode); }} onMove={game.move} onNotice={setNotice} onInteract={() => void interact()} /></Suspense></ClientOnly> : <div className="treasure-loading">{game.error ? <Button onClick={() => void game.retry()}>Reconnect to your adventure</Button> : "Opening your adventure…"}</div>}
      {companion && <div ref={petRef} className="treasure-pet" data-facing="east" aria-hidden="true"><div className="idle-breath"><div className={celebrate ? "spin-360" : undefined}><img src={companion.src} alt="" draggable={false} /></div></div></div>}
      <div ref={figure} className="treasure-monere" data-facing="south" data-moving="false" data-walk-frame="0" aria-hidden="true"><div><div className={celebrate ? "spin-360" : undefined}>{[0, 1, 2, 3, 4, 5, 6, 7].flatMap(frame => [0, 1, 2, 3].map(pose => <img key={`${frame}-${pose}`} data-frame={frame} data-walk-frame={pose} src={turn[frame]?.[pose] ?? avatar} alt="" draggable={false} />))}</div></div></div>
      <div className="treasure-quest"><div className="flex items-center gap-2 text-primary"><ScrollText className="h-5 w-5" /><span className="text-xs font-bold uppercase">{state.rescued ? "Griffin rescued" : state.zone === "garden" ? "Vernon’s Garden" : `Land ${ZONES.findIndex(z => z.id === state.zone) + 1} of 4 · Quest`}</span><Button size="icon" variant="ghost" className="ml-auto h-7 w-7" aria-label="Read the story again" onClick={() => setIntro(true)}><BookOpen className="h-4 w-4" /></Button></div><p className="mt-1 font-body text-sm leading-relaxed">{questClue(state)}</p>
        {state.zone === "lair" && state.gates.includes("lair") && !state.rescued && <div className="mt-2 grid grid-cols-3 gap-1 text-center text-xs font-bold">{duelRiddle(state).options.map((t, i) => <span key={t} className="rounded-md border border-primary/40 bg-primary/10 px-1 py-1">{"ABC"[i]}: {t}</span>)}</div>}
        <div className="mt-2 flex gap-1" aria-hidden="true">{ZONES.map(z => <span key={z.id} className={`h-1.5 flex-1 rounded-full ${state.scrolls.includes(z.id) ? "bg-primary" : "bg-muted"}`} />)}</div></div>
      <div className="treasure-map-chip"><span>{zone.icon}</span><span>{state.x}, {state.y}</span><span className="text-primary">{game.saving ? "Saving…" : game.user ? "Account saved" : "Guest adventure"}</span></div>
      <MiniMap state={state} className="absolute right-3 top-14 z-20 hidden w-32 sm:block" />
      <Link to="/pet-shop" title="Pet Shop" aria-label="Pet Shop" className="treasure-petshop"><img src={petShopMark} alt="" width={816} height={816} loading="lazy" draggable={false} /><span>Pet Shop</span></Link>
      {side === "grove" && <SideZone key={`${side}-${sideReset}`} zone={side} avatar={turn[2]?.[0] ?? avatar} paused={!!harvestMaze || busy} cooling={orchard.cool} onPick={async id => { await pick(id); }} onExit={() => { setSide(null); setNotice("Back on the main path."); }} />}
      {side === "caverns" && !harvestMaze && <div className="treasure-loading" role="status">Opening the Crystal Maze…</div>}
      {notice && <div role="status" className="treasure-notice">{notice}</div>}
      <div className="treasure-controls">
        <div className="treasure-dpad" aria-label="Movement controls">{[{ x: 0, y: -1, Icon: ArrowUp, name: "Move up", css: "col-start-2" }, { x: -1, y: 0, Icon: ArrowLeft, name: "Move left", css: "row-start-2" }, { x: 0, y: 1, Icon: ArrowDown, name: "Move down", css: "col-start-2 row-start-2" }, { x: 1, y: 0, Icon: ArrowRight, name: "Move right", css: "col-start-3 row-start-2" }].map(({ x, y, Icon, name, css }) => <Button key={name} variant="secondary" size="icon" aria-label={name} title={name} className={`treasure-direction ${css}`} disabled={!game.loaded || blocked} onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); controls.current?.direction(x, y); }} onPointerUp={() => controls.current?.release()} onPointerCancel={() => controls.current?.release()} onLostPointerCapture={() => controls.current?.release()}><Icon /></Button>)}</div>
        <Button className="treasure-interact" disabled={blocked || !game.loaded} onClick={() => void interact()}><span className="text-xl">{here?.icon ?? "🔎"}</span>{action}</Button>
      </div>
    </div>
    <footer className="treasure-footer"><span className="flex items-center gap-2"><Flag className="h-3.5 w-3.5 text-primary" /><span className="hidden sm:inline">A journey of courage, kindness & wisdom</span><span className="sm:hidden">Your brave adventure</span></span><Link to="/" className="flex items-center gap-1.5 text-primary"><BookOpen className="h-4 w-4" />Talk to Monere<ArrowRight className="h-3.5 w-3.5" /></Link></footer>
    {harvestMaze && <ClientOnly><Suspense fallback={<div className="treasure-loading">Opening the Energy maze…</div>}><PacmanHarvestMiniGame avatar={avatar} practice={harvestMaze.round === "practice"} onComplete={finishHarvest} /></Suspense></ClientOnly>}
    {gardenRound && <ClientOnly><Suspense fallback={<div className="treasure-loading">Opening Vernon’s garden…</div>}><DonkeyKongMiniGame avatar={avatar} energy={orchard.energy} onJump={async trace => { await orchard.gardenAction(gardenRound, trace, false); }} onComplete={finishGarden} onExit={() => void leaveGarden()} /></Suspense></ClientOnly>}

    <Dialog open={intro} onOpenChange={setIntro}><DialogContent className="max-w-md rounded-lg text-center"><DialogTitle className="text-2xl text-primary">The Rescue of the Golden Griffin</DialogTitle><DialogDescription className="font-body text-base leading-relaxed text-foreground">{INTRO}</DialogDescription><div className="flex items-end justify-center gap-4"><img src={razor} alt="Razor the Hyena" width={768} height={768} className="h-28 w-28 object-contain" /><img src={griffin} alt="The Golden Griffin" width={816} height={816} className="h-24 w-24 object-contain" /></div><Button onClick={() => setIntro(false)}>{state.scrolls.length ? "Continue the rescue" : "Begin the rescue"}<ArrowRight /></Button></DialogContent></Dialog>

    <Dialog open={!!found} onOpenChange={o => { if (!o) setFound(null); }}><DialogContent className="max-w-md rounded-lg text-center"><DialogTitle className="text-2xl text-primary">Scroll {found ? ZONES.findIndex(z => z.id === found) + 1 : ""} of 4 found!</DialogTitle><DialogDescription>{found && SCROLLS[found].name}</DialogDescription><span className="treasure-reward block text-6xl">📜</span><p className="font-body text-sm">{found && SCROLLS[found].lore}</p><p className="rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-primary">The scroll reveals the gatekeeper's riddle: “{found && gateRiddle(state, found).riddle}” {found === "lair" ? "Answer it at the carved inner door." : "Answer it at the eastern gate."}</p><Button onClick={() => setFound(null)}>Keep exploring<ArrowRight /></Button></DialogContent></Dialog>

    <Dialog open={!!riddle} onOpenChange={o => { if (!o) setRiddle(null); }}><DialogContent className="max-w-md rounded-lg"><DialogTitle className="text-2xl text-primary">{riddle === "lair" ? "The Inner Door" : "The Gatekeeper asks…"}</DialogTitle><DialogDescription className="font-body text-base text-foreground">{riddle && gateRiddle(state, riddle).riddle}</DialogDescription><div className="grid gap-2">{riddle && gateRiddle(state, riddle).options.map((o, i) => <Button key={o} variant={wrong === i ? "destructive" : "secondary"} disabled={busy} onClick={() => void answer(i)}>{o}</Button>)}</div>{wrong !== null && <p role="status" className="text-sm text-muted-foreground">Not quite — think again!</p>}</DialogContent></Dialog>

    <Dialog open={!!npc} onOpenChange={o => { if (!o) setNpc(null); }}><DialogContent className="max-w-md rounded-lg text-center">{npc && (() => { const done = state.quests.includes(npc.id); const have = npc.need.filter(i => state.items.includes(i)).length; const ready = have === npc.need.length; return <>
      <DialogTitle className="text-2xl text-primary">{npc.icon} {npc.name}</DialogTitle><DialogDescription className="font-body text-base text-foreground">“{done ? npc.thanks : npcClue(state, npc)}”</DialogDescription>
      {!done && <p className="text-sm text-muted-foreground">Found {have} of {npc.need.length} · Reward: {npc.gear ? `${GEAR[npc.gear].icon} ${GEAR[npc.gear].name} + ` : npc.item ? `${TREASURES[npc.item]!.icon} ${TREASURES[npc.item]!.name} + ` : ""}{npc.points} points{game.user ? "" : " (sign in to keep points)"}</p>}
      {done && npc.id !== "vernon" && <p className="rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-primary">💡 A gatekeeper's riddle tip: {gateRiddle(state, npc.zone).hint}</p>}
      {!done && <Button disabled={!ready || busy} onClick={() => void deliver(npc)}>{ready ? "Hand them over" : "Keep searching"}</Button>}
      <Button variant="ghost" onClick={() => setNpc(null)}>Goodbye</Button></>; })()}</DialogContent></Dialog>

    <Dialog open={chapter} onOpenChange={setChapter}><DialogContent className="max-w-md rounded-lg text-center"><DialogTitle className="text-2xl text-primary">Monere: Chapter 1 Complete!</DialogTitle><DialogDescription className="font-body text-base leading-relaxed text-foreground">You have successfully navigated the Lost Lands and unlocked the Crystal Caverns! Chapter 2: The Rescue of the Golden Griffin is currently under active development.</DialogDescription><div className="flex items-end justify-center gap-2"><div className="h-24 w-24"><MonereFigure gesture="thumbs" /></div><img src={griffin} alt="The Golden Griffin" width={816} height={816} className="treasure-reward h-24 w-24 object-contain" /></div><div className="grid gap-2"><Button onClick={() => { setChapter(false); window.open(SUPPORTER_PAYMENT_URL, "_blank", "noopener,noreferrer"); }}>⭐ Support Chapter 2 Development<ArrowRight /></Button><Button variant="secondary" disabled={busy} onClick={async () => { const next = await run({ action: "refresh-hunt" }); if (next) setChapter(false); }}>Continue Daily Hunts</Button></div></DialogContent></Dialog>

    <Dialog open={support} onOpenChange={setSupport}><DialogContent className="max-w-md rounded-lg text-center"><DialogTitle className="text-2xl text-primary">⭐ Support the Project</DialogTitle><DialogDescription className="font-body text-base leading-relaxed text-foreground">MonereAI is built with love for every young explorer. Thank you for supporting Chapter 2 development.</DialogDescription><Button onClick={() => window.open(SUPPORTER_PAYMENT_URL, "_blank", "noopener,noreferrer")}>⭐ Support Chapter 2 Development</Button><Button variant="ghost" onClick={() => setSupport(false)}>Maybe later</Button></DialogContent></Dialog>

    <Dialog open={victory}><DialogContent showCloseButton={false} onEscapeKeyDown={e => e.preventDefault()} onPointerDownOutside={e => e.preventDefault()} onInteractOutside={e => e.preventDefault()} className="max-w-md rounded-lg text-center"><DialogTitle className="text-2xl text-primary">Quest Complete!</DialogTitle><DialogDescription>Razor dropped the key and ran off. Your wisdom won the Riddle Duel.</DialogDescription><div className="flex items-end justify-center gap-2"><div className="h-28 w-28"><MonereFigure gesture="thumbs" /></div><img src={griffin} alt="Golden Griffin" width={816} height={816} className="treasure-reward h-28 w-28 object-contain" /></div><p className="flex items-center justify-center gap-2 rounded-lg border border-points/40 bg-points/10 p-3 font-display text-points"><Award className="h-5 w-5" />Badge earned: Griffin Savior</p><p className="text-sm">{game.user ? "The Golden Griffin is now in your Pet Shop — equip it as your companion!" : "Sign in and rescue the Griffin on your account to keep it as a pet."}</p><div className="grid grid-cols-2 gap-2"><Button disabled={busy || game.saving} onClick={() => void finish("play")}>Play Again<ArrowRight /></Button><Button variant="secondary" disabled={busy || game.saving} onClick={() => void finish("menu")}>Main Menu</Button></div><Button variant="outline" onClick={() => window.open(SUPPORTER_PAYMENT_URL, "_blank", "noopener,noreferrer")}>⭐ Support Chapter 2 Development</Button><Button variant="ghost" asChild><Link to={game.user ? "/pet-shop" : "/auth"}>{game.user ? "Meet your Griffin" : "Sign in"}<ArrowRight /></Link></Button></DialogContent></Dialog>

    <Dialog open={!!panel} onOpenChange={o => { if (!o) setPanel(null); }}><DialogContent className="max-h-[85dvh] max-w-3xl overflow-y-auto rounded-lg"><DialogTitle className="flex items-center gap-2 text-2xl"><Compass className="text-primary" />{panel === "map" ? "The road to Razor's Lair" : "Rescue Logbook"}</DialogTitle><DialogDescription>{panel === "map" ? "Four lands. Four scrolls. One Golden Griffin. Explore to lift the fog." : `${state.scrolls.length} of 4 scrolls · ${state.gates.length} of 4 riddles · ${state.quests.length} of ${NPCS.length + 1} side quests`}</DialogDescription>
      {panel === "map" ? <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">{[...([...ZONES, { id: "garden" as const, name: "Vernon’s Garden", subtitle: "Beyond Meadow’s southern bridge" }]).map(z => ({ id: z.id, name: z.name, subtitle: z.subtitle, img: maps[z.id], open: landOpen(z.id), here: !side && state.zone === z.id, go: () => void journey(z.id), lock: z.id === "garden" ? "Return all three seeds to Vernon" : "Solve the previous gate riddle" })), ...ELEMENTAL_GATES.map(g => ({ id: g.target, name: SIDE_ZONES[g.target].name, subtitle: `Through the ${g.name}${gateEnergyCost(g.target) ? ` · needs ${gateEnergyCost(g.target)} Energy` : ""}`, img: g.target === "grove" ? groveImg : cavernsImg, open: landOpen(g.zone), here: side === g.target, go: () => void journey(g.zone, g.target), lock: `Reach ${ZONES.find(z => z.id === g.zone)?.name} first` }))].map(n => <button key={n.id} type="button" disabled={!n.open || n.here || travelling} onClick={n.go} className="overflow-hidden rounded-lg border border-border text-left transition hover:border-primary disabled:cursor-default disabled:hover:border-border"><img src={n.img} alt="" width={1536} height={1536} loading="lazy" className={`aspect-square w-full object-cover ${n.open ? "" : "opacity-40 grayscale"}`} /><div className="p-3"><h2 className="text-base">{n.name}</h2><p className="mt-1 text-xs text-muted-foreground">{n.subtitle}</p><p className="mt-2 flex items-center gap-2 text-xs text-primary">{n.open ? <><Check className="h-4 w-4" />{n.here ? "Exploring now" : "Tap to travel"}</> : <><LockKeyhole className="h-4 w-4" />{n.lock}</>}</p></div></button>)}</div>
      : <div className="grid gap-3 sm:grid-cols-2">{ZONES.map(z => { const has = state.scrolls.includes(z.id); return <div key={z.id} className={`rounded-lg border p-3 ${has ? "border-primary/30 bg-primary/5" : "border-border bg-muted/30"}`}><span className="mb-2 block text-3xl">{has ? "📜" : "🔒"}</span><h2 className="text-base">{has ? SCROLLS[z.id].name : "Undiscovered scroll"}</h2><p className="mt-1 text-xs text-muted-foreground">{has ? SCROLLS[z.id].lore : z.name}</p>{state.gates.includes(z.id) && <p className="mt-2 text-xs text-primary">Riddle solved ✓</p>}</div>; })}
        <div className={`rounded-lg border p-3 sm:col-span-2 ${state.rescued ? "border-points/40 bg-points/10" : "border-border"}`}><p className="flex items-center gap-2 font-display text-lg"><Award className="h-5 w-5 text-points" />Griffin Savior badge</p><p className="text-sm text-muted-foreground">{state.rescued ? "Earned! You rescued the Golden Griffin." : "Win Razor's Riddle Duel to earn it."}</p></div>
        <div className="rounded-lg border border-primary/30 p-3 sm:col-span-2"><h2 className="font-display text-lg text-primary">Main quest</h2><p className="mt-1 font-body text-sm">{questClue(state)}</p></div>
        <div className="rounded-lg border border-border p-3 sm:col-span-2"><h2 className="font-display text-lg">Side quests</h2><ul className="mt-2 grid gap-2">{sideQuests(state).map(q => <li key={q.id} className={`flex items-start gap-3 rounded-md border p-2 text-sm ${q.done ? "border-primary/30 bg-primary/5" : "border-border"}`}><span className="text-lg">{q.done ? "✅" : "🧭"}</span><span className="min-w-0 flex-1"><span className="block font-semibold">{q.title}</span><span className="block text-xs text-muted-foreground">{q.giver} · Reward: {q.reward}</span></span><span className="font-display text-points">{q.progress}/{q.total}</span></li>)}</ul></div>
        <div className="rounded-lg border border-border p-3"><h2 className="font-display text-lg">Explorer gear</h2><ul className="mt-2 grid gap-2">{(Object.keys(GEAR) as (keyof typeof GEAR)[]).map(g => { const has = state.gear.includes(g); return <li key={g} className={`flex items-center gap-2 text-sm ${has ? "" : "opacity-50"}`}><span className="text-2xl">{has ? GEAR[g].icon : "❔"}</span><span><span className="block font-semibold">{has ? GEAR[g].name : "Not found yet"}</span><span className="block text-xs text-muted-foreground">{GEAR[g].use}</span></span></li>; })}</ul></div>
        <div className="rounded-lg border border-border p-3"><h2 className="font-display text-lg">Treasures & finds</h2>{state.items.length ? <ul className="mt-2 grid grid-cols-2 gap-2">{state.items.map(id => { const t = TREASURES[id] ?? ITEMS.find(i => i.id === id); return t ? <li key={id} className="flex items-center gap-2 text-xs"><span className="text-xl">{t.icon}</span>{t.name}</li> : null; })}</ul> : <p className="mt-2 text-sm text-muted-foreground">Nothing yet — dig spots (✖) and lost items are hidden in the fog.</p>}</div>
        <div className="sm:col-span-2"><h2 className="mb-2 font-display text-lg">Mini-map · {zone.name}</h2><MiniMap state={state} className="mx-auto w-full max-w-xs" /></div></div>}
    </DialogContent></Dialog>
  </section>;
}

/** Fog-of-war mini-map of the current land: explored chunks, friends, portals and Monere. */
function MiniMap({ state, className }: { state: AdventureState; className?: string }) {
  const chunks = Array.from({ length: worldRows(state.zone) / 4 * 6 }, (_, i) => i);
  return <div className={`overflow-hidden rounded-lg border-2 border-primary/50 bg-background/80 shadow-lg ${className ?? ""}`} aria-label="Mini-map">
    <svg viewBox={`0 0 24 ${worldRows(state.zone)}`} className="block aspect-square w-full"><image href={maps[state.zone]} x="0" y="0" width="24" height="24" preserveAspectRatio="none" />
      {chunks.map(c => !isRevealed(state, state.zone, (c % 6) * 4, Math.floor(c / 6) * 4) && <rect key={c} x={(c % 6) * 4} y={Math.floor(c / 6) * 4} width="4.05" height="4.05" className="fill-muted" opacity=".92" />)}
      {PORTALS[state.zone].filter(p => isRevealed(state, state.zone, p.x, p.y)).map(p => <circle key={p.target} cx={p.x + .5} cy={p.y + .5} r=".9" className="fill-energy" />)}
      {NPCS.filter(n => n.zone === state.zone && isRevealed(state, state.zone, n.x, n.y)).map(n => <circle key={n.id} cx={n.x + .5} cy={n.y + .5} r=".8" className="fill-points" />)}
      <circle cx={state.x + .5} cy={state.y + .5} r="1.1" className="fill-primary stroke-foreground" strokeWidth=".3" />
    </svg>
    <p className="bg-background/90 px-2 py-0.5 text-center text-[10px] font-bold uppercase text-primary">{state.zone === "garden" ? "Vernon’s Garden" : ZONES.find(z => z.id === state.zone)?.name}</p>
  </div>;
}
