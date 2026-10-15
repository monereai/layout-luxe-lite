import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Plan = { user: User | null; premium: boolean; ready: boolean; refresh: () => Promise<boolean>; signOut: () => Promise<void> };

const PlanCtx = createContext<Plan>({ user: null, premium: false, ready: false, refresh: async () => false, signOut: async () => {} });


export function PlanProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [premium, setPremium] = useState(false);
  const [ready, setReady] = useState(false);

  const check = useCallback(async (u: User | null) => {
    if (!u) { setPremium(false); return false; }
    const { data } = await supabase.rpc("is_premium", { check_env: "live" });
    const p = data === true;
    setPremium(p);
    window.localStorage.setItem("monereai-tier", p ? "premium" : "free");
    return p;
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => { setUser(data.user); await check(data.user); setReady(true); });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      const u = session?.user ?? null;
      setUser(u);
      void check(u);
    });
    return () => sub.subscription.unsubscribe();
  }, [check]);

  const refresh = useCallback(() => check(user), [check, user]);
  const signOut = useCallback(async () => { await supabase.auth.signOut(); }, []);

  return <PlanCtx.Provider value={{ user, premium, ready, refresh, signOut }}>{children}</PlanCtx.Provider>;
}

export const usePlan = () => useContext(PlanCtx);
