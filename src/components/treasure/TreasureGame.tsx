import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { ClientOnly, Link } from "@tanstack/react-router";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Backpack, BookOpen, Check, Compass, Flag, Gem, LockKeyhole, Map, ScrollText, Shirt, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { MatchingPuzzle } from "./MatchingPuzzle";
import { MonereFigure } from "@/components/MonereFigure";
import { PETS, usePets } from "@/lib/pets";
import { useAdventure } from "@/hooks/useAdventure";
import { RELICS, REWARD_SETS, TOOLS, ZONES, PORTALS, LANDMARKS, near, questClue, zoneComplete, canCollect, type Relic } from "@/lib/treasure";
import { equippedItems, SHOP_ITEMS, useShop } from "@/lib/shop";
import { combinationLook, itemsDrawnIn } from "@/lib/shop-combinations";
import { clothingFrames, composeCharacterFrame } from "@/lib/character-art";
import type { WorldControls } from "./WorldCanvas";
import meadow from "@/assets/treasure/meadow.jpg";
import forest from "@/assets/treasure/forest.jpg";
import sky from "@/assets/treasure/sky.jpg";

const WorldCanvas = lazy(() => import("./WorldCanvas").then(m => ({ default: m.WorldCanvas })));
const maps = { meadow, forest, sky };
export function TreasureGame() {
  const game = useAdventure(); const { state } = game;
  const controls = useRef<WorldControls | null>(null);
  const figure = useRef<HTMLDivElement | null>(null);
  const petRef = useRef<HTMLDivElement | null>(null);
  const pets = usePets();
  const companion = PETS.find(p => p.id === pets.active) ?? PETS.find(p => p.id === "puppy");
  const [panel, setPanel] = useState<"logbook" | "map" | "quests" | null>(null);
  const [tab, setTab] = useState<"relics" | "gear" | "wardrobe">("relics");
  const [reward, setReward] = useState<Relic | null>(null);
  const [puzzle, setPuzzle] = useState(false);
  const [victory, setVictory] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sound, setSound] = useState(true);
  const audio = useRef<AudioContext | null>(null);
  const [avatar, setAvatar] = useState("/monere/looks/default/0.webp");
  // The main page's Monere turnaround (8 angles, every equipped layer composed in) — same art, same outfit.
  const [turn, setTurn] = useState<Record<number, string>>({});
  const shop = useShop();
  useEffect(() => {
    let cancelled = false;
    const look = combinationLook(shop.equipped) ?? "default"; const src = `/monere/looks/${look}/0.webp`;
    const drawn = new Set(itemsDrawnIn(look, shop.equipped)); const extras = equippedItems(shop).filter(i => !drawn.has(i.id));
    if (!extras.length) setAvatar(src);
    else void composeCharacterFrame(src, clothingFrames(extras, 0), 0).then(image => { if (!cancelled) setAvatar(image); }).catch(() => { if (!cancelled) setAvatar(src); });
    void Promise.all([0, 1, 2, 3, 4, 5, 6, 7].map(async frame => {
      const base = `/monere/looks/${look}/${frame}.webp`;
      return [frame, extras.length ? await composeCharacterFrame(base, clothingFrames(extras, frame), frame).catch(() => base) : base] as const;
    })).then(entries => { if (!cancelled) setTurn(Object.fromEntries(entries)); });
    return () => { cancelled = true; };
  }, [shop.equipped]);
  useEffect(() => { controls.current?.pause(!!panel || !!reward || !!victory || puzzle || busy); }, [panel, reward, victory, puzzle, busy]);
  useEffect(() => { try { setSound(localStorage.getItem("monere-treasure-sound") !== "off"); } catch { /* default on */ } return () => { void audio.current?.close(); }; }, []);
  function chime() {
    if (!sound) return;
    try { const context = audio.current ?? new AudioContext(); audio.current = context; void context.resume(); [523, 659, 784].forEach((frequency, i) => { const oscillator = context.createOscillator(); const gain = context.createGain(); oscillator.connect(gain); gain.connect(context.destination); oscillator.frequency.value = frequency; gain.gain.setValueAtTime(.07, context.currentTime + i * .1); gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + i * .1 + .35); oscillator.start(context.currentTime + i * .1); oscillator.stop(context.currentTime + i * .1 + .36); }); } catch { /* sound optional */ }
  }
  const zone = ZONES.find(z => z.id === state.zone) ?? ZONES[0];
  const zoneRelics = RELICS.filter(r => r.zone === state.zone);
  const clue = questClue(state);
  const landmark = LANDMARKS.find(l => l.zone === state.zone && near(state, l) && !state.landmarks.includes(l.id));
  const lockedChest = zoneRelics.find(r => !state.relics.includes(r.id) && near(state, r));
  const nearby = zoneRelics.find(r => canCollect(state, r));
  const portal = PORTALS[state.zone].find(p => Math.abs(p.x - state.x) + Math.abs(p.y - state.y) <= 1);
  const [notice, setNotice] = useState<string | null>(null);
  async function interact() {
    if (busy || panel || reward || puzzle || victory) return;
    if (landmark) { setBusy(true); try { const next = await game.act({ action: "inspect", id: landmark.id }); if (next.landmarks.includes(landmark.id)) { chime(); setNotice(landmark.fragment ? `Key Fragment found · ${next.fragments.length}/2` : landmark.id === "dawn" ? "Dawn speaks: seek the echoing eastern pillars." : "The pillars answer: reunite four twins at the sun’s heart."); } } catch { /* hook reports */ } finally { setBusy(false); } return; }
    if (nearby) {
      setBusy(true);
      try { const next = await game.act({ action: "collect", id: nearby.id }); if (next.relics.includes(nearby.id)) { chime(); setReward(nearby); if (zoneComplete(next, state.zone)) setVictory(state.zone); } } catch { /* hook reports failure */ } finally { setBusy(false); }
    } else if (lockedChest) {
      if (state.zone === "sky" && state.landmarks.includes("ruins")) setPuzzle(true);
      else setNotice(state.zone === "forest" ? `Both Key Fragments are needed (${state.fragments.length}/2). Equip your Magnifying Glass.` : "Read the Dawn Circle, then the Echoing Pillars. Equip your Lantern.");
    } else if (portal) {
      if (!state.unlocked.includes(portal.target)) { setNotice("Open every chest in the previous stage to unlock this gateway."); return; }
      setBusy(true); try { await game.act({ action: "portal", id: portal.target }); } catch { /* hook reports */ } finally { setBusy(false); }
    } else setNotice("No treasure within reach. Follow the clue on your quest scroll.");
  }
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(null), 4500); return () => clearTimeout(timer); }, [notice]);
  const value = RELICS.filter(r => state.relics.includes(r.id)).reduce((total, r) => total + r.value, 0);
  return <section className="treasure-game" aria-label="Monere Treasure Hunt">
    <header className="treasure-hud">
      <div className="flex min-w-0 items-center gap-3"><span className="hidden h-10 w-10 items-center justify-center rounded-lg border border-primary/35 bg-primary/10 text-primary sm:flex"><Compass /></span><div className="min-w-0"><p className="text-[10px] font-bold uppercase text-primary">MonereAI · Treasure Hunt</p><h1 className="truncate font-display text-lg sm:text-2xl">{zone?.name}</h1></div></div>
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
        <span className="flex items-center gap-1.5 font-display text-lg text-points" aria-label={`${state.relics.length} treasures collected`}><Gem className="h-4 w-4" />{state.relics.length}<span className="text-xs text-muted-foreground">/{RELICS.length}</span></span>
        <Button size="icon" variant="ghost" title={sound ? "Mute sound" : "Enable sound"} aria-label={sound ? "Mute sound" : "Enable sound"} onClick={() => { setSound(!sound); localStorage.setItem("monere-treasure-sound", sound ? "off" : "on"); }}>{sound ? <Volume2 /> : <VolumeX />}</Button>
        <Button size="icon" variant="outline" aria-label="Open world map" title="World map" onClick={() => setPanel("map")}><Map /></Button>
        <Button variant="default" className="gap-2" aria-label="Open collector's logbook" onClick={() => setPanel("logbook")}><Backpack /><span className="hidden sm:inline">Logbook</span></Button>
      </div>
    </header>
    <div className="treasure-viewport">
      <img src={maps[state.zone]} alt="" width={1536} height={1536} className="absolute inset-0 h-full w-full object-cover" />
      {game.loaded ? <ClientOnly><Suspense fallback={<div className="treasure-loading">Preparing your adventure…</div>}><WorldCanvas state={state} revision={game.revision} avatar={avatar} controls={controls} figure={figure} pet={petRef} onMove={game.move} onInteract={() => void interact()} /></Suspense></ClientOnly> : <div className="treasure-loading">{game.error ? <Button onClick={() => void game.retry()}>Reconnect to your adventure</Button> : "Opening your adventure…"}</div>}
      {companion && <div ref={petRef} className="treasure-pet" data-facing="east" aria-hidden="true"><div className="idle-breath"><div className={reward ? "pet-celebrate" : undefined}><img src={companion.src} alt="" draggable={false} /></div></div></div>}
      <div ref={figure} className="treasure-monere" data-facing="south" data-moving="false" aria-hidden="true"><div className="idle-breath">{[0, 1, 2, 3, 4, 5, 6, 7].map(frame => <img key={frame} data-frame={frame} src={turn[frame] ?? avatar} alt="" draggable={false} />)}</div></div>
      <div className="treasure-quest"><div className="flex items-center gap-2 text-primary"><ScrollText className="h-5 w-5" /><span className="text-xs font-bold uppercase">{zoneComplete(state, state.zone) ? "Stage complete" : `Stage ${ZONES.findIndex(z => z.id === state.zone) + 1} · Quest`}</span><Button size="icon" variant="ghost" className="ml-auto h-7 w-7" aria-label="Open quest scroll" onClick={() => setPanel("quests")}><BookOpen className="h-4 w-4" /></Button></div><p className="mt-1 font-body text-sm leading-relaxed">{clue}</p><div className="mt-2 flex gap-1" aria-label={`${zoneRelics.filter(r => state.relics.includes(r.id)).length} of ${zoneRelics.length} stage chests opened`}>{zoneRelics.map(r => <span key={r.id} className={`h-1.5 flex-1 rounded-full ${state.relics.includes(r.id) ? "bg-primary" : "bg-muted"}`} />)}</div></div>
      <div className="treasure-map-chip"><span>{zone?.icon}</span><span>{state.x}, {state.y}</span><span className="text-primary">{game.saving ? "Saving…" : game.user ? "Account saved" : "Guest adventure"}</span></div>
      {notice && <div role="status" className="treasure-notice">{notice}</div>}
      <div className="treasure-controls">
        <div className="treasure-dpad" aria-label="Movement controls">{[{ x: 0, y: -1, Icon: ArrowUp, name: "Move up", css: "col-start-2" }, { x: -1, y: 0, Icon: ArrowLeft, name: "Move left", css: "row-start-2" }, { x: 0, y: 1, Icon: ArrowDown, name: "Move down", css: "col-start-2 row-start-2" }, { x: 1, y: 0, Icon: ArrowRight, name: "Move right", css: "col-start-3 row-start-2" }].map(({ x, y, Icon, name, css }) => <Button key={name} variant="secondary" size="icon" aria-label={name} title={name} className={`treasure-direction ${css}`} disabled={!game.loaded || busy || !!panel || !!reward} onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); controls.current?.direction(x, y); }} onPointerUp={() => controls.current?.release()} onPointerCancel={() => controls.current?.release()} onLostPointerCapture={() => controls.current?.release()}><Icon /></Button>)}</div>
        <div className="flex flex-col items-end gap-2"><Button variant="secondary" size="sm" disabled={busy || !!panel || !!reward || puzzle || !!victory} onClick={() => void game.act({ action: "pet" }).catch(() => {})}><span aria-hidden="true">🐾</span>{state.pinned ? "Call companion" : "Companion stay"}</Button><div className="flex gap-1.5">{TOOLS.filter(t => state.tools.includes(t.id)).map(t => <Button key={t.id} variant={state.gear.includes(t.id) ? "default" : "secondary"} size="icon" title={t.name} aria-label={`${state.gear.includes(t.id) ? "Unequip" : "Equip"} ${t.name}`} disabled={busy} onClick={() => void game.act({ action: "gear", gear: state.gear.includes(t.id) ? state.gear.filter(id => id !== t.id) : [...state.gear, t.id] }).catch(() => {})}>{t.icon}</Button>)}</div><Button className="treasure-interact" disabled={busy || !game.loaded} onClick={() => void interact()}><span className="text-xl">{nearby ? "✨" : portal ? "🌀" : "🔎"}</span>{landmark ? "Inspect landmark" : nearby ? "Open treasure" : lockedChest && state.zone === "sky" ? "Match tiles" : portal ? "Enter portal" : "Search"}</Button></div>
      </div>
    </div>
    <footer className="treasure-footer"><span className="flex items-center gap-2"><Flag className="h-3.5 w-3.5 text-primary" /><span className="hidden sm:inline">A journey of courage, kindness & wisdom</span><span className="sm:hidden">Your brave adventure</span></span><Link to="/mentor" className="flex items-center gap-1.5 text-primary"><BookOpen className="h-4 w-4" />Talk to Monere<ArrowRight className="h-3.5 w-3.5" /></Link></footer>
    <Dialog open={!!panel} onOpenChange={open => { if (!open) setPanel(null); }}><DialogContent className="max-h-[85dvh] max-w-3xl overflow-y-auto rounded-lg"><DialogTitle className="flex items-center gap-2 text-2xl"><Compass className="text-primary" />{panel === "map" ? "The world awaits" : panel === "quests" ? "Quest scroll" : "Collector's Logbook"}</DialogTitle><DialogDescription>{panel === "map" ? "Three stages. Six chests. One brave team." : `${state.relics.length} relics discovered · ${value} collection value (not spendable points)`}</DialogDescription>
      {panel === "map" ? <div className="grid gap-4 sm:grid-cols-3">{ZONES.map(z => <div key={z.id} className="overflow-hidden rounded-lg border border-border"><img src={maps[z.id]} alt={z.name} width={1536} height={1536} loading="lazy" className="aspect-square w-full object-cover" /><div className="p-3"><h2 className="text-lg">{z.name}</h2><p className="mt-1 text-sm text-muted-foreground">{z.subtitle}</p><p className="mt-3 flex items-center gap-2 text-xs text-primary">{state.unlocked.includes(z.id) ? <><Check className="h-4 w-4" />{state.zone === z.id ? "Exploring now" : "Portal unlocked"}</> : <><LockKeyhole className="h-4 w-4" />Complete {z.id === "forest" ? "Meadow’s three chests" : "Forest’s two chests"}</>}</p><p className="mt-2 text-xs">{RELICS.filter(r => r.zone === z.id && state.relics.includes(r.id)).length}/{RELICS.filter(r => r.zone === z.id).length} chests</p></div></div>)}</div> : panel === "quests" ? <div className="grid gap-3">{zoneRelics.map(r => <div key={r.id} className="flex items-start gap-3 border-b border-border pb-3"><span className="text-2xl">{state.relics.includes(r.id) ? "✅" : "📜"}</span><div><h2 className="text-base">{state.relics.includes(r.id) ? r.name : "Undiscovered relic"}</h2><p className="mt-1 text-sm text-muted-foreground">{state.relics.includes(r.id) ? r.lore : clue}</p></div></div>)}</div> : <><div className="flex gap-2 border-b border-border pb-3">{[{ id: "relics" as const, label: "Relics", Icon: Gem }, { id: "gear" as const, label: "Tools", Icon: Backpack }, { id: "wardrobe" as const, label: "Wardrobe", Icon: Shirt }].map(t => <Button key={t.id} variant={tab === t.id ? "default" : "ghost"} onClick={() => setTab(t.id)}><t.Icon className="h-4 w-4" />{t.label}</Button>)}</div>
        {tab === "relics" ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{RELICS.map(r => { const found = state.relics.includes(r.id); return <div key={r.id} className={`rounded-lg border p-3 ${found ? "border-primary/30 bg-primary/5" : "border-border bg-muted/30"}`}><span className="mb-2 block text-3xl">{found ? r.icon : "🔒"}</span><h2 className="text-base">{found ? r.name : "Undiscovered"}</h2><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{found ? r.lore : ZONES.find(z => z.id === r.zone)?.name}</p></div>; })}</div> : tab === "gear" ? <div className="grid gap-3 sm:grid-cols-2">{TOOLS.map(t => <div key={t.id} className="rounded-lg border border-border p-4"><span className="text-3xl">{t.icon}</span><h2 className="mt-2 text-lg">{t.name}</h2><p className="my-3 text-sm text-muted-foreground">{t.description}</p><Button disabled={!state.tools.includes(t.id) || busy} variant={state.gear.includes(t.id) ? "secondary" : "default"} onClick={() => void game.act({ action: "gear", gear: state.gear.includes(t.id) ? state.gear.filter(id => id !== t.id) : [...state.gear, t.id] }).catch(() => {})}>{state.tools.includes(t.id) ? state.gear.includes(t.id) ? "Equipped · take off" : "Equip tool" : "Not found yet"}</Button></div>)}</div> : <div className="grid gap-3 sm:grid-cols-3">{REWARD_SETS.map(set => { const item = SHOP_ITEMS.find(i => i.id === set.item); const count = RELICS.filter(r => r.zone === set.zone && state.relics.includes(r.id)).length; return <div key={set.zone} className="rounded-lg border border-border p-3">{item && <img src={item.src} width={816} height={816} alt={item.name} loading="lazy" className="aspect-square w-full object-contain" />}<h2 className="text-lg">{set.name}</h2><p className="mt-1 text-xs text-muted-foreground">{set.label} · {count}/{RELICS.filter(r => r.zone === z.id).length} chests</p><p className="mt-2 text-xs text-primary">{count === RELICS.filter(r => r.zone === set.zone).length ? game.user ? "Unlocked in your wardrobe" : "Guest discovery · sign in to earn account rewards" : "Find this zone's complete relic set"}</p></div>; })}<Button asChild className="sm:col-span-3"><Link to={game.user ? "/shop" : "/auth"}><Shirt />{game.user ? "Open wardrobe" : "Sign in for wardrobe rewards"}</Link></Button></div>}
      </>}
    </DialogContent></Dialog>
    <MatchingPuzzle open={puzzle} onClose={() => setPuzzle(false)} state={state} choose={async tile => { await game.act({ action: "match", id: String(tile) }); }} />
    <Dialog open={!!victory && !reward} onOpenChange={open => { if (!open) setVictory(null); }}><DialogContent className="max-w-md rounded-lg text-center"><DialogTitle className="text-2xl text-primary">{victory === "sky" ? "Adventure complete!" : "Stage cleared!"}</DialogTitle><DialogDescription>{victory === "sky" ? "The Master Chest is open. Courage, patience and teamwork brought you here." : "Every chest is open. The eastern gateway to the next, harder land is now unlocked."}</DialogDescription><div className="mx-auto h-32 w-32"><MonereFigure gesture="thumbs" /></div><Button onClick={() => setVictory(null)}>{victory === "sky" ? "Keep exploring" : "On to the gateway"}<ArrowRight /></Button></DialogContent></Dialog>
    <Dialog open={!!reward} onOpenChange={open => { if (!open) setReward(null); }}><DialogContent className="max-w-md rounded-lg text-center"><DialogTitle className="text-2xl text-primary">Treasure discovered!</DialogTitle><DialogDescription>{reward?.name}</DialogDescription><div className="mx-auto h-28 w-28"><MonereFigure gesture="thumbs" /></div><span className="treasure-reward block text-6xl">{reward?.icon}</span><p className="font-body text-sm leading-relaxed">{reward?.lore}</p>{reward?.tool && <p className="rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-primary">New tool: {TOOLS.find(t => t.id === reward.tool)?.name}! {TOOLS.find(t => t.id === reward.tool)?.description}</p>}<p className="text-xs text-muted-foreground">+{reward?.value} collection value · {game.user ? "Saved to your account" : "Saved on this device"}</p><Button onClick={() => setReward(null)}>Keep exploring<ArrowRight /></Button></DialogContent></Dialog>
  </section>;
}