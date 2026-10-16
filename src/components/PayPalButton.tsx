import { useEffect, useRef, useState } from "react";
import { PAYPAL_CLIENT_ID } from "@/lib/paypal-config";

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
    s.onload = () => resolve((window as any)[ns]);
    s.onerror = () => { delete loads[mode]; reject(new Error("PayPal failed to load")); };
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
  const key = props.mode === "subscription" ? props.planId : "capture";

  useEffect(() => {
    let buttons: any;
    let cancelled = false;
    loadSdk(props.mode).then((paypal) => {
      if (cancelled || !ref.current) return;
      const p = latest.current;
      buttons = paypal.Buttons({
        style: { shape: "rect", color: "gold", layout: "vertical", height: 40 },
        ...(p.mode === "capture"
          ? { createOrder: () => (latest.current as any).createOrder(), onApprove: (d: any) => latest.current.onApprove(d.orderID) }
          : { createSubscription: (_d: any, actions: any) => actions.subscription.create({ plan_id: (latest.current as any).planId }), onApprove: (d: any) => latest.current.onApprove(d.subscriptionID) }),
        onError: () => latest.current.onError?.(),
      });
      void buttons.render(ref.current);
    }).catch(() => setFailed(true));
    return () => { cancelled = true; buttons?.close?.().catch?.(() => {}); };
  }, [props.mode, key]);

  if (failed) return <p className="text-xs text-destructive">PayPal couldn't load. Check your connection and try again.</p>;
  // Stop global click interceptors (link-routing scripts) from hijacking checkout clicks.
  return <div ref={ref} data-no-one-link="true" className="one-link-ignore relative z-10 min-h-11" onClickCapture={(e) => e.stopPropagation()} />;
}
