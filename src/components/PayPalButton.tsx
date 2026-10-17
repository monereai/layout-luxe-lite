import { useEffect, useRef, useState } from "react";
import { PAYPAL_CLIENT_ID } from "@/lib/paypal-config";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

type Mode = "capture" | "subscription";
const loads: Partial<Record<Mode, Promise<any>>> = {};

// PayPal needs separate SDK loads for one-off orders and subscriptions; each gets its own namespace.
function loadSdk(mode: Mode): Promise<any> {
  const ns = mode === "capture" ? "paypal_orders" : "paypal_subs";
  if ((window as any)[ns]) return Promise.resolve((window as any)[ns]);
  return (loads[mode] ??= new Promise((resolve, reject) => {
    const q = mode === "capture" ? "intent=capture" : "vault=true&intent=subscription";
    const s = document.createElement("script");
    s.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=GBP&components=buttons&${q}`;
    s.setAttribute("data-namespace", ns);
    s.setAttribute("data-no-one-link", "true");
    s.className = "one-link-ignore";
    const timeout = window.setTimeout(() => fail(), 20000);
    function fail() {
      window.clearTimeout(timeout);
      delete loads[mode];
      s.remove();
      reject(new Error("PayPal failed to load"));
    }
    s.onload = () => {
      window.clearTimeout(timeout);
      const sdk = (window as any)[ns];
      if (sdk?.Buttons) resolve(sdk);
      else fail();
    };
    s.onerror = fail;
    document.head.appendChild(s);
  }));
}

export function PayPalButton(props:
  | { mode: "capture"; createOrder: () => Promise<string>; onApprove: (orderId: string) => Promise<void>; onError?: () => void }
  | { mode: "subscription"; planId: string; onApprove: (subscriptionId: string) => Promise<void>; onError?: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const latest = useRef(props);
  latest.current = props;
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const key = props.mode === "subscription" ? props.planId : "capture";

  useEffect(() => {
    let buttons: any;
    let cancelled = false;
    const host = document.createElement("div");
    host.setAttribute("data-no-one-link", "true");
    host.className = "one-link-ignore";
    ref.current?.replaceChildren(host);
    setFailed(false);
    setLoading(true);
    loadSdk(props.mode).then(async (paypal) => {
      if (cancelled || !ref.current) return;
      const p = latest.current;
      buttons = paypal.Buttons({
        style: { shape: "rect", color: "gold", layout: "vertical", height: 40 },
        ...(p.mode === "capture"
          ? { createOrder: () => (latest.current as any).createOrder(), onApprove: (d: any) => latest.current.onApprove(d.orderID) }
          : { createSubscription: (_d: any, actions: any) => actions.subscription.create({ plan_id: (latest.current as any).planId }), onApprove: (d: any) => latest.current.onApprove(d.subscriptionID) }),
        onError: () => {
          if (!cancelled) { setFailed(true); setLoading(false); latest.current.onError?.(); }
        },
      });
      await buttons.render(host);
      if (!cancelled) setLoading(false);
    }).catch(() => { if (!cancelled) { setFailed(true); setLoading(false); } });
    return () => {
      cancelled = true;
      host.remove();
      try { Promise.resolve(buttons?.close?.()).catch(() => {}); } catch { /* already closed */ }
    };
  }, [props.mode, key, attempt]);

  // Stop global click interceptors (link-routing scripts) from hijacking checkout clicks.
  return <div data-no-one-link="true" className="one-link-ignore relative z-10 min-h-11" onClick={(e) => e.stopPropagation()}>
    {loading && <p role="status" className="py-2 text-center text-xs text-muted-foreground">Loading PayPal…</p>}
    <div ref={ref} data-no-one-link="true" className={`one-link-ignore ${failed ? "hidden" : ""}`} />
    {failed && <div className="space-y-2">
      <p role="alert" className="text-xs text-destructive">PayPal couldn't load. Please try again.</p>
      <Button variant="outline" size="sm" className="w-full" onClick={() => setAttempt((value) => value + 1)}><RefreshCw /> Retry PayPal</Button>
    </div>}
  </div>;
}
