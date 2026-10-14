import { Link } from "@tanstack/react-router";
import { Globe, Compass, Sun, BookHeart, LifeBuoy } from "lucide-react";
import { useState, type ReactNode } from "react";
import { CrisisDialog } from "./CrisisDialog";
import { PaymentTestModeBanner } from "./PaymentTestModeBanner";
import { usePlan } from "@/hooks/usePlan";
import { createPortalSession } from "@/utils/payments.functions";
import { getStripeEnvironment } from "@/lib/stripe";
import { useT, useLang, setLang, LANGS, type Lang } from "@/lib/i18n";
import { toast } from "sonner";

const tabs = [
  { to: "/", label: "seek", icon: Compass },
  { to: "/daily", label: "daily", icon: Sun },
  { to: "/journal", label: "journal", icon: BookHeart },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { user, premium, signOut } = usePlan();
  const t = useT();
  const lang = useLang();
  async function manage() {
    const r = await createPortalSession({ data: { returnUrl: window.location.href, environment: getStripeEnvironment() } }).catch(() => ({ error: "Couldn't open billing." }));
    if ("error" in r) { toast(r.error === "No subscription found" ? "Your Plus comes from a pass code — nothing to manage here." : r.error); return; }
    window.open(r.url, "_blank");
  }
  return (
    <div className="bg-glow relative isolate min-h-screen">
      <PaymentTestModeBanner />
      <svg className="wisdom-pattern" aria-hidden="true"><defs><pattern id="wisdom-stars" width="120" height="140" patternUnits="userSpaceOnUse"><path d="M20 15v10m-5-5h10M80 90l5 8-5 8-5-8ZM105 30v6m-3-3h6" fill="none" stroke="currentColor" strokeWidth="1" /></pattern></defs><rect width="100%" height="100%" fill="url(#wisdom-stars)" /></svg>
      <div className="relative mx-auto flex min-h-screen max-w-md flex-col px-5 pb-40 pt-8">
        <header className="mb-7">
          <div className="flex items-start justify-between gap-3">
          <Link to="/" aria-label="MonereAI home" className="inline-flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
              <Compass className="h-7 w-7" strokeWidth={1.5} aria-hidden="true" />
            </span>
            <span className="font-display text-3xl font-semibold text-foreground">Monere<span className="text-primary">AI</span></span>
          </Link>
          <div className="flex flex-col items-end gap-1 pt-1 text-xs">
            <label className="flex items-center gap-1 text-muted-foreground"><Globe className="h-3.5 w-3.5" aria-hidden="true" /><select aria-label={t("language")} value={lang} onChange={(e) => setLang(e.target.value as Lang)} className="rounded-md border border-border bg-card px-1 py-0.5 text-xs text-foreground">{LANGS.map((l) => <option key={l.id} value={l.id}>{l.flag} {l.label}</option>)}</select></label>
            {premium && <span className="rounded-full bg-primary px-2.5 py-0.5 font-bold text-primary-foreground">PLUS</span>}
            {premium && <button onClick={() => void manage()} className="text-muted-foreground hover:text-primary">{t("managePlan")}</button>}
            {user ? (
              <button onClick={() => void signOut()} className="text-muted-foreground hover:text-primary">{t("signOut")}</button>
            ) : (
              <Link to="/auth" className="text-muted-foreground hover:text-primary">{t("signIn")}</Link>
            )}
          </div>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t("tagline")}</p>
        </header>
        <main className="flex flex-1 flex-col">{children}</main>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md">
        <button onClick={() => setOpen(true)} className="mx-3 mb-2 flex w-[calc(100%-1.5rem)] items-center gap-2 rounded-2xl bg-accent px-4 py-2.5 text-left text-xs text-accent-foreground">
          <LifeBuoy className="h-4 w-4 shrink-0" />
          {t("crisisBar")}
        </button>
        <footer className="bg-card/95 py-2 text-center backdrop-blur">
          <a href="https://MonereAI.com" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground transition-colors hover:text-primary">Powered by <span className="font-semibold">MonereAI.com</span></a>
        </footer>
        <nav className="flex justify-around border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
          {tabs.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className="flex flex-1 flex-col items-center gap-1 py-3 text-xs text-muted-foreground" activeProps={{ className: "text-primary" }} activeOptions={{ exact: true }}>
              <Icon className="h-5 w-5" />
              {t(label)}
            </Link>
          ))}
        </nav>
      </div>
      <CrisisDialog open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
