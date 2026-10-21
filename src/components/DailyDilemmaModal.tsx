import { useEffect, useRef, useState } from 'react';
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
import { DAILY_DILEMMAS, DAILY_DILEMMAS as STORIES, dilemmaCountdown, dilemmaIndex } from '@/lib/daily-dilemma';
import { playChime } from '@/lib/sound';
import { GuestSignupModal } from '@/components/GuestSignupModal';

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
  const [guestModal, setGuestModal] = useState(false);
  const generation = useRef(0);
  const locked = useRef(false);
  const choose = useMutation({ mutationFn: play });
  const reset = useMutation({ mutationFn: play });
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
    if (!user || !state || state.completed || locked.current || reset.isPending) return;
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

  async function resetTimer() {
    if (!user || !state?.canReset || locked.current) return;
    locked.current = true;
    const version = generation.current;
    setError('');
    try {
      const next = await reset.mutateAsync({ data: { action: 'reset' } });
      if (version !== generation.current) return;
      client.setQueryData(key, next);
      setFeedback(''); setCelebrate(false); setCountdown('');
      toast.success('Daily Dilemma timer reset!');
      await accept(next.care);
    } catch (e) {
      if (version === generation.current) setError(e instanceof Error ? e.message : 'Could not reset the timer. Please try again.');
    } finally { if (version === generation.current) locked.current = false; }
  }

  return <><Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-xl overflow-y-auto rounded-lg p-4 sm:p-6">
      <DialogTitle className="flex items-start gap-2 pr-6 font-display text-2xl"><BookHeart className="mt-1 shrink-0 text-primary" /> Monere’s Daily Dilemma</DialogTitle>
      <DialogDescription>{state?.completed ? 'A lionhearted choice for today.' : 'One day. One choice. A little more wisdom.'}</DialogDescription>
      {!ready ? <p role="status">Getting ready…</p> : !user ? <GuestDilemma onDone={() => { onOpenChange(false); setGuestModal(true); }} /> : status.isPending ? <p role="status" className="py-8 text-center">Monere is opening today’s dilemma…</p> : state && story ? state.completed ? <div className="text-center">
        <div className={`relative ${celebrate ? 'motion-safe:animate-in motion-safe:zoom-in-95 motion-safe:duration-700' : ''}`}>
          <MonereMentor mode="results" companion />
          {celebrate && <Sparkles aria-hidden="true" className="absolute right-4 top-4 h-10 w-10 text-primary motion-safe:animate-bounce" />}
        </div>
        <p className="mt-5 flex items-center justify-center gap-2 font-semibold text-primary"><CheckCircle2 className="h-5 w-5" /> Today’s dilemma complete</p>
        <p className="font-body mt-3 text-base leading-relaxed">{story.reflection}</p>
        <p className="mt-2 text-xs text-muted-foreground">{story.reference}</p>
        {celebrate && <p role="status" className="font-heading mt-4 text-base font-semibold"><span className="text-energy">+{state.care.energyAwarded} Energy</span><span className="text-muted-foreground"> · </span><span className="text-points">+50 Points</span></p>}
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
          <p className="font-body mt-3 leading-relaxed">{story.story}</p>
        </article>
        <div className="grid gap-2" aria-label="Decision options">
          {story.choices.map((choice, index) => <Button key={choice} variant="outline" disabled={choose.isPending || reset.isPending} onClick={() => void decide(index)} className="h-auto min-h-14 justify-start gap-3 whitespace-normal px-4 py-3 text-left leading-relaxed">
            <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">{String.fromCharCode(65 + index)}</span><span className="font-body font-semibold">{choice}</span>
          </Button>)}
        </div>
        {feedback && <p role="status" className="rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm leading-relaxed">{feedback}</p>}
        <p className="flex flex-wrap items-center justify-center gap-3 font-heading text-sm font-semibold"><span className="flex items-center gap-1.5 text-energy"><Zap className="h-4 w-4" /> +25 Energy</span><span className="flex items-center gap-1.5 text-points"><Trophy className="h-4 w-4" /> +50 Points</span></p>
        <p className="text-center text-xs text-muted-foreground">One completion per day · Energy capped at 100</p>
      </> : null}
      {user && state?.canReset && <Button variant="outline" size="sm" disabled={choose.isPending || reset.isPending} onClick={() => void resetTimer()} className="mx-auto h-auto whitespace-normal"><Zap className="h-3.5 w-3.5" /> {reset.isPending ? 'Resetting…' : 'Dev Reset Timer'}</Button>}
      {(error || status.isError) && <div role="alert" className="text-center text-sm text-destructive">
        <p>{error || 'Could not open today’s dilemma. Please try again.'}</p>
        <Button variant="outline" className="mt-2" onClick={() => { setError(''); void status.refetch(); }}>Try again</Button>
      </div>}
    </DialogContent>
  </Dialog>
  <GuestSignupModal open={guestModal} onOpenChange={setGuestModal} next="/?dilemma=1" /></>;
}

const GUEST_KEY = 'monereai-guest-dilemma';

/** One browser-local Daily Dilemma for guests; nothing is credited until they sign up and play signed in. */
function GuestDilemma({ onDone }: { onDone: () => void }) {
  const [day] = useState(() => new Date().toISOString().slice(0, 10));
  const story = STORIES[dilemmaIndex(day)];
  const [done, setDone] = useState(false);
  const [feedback, setFeedback] = useState('');
  useEffect(() => { setDone(window.localStorage.getItem(GUEST_KEY) === day); }, [day]);
  function pick(i: number) {
    if (i !== story.wise) { setFeedback(story.feedback); return; }
    window.localStorage.setItem(GUEST_KEY, day);
    playChime('win');
    onDone();
  }
  if (done) return <div className="text-center">
    <MonereMentor mode="results" companion />
    <p className="font-body mt-4">You've already completed today's dilemma as a guest.</p>
    <Button className="btn-gold mt-4 h-auto whitespace-normal py-3" onClick={onDone}>Save My Progress (Free Sign-Up)</Button>
  </div>;
  return <>
    <MonereMentor portrait={false} />
    <article className="rounded-lg border border-border bg-secondary p-4 sm:p-5">
      <p className="text-xs font-semibold uppercase text-primary">{story.theme}</p>
      <h2 className="mt-2 font-display text-xl font-semibold">{story.title}</h2>
      <p className="font-body mt-3 leading-relaxed">{story.story}</p>
    </article>
    <div className="grid gap-2" aria-label="Decision options">
      {story.choices.map((choice, index) => <Button key={choice} variant="outline" onClick={() => pick(index)} className="h-auto min-h-14 justify-start gap-3 whitespace-normal px-4 py-3 text-left leading-relaxed">
        <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">{String.fromCharCode(65 + index)}</span><span className="font-body font-semibold">{choice}</span>
      </Button>)}
    </div>
    {feedback && <p role="status" className="rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm leading-relaxed">{feedback}</p>}
  </>;
}
