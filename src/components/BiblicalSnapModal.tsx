import { useEffect, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useMutation } from '@tanstack/react-query';
import { Layers, Play, RotateCcw, Trophy, Zap, Rainbow, Sailboat, Cat, UserRound, Bird, Heart, Waves, Fish, Wheat, Shield, Swords } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { MonereMentor } from '@/components/MonereMentor';
import { usePlan } from '@/hooks/usePlan';
import { useCare } from '@/hooks/useCare';
import { playBiblicalSnap, type SnapState } from '@/lib/biblical-snap.functions';
import { SNAP_CYCLE_MS, snapCard, snapMatches } from '@/lib/biblical-snap';
import { playChime } from '@/lib/sound';
const CARD_ICONS = [Rainbow, Sailboat, Cat, UserRound, Bird, Heart, Sailboat, Waves, Fish, Wheat, Shield, Swords];

export function BiblicalSnapModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { user, ready } = usePlan();
  const { accept } = useCare();
  const play = useServerFn(playBiblicalSnap);
  const [round, setRound] = useState<SnapState | null>(null);
  const [error, setError] = useState('');
  const generation = useRef(0);
  const locked = useRef(false);
  const request = useMutation({ mutationFn: play });
  useEffect(() => { generation.current++; setRound(null); setError(''); locked.current = false; }, [open, user?.id]);

  async function act(action: 'start' | 'next' | 'snap') {
    if (locked.current || !user || (action !== 'start' && !round)) return;
    locked.current = true;
    const version = generation.current;
    setError('');
    try {
      const next = await request.mutateAsync({ data: { action, round: action === 'start' ? undefined : round?.id, turn: round?.turn } });
      if (version !== generation.current) return;
      setRound(next);
      if (next.care) await accept(next.care);
      if (next.completed && next.playerScore === 3 && !round?.completed) {
        playChime('win');
        if (next.rewarded) toast.success(`+${next.care?.energyAwarded ?? 0} Energy · +50 Points! 🦁`);
      }
    } catch (e) { if (version === generation.current) setError(e instanceof Error ? e.message : 'Could not save your turn. Try again.'); }
    finally { if (version === generation.current) locked.current = false; }
  }
  useEffect(() => {
    if (!open || !round || round.completed || error) return;
    const timer = window.setTimeout(() => void act('next'), SNAP_CYCLE_MS);
    return () => window.clearTimeout(timer);
  }, [open, round, error]);
  const matching = !!round && snapMatches(round.left, round.right);
  const won = round?.completed && round.playerScore === 3;
  const theme = snapCard(round?.left ?? 0);
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-xl overflow-y-auto rounded-lg p-4 sm:p-6">
      <DialogTitle className="flex items-center gap-2 pr-6 font-display text-2xl"><Layers className="text-primary" /> Biblical Snap</DialogTitle>
      <DialogDescription>{round?.completed ? (won ? 'You won!' : 'Monere wins this round!') : 'First to 3'}</DialogDescription>
      {!ready ? <p role="status">Getting ready…</p> : !user ? <>
        <p>Create a free MonereAI account or sign in to play mini-games, earn points, and unlock outfits!</p>
        <Button asChild className="btn-gold"><Link to="/auth" search={{ next: '/?snap=1' }}>Create account / Sign in</Link></Button>
      </> : round?.completed ? <div className="text-center">
        <MonereMentor mode="results" companion />
        {won && <><blockquote className="mt-4 font-display text-lg">“{theme.verse}”</blockquote><p className="mt-1 text-xs text-muted-foreground">{theme.reference}</p></>}
        <p role="status" className="my-4 font-semibold text-primary">{won ? round.rewarded ? `+${round.care?.energyAwarded ?? 0} Energy · +50 Points` : 'Daily reward already collected · Practice win' : 'Another round?'}</p>
        <Button onClick={() => void act('start')} disabled={request.isPending} className="btn-gold"><RotateCcw /> Play again</Button>
      </div> : round ? <>
        <div className="flex justify-between gap-4 text-sm font-bold"><span>Monere {round.monereScore} / 3</span><span>You {round.playerScore} / 3</span></div>
        <div className="grid grid-cols-2 gap-3">
          {[round.left, round.right].map((id, index) => { const card = snapCard(id); const Icon = CARD_ICONS[id] ?? Rainbow; return <div key={index} className="min-w-0 text-center">
            <p className="mb-2 text-xs font-semibold text-muted-foreground">{index === 0 ? "Monere's Card" : 'Your Card'}</p>
            <div key={`${round.turn}-${index}`} data-snap-category={Math.floor(id / 2)} className={`flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-lg border-2 p-2 motion-safe:animate-in motion-safe:fade-in ${matching ? 'border-primary bg-accent' : 'border-border bg-secondary'}`}>
              <Icon className="h-16 w-16 text-primary sm:h-20 sm:w-20" strokeWidth={1.5} aria-hidden="true" />
              <strong className="text-sm">{card.name}</strong><span className="text-xs text-muted-foreground">{card.title}</span>
            </div>
          </div>; })}
        </div>
        <Button onClick={() => void act('snap')} disabled={!matching || round.snapped || request.isPending} className="btn-gold mx-auto h-16 w-48 text-3xl motion-safe:transition-transform enabled:hover:scale-105">{round.snapped ? 'SNAPPED!' : 'SNAP!'}</Button>
        <p className="text-center text-xs text-muted-foreground">{round.rewardAvailable ? 'Daily prize: +25 Energy · +50 Points' : 'Practice round · Next reward at 00:00 UTC'}</p>
      </> : <div className="py-4 text-center">
        <MonereMentor companion />
        <p className="my-4 flex items-center justify-center gap-2 font-semibold text-primary"><Zap className="h-4 w-4" /> +25 Energy <Trophy className="h-4 w-4" /> +50 Points</p>
        <p className="mb-4 text-xs text-muted-foreground">One victory reward per day · Energy capped at 100</p>
        <Button disabled={request.isPending} onClick={() => void act('start')} className="btn-gold"><Play /> {request.isPending ? 'Dealing…' : 'Play Biblical Snap'}</Button>
      </div>}
      {error && <div role="alert" className="text-center text-sm text-destructive"><p>{error}</p><Button variant="outline" className="mt-2" onClick={() => { setError(''); void act(round && !round.completed ? 'next' : 'start'); }}>Try again</Button></div>}
    </DialogContent>
  </Dialog>;
}
