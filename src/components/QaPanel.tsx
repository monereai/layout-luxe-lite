import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { runQaAction } from "@/lib/qa.functions";
import { Button } from "@/components/ui/button";

const ACTIONS = [
  { action: "fill", label: "Fill energy to 100%" },
  { action: "reset_claim", label: "Reset daily care cooldown" },
  { action: "topup", label: "+99,999 points & tokens" },
  { action: "club", label: "Club + Space Station access" },
] as const;

export function QaPanel() {
  const [tester, setTester] = useState(false);
  const [busy, setBusy] = useState(false);
  const run = useServerFn(runQaAction);
  const qc = useQueryClient();

  useEffect(() => {
    const check = async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return setTester(false);
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id).eq("role", "tester").maybeSingle();
      setTester(!!data);
    };
    check();
    const { data: sub } = supabase.auth.onAuthStateChange(() => { check(); });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!tester) return null;
  return (
    <div className="rounded-xl border border-primary/40 bg-card/80 p-3 space-y-2">
      <p className="text-sm font-semibold text-primary">QA tester tools</p>
      <div className="flex flex-wrap gap-2">
        {ACTIONS.map((a) => (
          <Button key={a.action} size="sm" variant="outline" disabled={busy} onClick={async () => {
            setBusy(true);
            try {
              await run({ data: { action: a.action } });
              await qc.invalidateQueries();
              toast.success(a.label + " done");
            } catch (e) { toast.error((e as Error).message); }
            finally { setBusy(false); }
          }}>{a.label}</Button>
        ))}
      </div>
    </div>
  );
}
