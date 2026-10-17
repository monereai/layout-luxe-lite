import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { syncMembership } from "@/lib/paypal.functions";

export type MemberTier = "free" | "plus" | "club";
type Plan = { user: User | null; premium: boolean; tier: MemberTier; bonusPoints: number; tokens: number; ready: boolean; refresh: () => Promise<boolean>; signOut: () => Promise<void> };

const PlanCtx = createContext<Plan>({ user: null, premium: false, tier: "free", bonusPoints: 0, tokens: 0, ready: false, refresh: async () => false, signOut: async () => {} });

export function PlanProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [premium, setPremium] = useState(false);
  const [tier, setTier] = useState<MemberTier>("free");
  const [bonusPoints, setBonus] = useState(0);
  const [tokens, setTokens] = useState(0);
  const [ready, setReady] = useState(false);

  const check = useCallback(async (u: User | null) => {
    if (!u) { setPremium(false); setTier("free"); setBonus(0); setTokens(0); return false; }
    const [{ data }, { data: credits }, { data: subs }, { data: profile }] = await Promise.all([
      supabase.rpc("is_premium", { check_env: "live" }),
      supabase.from("point_credits").select("points"),
      supabase.from("subscriptions").select("product_id,status,current_period_end").eq("stripe_customer_id", "paypal"),
      supabase.from("profiles").select("tokens").eq("user_id", u.id).maybeSingle(),
    ]);
    const p = data === true;
    setPremium(p);
    setBonus((credits ?? []).reduce((s, c) => s + c.points, 0));
    setTokens(profile?.tokens ?? 0);
    const live = (subs ?? []).filter((s) => s.status === "active" || (s.current_period_end && Date.parse(s.current_period_end) > Date.now()));
    setTier(live.some((s) => s.product_id === "club") ? "club" : p ? "plus" : "free");
    window.localStorage.setItem("monereai-tier", p ? "premium" : "free");
    return p;
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => { setUser(data.user); await check(data.user); setReady(true); if (data.user) void syncMembership().then(() => check(data.user)).catch(() => {}); });
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

  return <PlanCtx.Provider value={{ user, premium, tier, bonusPoints, ready, refresh, signOut }}>{children}</PlanCtx.Provider>;
}

export const usePlan = () => useContext(PlanCtx);
