import { useEffect, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookHeart, CheckCircle2, Clock, Sparkles, Trophy, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { MonereMentor } from '@/components/MonereMentor';
import { usePlan } from '@/hooks/usePlan';
import { useCare } from '@/hooks/useCare';
import { playDailyDilemma } from '@/lib/daily-dilemma.functions';
import { DAILY_DILEMMAS, dilemmaCountdown } from '@/lib/daily-dilemma';
import { playChime } from '@/lib/sound';

export function DailyDilemmaModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { user, ready } = usePlan();
  const { accept } = useCare();
  const play = useServerFn(playDailyDilemma);
  const client = useQueryClient();
  const key = ['daily-dilemma', user?.id];
  const status = useQuery({ queryKey: key, queryFn: () => play({ data: { action: 'status' } }), enabled: open && ready && !!user, staleTime: 0, refetchOnWindowFocus: 'always', retry: 1 });
  const state = status.data;
  const story = state ? DAILY_DILEMMAS[state.scenario] : undefined;
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [celebrate, setCelebrate] = useState(false);
  const [countdown, setCountdown] = useState('');
  const generation = useRef(0);
  const locked = useRef(false);
  const choose = useMutation({ mutationFn: play });
  useEffect(() => {
    generation.current++; locked.current = false; setFeedback(''); setError(''); setCelebrate(false);
    return () => { generation.current++; };
  }, [open, user?.id]);
  useEffect(() => {
    if (!open || !state) return;
    const started = performance.now();
    const tick = () => {
      const remaining = dilemmaCountdown(state.nextAt, state.serverNow, performance.now() - started);
      setCountdown(remaining);
      if (remaining === '00:00:00') void status.refetch();
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [open, state?.day, state?.serverNow, state?.nextAt]);

  async function decide(choice: number) {
    if (!user || !state || state.completed || locked.current) return;
    locked.current = true;
    const version = generation.current;
    setError(''); setFeedback('');
    try {
      const next = await choose.mutateAsync({ data: { action: 'choose', day: state.day, choice } });
      if (version !== generation.current) return;
      client.setQueryData(key, next);
      if (next.accepted && next.completed) {
        setCelebrate(next.rewarded);
        if (next.rewarded) { playChime('win'); toast.success(`+${next.care.energyAwarded} Energy · +50 Points! 🦁`); }
        await accept(next.care);
      } else setFeedback(story?.feedback ?? 'Take a moment and choose a response grounded in kindness and integrity.');
    } catch (e) {
      if (version === generation.current) setError(e instanceof Error ? e.message : 'Could not save your choice. Please try again.');
    } finally { if (version === generation.current) locked.current = false; }
  }

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-xl overflow-y-auto rounded-lg p-4 sm:p-6">
      <DialogTitle className="flex items-start gap-2 pr-6 font-display text-2xl"><BookHeart className="mt-1 shrink-0 text-primary" /> Monere’s Daily Dilemma</DialogTitle>
      <DialogDescription>{state?.completed ? 'A lionhearted choice for today.' : 'One day. One choice. A little more wisdom.'}</DialogDescription>
      {!ready ? <p role="status">Getting ready…</p> : !user ? <>
        <MonereMentor companion />
        <p>Create a free MonereAI account or sign in to play mini-games, earn points, and unlock outfits!</p>
        <Button asChild className="btn-gold h-auto whitespace-normal py-3"><Link to="/auth" search={{ next: '/?dilemma=1' }}>Create account / Sign in</Link></Button>
      </> : status.isPending ? <p role="status" className="py-8 text-center">Monere is opening today’s dilemma…</p> : state && story ? state.completed ? <div className="text-center">
        <div className={`relative ${celebrate ? 'motion-safe:animate-in motion-safe:zoom-in-95 motion-safe:duration-700' : ''}`}>
          <MonereMentor mode="results" companion />
          {celebrate && <Sparkles aria-hidden="true" className="absolute right-4 top-4 h-10 w-10 text-primary motion-safe:animate-bounce" />}
        </div>
        <p className="mt-5 flex items-center justify-center gap-2 font-semibold text-primary"><CheckCircle2 className="h-5 w-5" /> Today’s dilemma complete</p>
        <p className="mt-3 text-base leading-relaxed">{story.reflection}</p>
        <p className="mt-2 text-xs text-muted-foreground">{story.reference}</p>
        {celebrate && <p role="status" className="mt-4 font-semibold text-primary">+{state.care.energyAwarded} Energy · +50 Points</p>}
        <div className="mt-5 border-t border-border pt-4">
          <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground"><Clock className="h-4 w-4" /> Next dilemma in</p>
          <p role="timer" aria-label="Time until the next dilemma" className="mt-2 font-display text-3xl font-semibold tabular-nums text-primary">{countdown || '…'}</p>
          <p className="mt-1 text-xs text-muted-foreground">A new story at midnight UTC</p>
        </div>
        <Button onClick={() => onOpenChange(false)} variant="outline" className="mt-4">Back to the Treehouse</Button>
      </div> : <>
        <MonereMentor portrait={false} />
        <article className="rounded-lg border border-border bg-secondary p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase text-primary">{story.theme}</p>
          <h2 className="mt-2 font-display text-xl font-semibold">{story.title}</h2>
          <p className="mt-3 leading-relaxed">{story.story}</p>
        </article>
        <div className="grid gap-2" aria-label="Decision options">
          {story.choices.map((choice, index) => <Button key={choice} variant="outline" disabled={choose.isPending} onClick={() => void decide(index)} className="h-auto min-h-14 justify-start gap-3 whitespace-normal px-4 py-3 text-left leading-relaxed">
            <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">{String.fromCharCode(65 + index)}</span><span>{choice}</span>
          </Button>)}
        </div>
        {feedback && <p role="status" className="rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm leading-relaxed">{feedback}</p>}
        <p className="flex flex-wrap items-center justify-center gap-2 text-sm font-semibold text-primary"><Zap className="h-4 w-4" /> +25 Energy <Trophy className="h-4 w-4" /> +50 Points</p>
        <p className="text-center text-xs text-muted-foreground">One completion per day · Energy capped at 100</p>
      </> : null}
      {(error || status.isError) && <div role="alert" className="text-center text-sm text-destructive">
        <p>{error || 'Could not open today’s dilemma. Please try again.'}</p>
        <Button variant="outline" className="mt-2" onClick={() => { setError(''); void status.refetch(); }}>Try again</Button>
      </div>}
    </DialogContent>
  </Dialog>;
}