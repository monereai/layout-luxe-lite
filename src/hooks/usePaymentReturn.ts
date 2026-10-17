import { useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { usePlan } from "@/hooks/usePlan";
import { confirmCheckout } from "@/lib/payments.functions";
import { getStripeEnvironment } from "@/lib/stripe";
import { playFanfare } from "@/lib/sound";

/** Handles both the home return and existing shop return links after auth hydration. */
export function usePaymentReturn() {
  const { user, ready, refresh } = usePlan();
  const confirm = useServerFn(confirmCheckout);
  const queryClient = useQueryClient();
  const handled = useRef(false);

  useEffect(() => {
    if (!ready || !user || handled.current) return;
    const url = new URL(window.location.href);
    const sessionId = url.searchParams.get("session_id");
    if (!sessionId) return;
    handled.current = true;
    void (async () => {
      try {
        const r = await confirm({ data: { sessionId, environment: getStripeEnvironment() } });
        await refresh();
        await queryClient.invalidateQueries({ queryKey: ["monere-care", user.id] });
        if (!r.ok) { toast.error(r.error ?? "We couldn't confirm that payment yet. Contact us if it doesn't appear shortly."); return; }
        url.searchParams.delete("session_id");
        window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
        try { playFanfare(); } catch { /* sound optional */ }
        if (r.kind === "pack") toast.success(`🎉 +${r.points} Shop Points added to your wallet!`, { duration: 6000 });
        else toast.success(`👑 Welcome to ${r.tier === "club" ? "Monere Club" : "Monere Plus"}! Your monthly points and tokens are in your wallet.`, { duration: 6000 });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "We couldn't confirm that payment yet. Please retry.");
      }
    })();
  }, [ready, user, confirm, refresh, queryClient]);
}