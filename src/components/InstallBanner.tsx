import { useEffect, useState } from "react";
import { X, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

const KEY = "monereai-install-dismissed";
type PromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export function InstallBanner() {
  const [show, setShow] = useState(false);
  const [ios, setIos] = useState(false);
  const [tip, setTip] = useState(false);
  const [evt, setEvt] = useState<PromptEvent | null>(null);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone;
    const mobile = /android|iphone|ipad|ipod/i.test(navigator.userAgent);
    if (standalone || !mobile || localStorage.getItem(KEY)) return;
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIos(isIos);
    if (isIos) setShow(true);
    const onPrompt = (e: Event) => { e.preventDefault(); setEvt(e as PromptEvent); setShow(true); };
    const onInstalled = () => { localStorage.setItem(KEY, "1"); setShow(false); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => { window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled); };
  }, []);

  if (!show) return null;
  const dismiss = () => { localStorage.setItem(KEY, "1"); setShow(false); };
  const install = async () => {
    if (ios || !evt) { setTip(true); return; }
    await evt.prompt();
    const { outcome } = await evt.userChoice;
    if (outcome === "accepted") dismiss();
  };

  return (
    <div className="fixed inset-x-0 bottom-44 z-40 mx-auto max-w-md px-3" role="region" aria-label="Install MonereAI">
      <div className="surface-card flex items-center gap-3 border-primary/40 p-3 shadow-lg">
        <Smartphone className="h-5 w-5 shrink-0 text-primary" />
        <div className="min-w-0 flex-1 text-sm">
          <p>Get Monere on your Home Screen for quick daily advice 📱</p>
          {tip && <p className="mt-1 text-xs font-semibold text-primary">1. Tap Share ⎕ → 2. Add to Home Screen +</p>}
        </div>
        <Button size="sm" onClick={() => void install()} className="btn-gold shrink-0 rounded-full">Install App</Button>
        <button onClick={dismiss} aria-label="Dismiss" className="text-muted-foreground"><X className="h-4 w-4" /></button>
      </div>
    </div>
  );
}
