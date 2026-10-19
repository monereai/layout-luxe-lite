import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { runQaAction } from "@/lib/qa.functions";
import { Button } from "@/components/ui/button";
import { usePlan } from "@/hooks/usePlan";
import { ShieldCheck } from "lucide-react";
import { isSandboxAdmin } from "@/lib/admin";
import { resetOnAccount, saveShop } from "@/lib/shop";
import { saveProperties } from "@/lib/properties";

const ACTIONS = [
  { action: "fill", label: "Fill Energy (100)" },
  { action: "add_points", label: "Add 1,000 Points" },
  { action: "toggle_tier", label: "Toggle Tier" },
  { action: "reset_inventory", label: "Reset Inventory" },
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
    let active = true;
    setTester(false);
    const check = async () => {
      if (!user) return;
      const { data: u } = await supabase.auth.getUser();
      if (!u.user || !active) return;
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id).in("role", ["admin", "tester"]);
      if (active) setTester(!!data?.length);
    };
    void check();
    return () => { active = false; };
  }, [user?.id]);

  if (!tester && !isSandboxAdmin(user)) return null;
  return (
    <aside aria-label="Admin Sandbox" className="relative z-40 mt-6 w-fit max-w-full rounded-lg border border-primary/40 bg-card p-3 shadow-lg md:fixed md:bottom-6 md:left-3 md:mt-0 md:max-w-[calc(100%-1.5rem)]">
      <Button variant="outline" size="sm" aria-expanded={open} onClick={() => setOpen(!open)}><ShieldCheck />Admin Sandbox · {tier}</Button>
      {open && <div className="mt-3 flex max-w-xs flex-wrap gap-2">
        {ACTIONS.map((a) => (
          <Button key={a.action} size="sm" variant="outline" disabled={busy} onClick={async () => {
            setBusy(true);
            try {
              if (a.action === "reset_inventory" && !window.confirm("Reset all purchases, pets and habitats on this account?")) return;
              await run({ data: { action: a.action } });
              if (a.action === "reset_inventory") {
                await resetOnAccount().catch(() => saveShop({ spent: 0, owned: [], equipped: {} }));
                saveProperties({ unlockedProperties: ["treehouse"], activeProperty: "treehouse", spent: 0 });
                toast.success("Inventory reset");
                window.setTimeout(() => window.location.reload(), 600);
                return;
              }
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
