import { useEffect, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, DoorOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import grove from "@/assets/treasure/grove.jpg";
import caverns from "@/assets/treasure/caverns.jpg";
import { SIDE_COLS, SIDE_ROWS, SIDE_ZONES, sideAdjacent, sideHazard, sideWalkable, type SideZoneId, type TreeId } from "@/lib/orchard";
import type { Position } from "@/lib/treasure";
import { playSound } from "@/lib/audio";

const art: Record<SideZoneId, string> = { grove, caverns };
const pct = (p: Position) => ({ left: `${((p.x + .5) / SIDE_COLS) * 100}%`, top: `${((p.y + .5) / SIDE_ROWS) * 100}%` });

/** A small optional land: walk with arrows/WASD or taps, harvest Energy Trees, step on the west edge to leave. */
export function SideZone({ zone, avatar, onExit, onPick, cooling, paused = false }: { zone: SideZoneId; avatar: string; onExit: () => void; onPick: (id: TreeId) => Promise<void>; cooling: (id: TreeId) => boolean; paused?: boolean }) {
  const land = SIDE_ZONES[zone];
  const [pos, setPos] = useState<Position>(land.start);
  const [face, setFace] = useState(1);
  function step(dx: number, dy: number) {
    if (paused) return;
    const next = { x: pos.x + dx, y: pos.y + dy };
    if (dx) setFace(dx);
    if (next.x < 0) { onExit(); return; } // west edge leads back
    if (!sideWalkable(zone, next)) return;
    if (sideHazard(zone, next)) { setPos(land.start); playSound("step.mp3", 0.3); return; }
    setPos(next); playSound("step.mp3", 0.3);
    const tree = land.trees.find(t => sideAdjacent(t.at, next) && !cooling(t.id));
    if (tree) void onPick(tree.id);
  }
  useEffect(() => {
    if (paused) return;
    const keys: Record<string, [number, number]> = { ArrowUp: [0, -1], w: [0, -1], ArrowDown: [0, 1], s: [0, 1], ArrowLeft: [-1, 0], a: [-1, 0], ArrowRight: [1, 0], d: [1, 0] };
    const on = (e: KeyboardEvent) => { const k = keys[e.key.length === 1 ? e.key.toLowerCase() : e.key]; if (k) { e.preventDefault(); step(...k); } };
    window.addEventListener("keydown", on); return () => window.removeEventListener("keydown", on);
  });
  return <div className="treasure-side" role="region" aria-label={land.name}>
    <img src={art[zone]} alt="" width={1280} height={896} className="absolute inset-0 h-full w-full object-cover" />
    <div className="treasure-side-objective" role="status">{land.objective}</div>
    <div className="treasure-side-title"><p className="font-display text-lg text-primary">{land.name}</p><p className="font-body text-xs">{land.subtitle}</p></div>
    <button type="button" className="treasure-side-exit" style={pct(land.exit)} onClick={onExit} aria-label="Leave this land"><DoorOpen /></button>
    {land.hazards.map(h => <span key={`h${h.x}-${h.y}`} className="treasure-side-hazard" style={pct(h)} aria-hidden="true" />)}
    {land.props.map(p => <span key={`p${p.at.x}-${p.at.y}`} className="treasure-side-prop" style={pct(p.at)} aria-hidden="true">{p.icon}</span>)}
    {land.trees.map(t => <button key={t.id} type="button" className="treasure-side-tree" data-cooling={cooling(t.id)} style={pct(t.at)} aria-label={cooling(t.id) ? "Energy Tree regrowing" : "Harvest Energy Tree"}
      disabled={paused} onClick={() => { if (sideAdjacent(t.at, pos)) void onPick(t.id); else { const target = [{ x: t.at.x - 1, y: t.at.y }, { x: t.at.x + 1, y: t.at.y }, { x: t.at.x, y: t.at.y - 1 }, { x: t.at.x, y: t.at.y + 1 }].find(p => sideWalkable(zone, p)); if (target) { setPos(target); void onPick(t.id); } } }}>
      <span>{t.icon}</span>{zone === "grove" && <b className="treasure-side-fruit" aria-hidden="true">🍎🍐</b>}{!cooling(t.id) && <i aria-hidden="true">⚡</i>}</button>)}
    <div className="treasure-side-monere" style={pct(pos)} aria-hidden="true"><img src={avatar} alt="" style={{ transform: `scaleX(${face})` }} draggable={false} /></div>
    <div className="treasure-side-pad" aria-label="Movement controls">{[{ x: 0, y: -1, Icon: ArrowUp, n: "Move up", c: "col-start-2" }, { x: -1, y: 0, Icon: ArrowLeft, n: "Move left", c: "row-start-2" }, { x: 0, y: 1, Icon: ArrowDown, n: "Move down", c: "col-start-2 row-start-2" }, { x: 1, y: 0, Icon: ArrowRight, n: "Move right", c: "col-start-3 row-start-2" }].map(({ x, y, Icon, n, c }) => <Button key={n} size="icon" variant="secondary" aria-label={n} className={c} onClick={() => step(x, y)}><Icon /></Button>)}</div>
  </div>;
}
