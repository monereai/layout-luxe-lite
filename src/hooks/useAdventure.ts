import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { usePlan } from "./usePlan";
import { adventureAction } from "@/lib/treasure.functions";
import { applyAdventure, initialAdventure, parseAdventure, type AdventureAction, type AdventureState, type Position } from "@/lib/treasure";
import { loadPets } from "@/lib/pets";

const GUEST_KEY = "monere-griffin-guest-v1";
export function useAdventure() {
  const { user, ready, refresh } = usePlan();
  const run = useServerFn(adventureAction);
  const client = useQueryClient();
  const key = ["treasure", user?.id ?? "guest"];
  const query = useQuery({ queryKey: key, queryFn: () => run({ data: { action: "status" } }), enabled: ready && !!user, staleTime: Infinity, refetchOnWindowFocus: false });
  const [state, setState] = useState<AdventureState>(initialAdventure);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [revision, setRevision] = useState(0);
  const current = useRef(state);
  const steps = useRef<Position[]>([]);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const generation = useRef(0);
  function update(next: AdventureState) { current.current = next; setState(next); }
  useEffect(() => {
    generation.current++; steps.current = []; queue.current = Promise.resolve(); setLoaded(false);
    if (!ready) return;
    if (!user) {
      // New guest playthroughs draw their own riddles and answer order.
      let raw: unknown = null; try { raw = JSON.parse(localStorage.getItem(GUEST_KEY) ?? "null"); } catch { raw = null; }
      const parsed = parseAdventure(raw);
      update(validRiddles((raw as { riddles?: unknown } | null)?.riddles) && parsed !== initialAdventure() ? parsed : { ...parsed, riddles: randomRiddles() });
      setRevision(v => v + 1); setLoaded(true);
    }
  }, [user?.id, ready]);
  useEffect(() => { if (query.data && user) { update(query.data.state); setLoaded(true); setRevision(v => v + 1); } }, [query.data, user?.id]);
  useEffect(() => { if (loaded) { try { localStorage.setItem(user ? `monere-treasure-cache-${user.id}` : GUEST_KEY, JSON.stringify(state)); } catch { /* keep playing */ } } }, [state, loaded, user?.id]);
  function enqueue<T>(work: () => Promise<T>): Promise<T> {
    const identity = generation.current;
    const pending = queue.current.catch(() => {}).then(async () => { if (identity !== generation.current) throw new Error("Account changed"); return work(); });
    queue.current = pending;
    return pending;
  }
  async function recover(error: unknown) {
    steps.current = []; toast.error(error instanceof Error ? error.message : "Your progress could not save. Reconnecting…");
    const result = await run({ data: { action: "status" } }).catch(() => null);
    if (result) { update(result.state); setRevision(v => v + 1); }
  }
  function flush() {
    if (!user || !steps.current.length) return Promise.resolve();
    const path = steps.current.splice(0, 32);
    return enqueue(async () => { setSaving(true); try { await run({ data: { action: "travel", steps: path } }); } catch (e) { await recover(e); throw e; } finally { setSaving(false); } });
  }
  useEffect(() => { const timer = window.setInterval(() => { void flush().catch(() => {}); }, 900); const onHide = () => { void flush().catch(() => {}); }; window.addEventListener("pagehide", onHide); return () => { clearInterval(timer); window.removeEventListener("pagehide", onHide); }; }, [user?.id, run]);
  function move(position: Position) {
    if (!loaded) return;
    const next = applyAdventure(current.current, { action: "move", ...position });
    if (next === current.current) return;
    update(next); if (user) { setSaving(true); steps.current.push(position); if (steps.current.length >= 24) void flush().catch(() => {}); }
  }
  async function act(action: AdventureAction) {
    if (!loaded) return current.current;
    if (!user) { const next = applyAdventure(current.current, action); update(next); return next; }
    await flush();
    return enqueue(async () => {
      setSaving(true);
      try {
        const result = await run({ data: action });
        update(result.state);
        if (result.points > 0) { toast.success(`+${result.points} points added to your balance!`); void refresh().catch(() => false); }
        if (result.griffin) { void loadPets().catch(() => {}); toast.success("The Golden Griffin joined your pets!"); }
        client.setQueryData(key, result);
        return result.state;
      } catch (e) { if (action.action === "answer") throw e; await recover(e); throw e; } finally { setSaving(false); }
    });
  }
  return { state, move, act, loaded, saving, revision, user, error: query.error, retry: () => query.refetch() };
}