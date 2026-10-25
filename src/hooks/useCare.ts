import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { usePlan } from "@/hooks/usePlan";
import { openGuestReward } from "@/components/GuestSignupModal";
import { guestCompleted, markGuestComplete } from "@/lib/guest-preview";
import { makeSpots } from "@/lib/game";
import { updateCare, startCareRound, finishCareRound, rewardCareFind } from "@/lib/care.functions";
import type { CareState } from "@/lib/care";
import { toast } from "sonner";


export function useCare() {
  const { user, ready, refresh } = usePlan();
  const client = useQueryClient();
  const update = useServerFn(updateCare);
  const key = ["monere-care", user?.id];
  const query = useQuery({ queryKey: key, queryFn: () => update({ data: { action: "sync" } }), enabled: ready && !!user, refetchInterval: 60_000, refetchOnWindowFocus: "always", staleTime: 15_000, retry: 1 });
  const accept = async (state: CareState) => {
    client.setQueryData(key, state);
    if (user) { try { localStorage.setItem(`monere-energy-cache-${user.id}`, String(state.energy)); } catch { /* mirror */ } }
    if (state.overflowPoints) toast(`+${state.overflowPoints} Points! Energy Overflow!`);
    if (state.pointsAwarded || state.overflowPoints) await refresh();
  };
  const action = useMutation({ mutationFn: (action: "claim") => update({ data: { action } }), onSuccess: accept });
  return { ...query, user, ready, action, accept };
}

export function useCareRound(kind: "find" | "jigsaw", size: 3 | 4 | 5 | 6 | 7, roundKey: number) {
  const { user, ready, accept } = useCare();
  const start = useServerFn(startCareRound);
  const finish = useServerFn(finishCareRound);
  const find = useServerFn(rewardCareFind);
  const [round, setRound] = useState<{ id: string; order: number[]; spots: { x: number; y: number; size: number; rot: number }[] } | null>(null);
  const [error, setError] = useState("");
  const [reward, setReward] = useState("");
  const [pending, setPending] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const proof = useRef<number[] | [number, number][]>([]);
  const generation = useRef(0);
  const lock = useRef(false);
  useEffect(() => {
    const version = ++generation.current;
    lock.current = false;
    setRound(null); setError(""); setReward(""); setPending(false);
    if (!ready) return;
    if (!user) {
      // Guests get one local, unpaid practice round per game; nothing is sent to the server.
      if (guestCompleted() || window.localStorage.getItem(`monereai-guest-${kind}`) === "done") { setError("You've played your free guest round. Create a free account to keep playing!"); openGuestReward(); }
      else if (kind === "find") setRound({ id: "guest", order: [], spots: makeSpots() });
      return;
    }
    void start({ data: { kind, size } }).then((r) => {
      if (generation.current === version) setRound(r);
    }).catch(() => { if (generation.current === version) setError("Couldn't start the reward round. Try again."); });
    return () => { generation.current++; };
  }, [user?.id, ready, kind, size, roundKey, attempt, start]);
  const complete = useCallback(async (result: number[] | [number, number][]) => {
    proof.current = result;
    if (!user) {
      window.localStorage.setItem(`monereai-guest-${kind}`, "done");
      setReward("+50 Points — sign up to save them!");
      markGuestComplete(50);
      window.setTimeout(openGuestReward, 1200);
      return;
    }
    if (!round || lock.current) return;
    lock.current = true; setPending(true); setError("");
    const version = generation.current;
    try {
      const state = await finish({ data: { round: round.id, proof: result } });
      await accept(state);
      if (version === generation.current) setReward(`+${state.energyAwarded} Energy · +${state.pointsAwarded} Points`);
    } catch (e) {
      if (version === generation.current) setError(e instanceof Error ? e.message : "Couldn't save your reward.");
      lock.current = false;
    } finally { if (version === generation.current) setPending(false); }
  }, [user?.id, round, finish, accept]);
  const rewardFind = async (spot: number, moves?: [number, number][]) => {
    if (!user) return null;
    if (!round) throw new Error("Wait for the game to start.");
    const state = await find({ data: { round: round.id, spot, proof: moves ?? [] } });
    await accept(state);
    return state;
  };
  return { round, error, reward, pending, rewardFind, canPlay: ready && (user ? !!round : !error), complete, retry: () => round ? void complete(proof.current) : setAttempt((n) => n + 1) };
}