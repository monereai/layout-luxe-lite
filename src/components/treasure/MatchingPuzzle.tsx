import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { MATCH_TILES, type AdventureState } from "@/lib/treasure";

export function MatchingPuzzle({ open, onClose, state, choose }: { open: boolean; onClose: () => void; state: AdventureState; choose: (tile: number) => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [revealed, setRevealed] = useState<number | null>(null);
  async function flip(tile: number) {
    setBusy(true); setRevealed(tile);
    try {
      await choose(tile);
      if (state.first !== null) await new Promise(resolve => setTimeout(resolve, 800));
    } finally { setRevealed(null); setBusy(false); }
  }
  return <Dialog open={open} onOpenChange={value => { if (!value && !busy) onClose(); }}><DialogContent className="max-w-md rounded-lg"><DialogTitle className="text-2xl text-primary">The Sky's Four Twins</DialogTitle><DialogDescription>{state.matched.length === 8 ? "All four pairs reunited. The Master Chest is ready to open." : `${state.matched.length / 2} of 4 pairs reunited`}</DialogDescription><div className="grid grid-cols-4 gap-3">{MATCH_TILES.map((symbol, tile) => {
    const matched = state.matched.includes(tile); const faceUp = matched || state.first === tile || revealed === tile;
    return <Button key={tile} variant={matched ? "default" : "outline"} disabled={busy || matched || state.first === tile} className="aspect-square h-auto p-0 text-3xl" aria-label={`Tile ${tile + 1}${matched ? " matched" : faceUp ? ` ${symbol}` : " face down"}`} onClick={() => void flip(tile).catch(() => {})}>{faceUp ? symbol : "✦"}</Button>;
  })}</div><Button onClick={onClose} disabled={busy}>{state.matched.length === 8 ? "Return to Master Chest" : "Return to the sky"}</Button></DialogContent></Dialog>;
}