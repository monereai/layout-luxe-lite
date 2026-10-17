import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { runQaAction } from "@/lib/qa.functions";
import { Button } from "@/components/ui/button";
import { usePlan } from "@/hooks/usePlan";
import { ShieldCheck } from "lucide-react";

const ACTIONS = [
  { action: "fill", label: "Fill Energy to 100" },
  { action: "toggle_tier", label: "Toggle Subscription Tier" },
  { action: "reset_claim", label: "Reset daily care cooldown" },
  { action: "topup", label: "+99,999 points & tokens" },
  { action: "club", label: "Club + Space Station access" },
] as const;

export function QaPanel() {
  const { user, tier, refresh } = usePlan();
  const [open, setOpen] = useState(false);
  const [tester, setTester] = useState(false);
  const [busy, setBusy] = useState(false);
  const run = useServerFn(runQaAction);
  const qc = useQueryClient();

  useEffect(() => {
    const check = async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return setTester(false);
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id).in("role", ["admin", "tester"]);
      setTester(!!data?.length);
    };
    check();
  }, [user?.id]);

  if (!tester) return null;
  return (
    <aside aria-label="Admin Tester panel" className="fixed bottom-40 right-3 z-40 max-w-[calc(100%-1.5rem)] rounded-lg border border-primary/40 bg-card p-3 shadow-lg md:bottom-6">
      <Button variant="outline" size="sm" aria-expanded={open} onClick={() => setOpen(!open)}><ShieldCheck />Admin Tester · {tier}</Button>
      {open && <div className="mt-3 flex max-w-xs flex-wrap gap-2">
        {ACTIONS.map((a) => (
          <Button key={a.action} size="sm" variant="outline" disabled={busy} onClick={async () => {
            setBusy(true);
            try {
              await run({ data: { action: a.action } });
              await refresh();
              await qc.invalidateQueries({ queryKey: ["monere-care", user?.id] });
              toast.success(a.label + " done");
            } catch (e) { toast.error((e as Error).message); }
            finally { setBusy(false); }
          }}>{a.label}</Button>
        ))}
      </div>}
    </aside>
  );
}
