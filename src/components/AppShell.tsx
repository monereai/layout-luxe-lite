import { Link } from "@tanstack/react-router";
import { Globe, Compass, Sun, BookHeart, LifeBuoy, Search } from "lucide-react";
import { useState, type ReactNode } from "react";
import { CrisisDialog } from "./CrisisDialog";
import { PassCodeLink } from "./PassCodeDialog";
import { usePlan } from "@/hooks/usePlan";
import { useT, useLang, setLang, LANGS, type Lang } from "@/lib/i18n";

const tabs = [
  { to: "/", label: "seek", icon: Compass },
  { to: "/daily", label: "daily", icon: Sun },
  { to: "/journal", label: "journal", icon: BookHeart },
  { to: "/find", label: "game", icon: Search },
] as const;

export function AppShell({ children, hideCrisisBar = false }: { children: ReactNode; hideCrisisBar?: boolean }) {
  const [open, setOpen] = useState(false);
  const { user, premium, signOut } = usePlan();
  const t = useT();
  const lang = useLang();
  return (
    <div className="bg-glow relative isolate min-h-screen">
      <svg className="wisdom-pattern" aria-hidden="true"><defs><pattern id="wisdom-stars" width="120" height="140" patternUnits="userSpaceOnUse"><path d="M20 15v10m-5-5h10M80 90l5 8-5 8-5-8ZM105 30v6m-3-3h6" fill="none" stroke="currentColor" strokeWidth="1" /></pattern></defs><rect width="100%" height="100%" fill="url(#wisdom-stars)" /></svg>
      <div className={`relative mx-auto flex min-h-screen max-w-md flex-col px-5 pt-8 ${hideCrisisBar ? "pb-[calc(9rem+env(safe-area-inset-bottom))]" : "pb-[calc(13rem+env(safe-area-inset-bottom))]"}`}>
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
            {!premium && <PassCodeLink label="Access code" className="font-semibold !text-primary" />}
            {user ? (
              <button onClick={() => void signOut()} className="text-muted-foreground hover:text-primary">{t("signOut")}</button>
            ) : (
              <Link to="/auth" className="text-muted-foreground hover:text-primary">{t("signIn")}</Link>
            )}
          </div>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t("tagline")}</p>
        </header>
        <main className="relative z-0 flex flex-1 flex-col">{children}</main>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md">
        {!hideCrisisBar && (
          <button onClick={() => setOpen(true)} className="mx-3 mb-2 flex w-[calc(100%-1.5rem)] items-center gap-2 rounded-2xl bg-accent px-4 py-2.5 text-left text-xs text-accent-foreground">
            <LifeBuoy className="h-4 w-4 shrink-0" />
            {t("crisisBar")}
          </button>
        )}
        <footer className="bg-card/95 py-2 text-center backdrop-blur">
          <a href="https://MonereAI.com" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground transition-colors hover:text-primary">Powered by <span className="font-semibold">MonereAI.com</span></a>
        </footer>
        <nav className="flex justify-around border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
          {tabs.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className="flex flex-1 flex-col items-center gap-1 py-3 text-xs text-muted-foreground" activeProps={{ className: "text-primary" }} activeOptions={{ exact: true }}>
              <Icon className="h-5 w-5" />
              <span className="min-h-[2.5em] leading-tight text-center">{t(label)}</span>
            </Link>
          ))}
        </nav>
      </div>
      <CrisisDialog open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
