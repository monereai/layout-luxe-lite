import { Link } from "@tanstack/react-router";
import { Globe, Compass, Sun, BookHeart, LifeBuoy, Search, PanelLeftClose, PanelLeftOpen, ArrowUpRight, Award, Puzzle, Zap } from "lucide-react";
import { useState, type ReactNode } from "react";
import { CrisisDialog } from "./CrisisDialog";
import { PassCodeLink } from "./PassCodeDialog";
import { usePlan } from "@/hooks/usePlan";
import { useT, useLang, setLang, LANGS, signSrc, type Lang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { useGame } from "@/lib/game";
import { usePointsWallet } from "@/hooks/usePointsWallet";
import { MonereAvatar } from "./MonereFigure";

const tabs = [
  { to: "/", label: "seek", icon: Compass },
  { to: "/daily", label: "daily", icon: Sun },
  { to: "/journal", label: "journal", icon: BookHeart },
  { to: "/find", label: "game", icon: Search },
  { to: "/jigsaw", label: "jigsaw", icon: Puzzle },
] as const;

export function AppShell({ children, hideCrisisBar = false }: { children: ReactNode; hideCrisisBar?: boolean }) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const game = useGame();
  const { user, premium, signOut, tier, tokens } = usePlan();
  const wallet = usePointsWallet();
  const t = useT();
  const lang = useLang();
  return (
    <div className="bg-glow relative isolate min-h-screen">
      <svg className="wisdom-pattern" aria-hidden="true"><defs><pattern id="wisdom-stars" width="120" height="140" patternUnits="userSpaceOnUse"><path d="M20 15v10m-5-5h10M80 90l5 8-5 8-5-8ZM105 30v6m-3-3h6" fill="none" stroke="currentColor" strokeWidth="1" /></pattern></defs><rect width="100%" height="100%" fill="url(#wisdom-stars)" /></svg>
      <div className={`relative mx-auto flex min-h-screen max-w-md flex-col px-5 pt-8 md:max-w-7xl md:px-6 md:pt-6 ${hideCrisisBar ? "pb-[calc(9rem+env(safe-area-inset-bottom))]" : "pb-[calc(13rem+env(safe-area-inset-bottom))]"} md:pb-6`}>
        <header className="mb-7 md:mb-6 md:border-b md:border-border md:pb-5">
          <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <Link to="/" aria-label="MonereAI home" className="inline-flex min-w-0 items-center gap-3">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl md:h-16 md:w-16 border border-primary/30 bg-primary/10 text-primary">
              <Compass className="h-8 w-8 md:h-10 md:w-10" strokeWidth={1.5} aria-hidden="true" />
            </span>
            <span className="truncate font-display text-4xl font-semibold min-[380px]:text-5xl sm:text-5xl md:text-6xl text-foreground">Monere<span className="text-primary">AI</span></span>
          </Link>
          <div className="flex flex-row flex-wrap items-center justify-end gap-x-2 gap-y-1 pt-1 text-xs sm:flex-col sm:items-end sm:gap-1">
            <Link to="/shop" aria-label={`Points Shop: ${wallet} points`} className="flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 py-0.5 pl-0.5 pr-2 font-semibold text-primary"><MonereAvatar className="h-6 w-6" /><span className="tabular-nums">{wallet}</span> pts</Link>
            {user && <span aria-label={`${tokens} Tokens`} className="flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 font-semibold text-amber-300"><Zap className="h-3.5 w-3.5" aria-hidden="true" /><span className="tabular-nums">{tokens}</span> tokens</span>}
            <label className="flex items-center gap-1 text-muted-foreground"><Globe className="h-3.5 w-3.5" aria-hidden="true" /><select aria-label={t("language")} value={lang} onChange={(e) => setLang(e.target.value as Lang)} className="rounded-md border border-border bg-card px-1 py-0.5 text-xs text-foreground">{LANGS.map((l) => <option key={l.id} value={l.id}>{l.flag} {l.label}</option>)}</select></label>
            {premium && <span className="rounded-full bg-primary px-2.5 py-0.5 font-bold text-primary-foreground">{tier === "club" ? "CLUB" : "PLUS"}</span>}
            {!premium && <PassCodeLink label="Access code" className="font-semibold !text-primary" />}
            {user ? (
              <Button variant="link" size="sm" onClick={() => void signOut()} className="h-auto p-0 text-xs text-muted-foreground hover:text-primary">{t("signOut")}</Button>
            ) : (
              <Link to="/auth" className="text-muted-foreground hover:text-primary">{t("signIn")}</Link>
            )}
          </div>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t("tagline")}</p>
        </header>
        <div className={`flex flex-1 flex-col md:grid md:items-start md:gap-5 ${collapsed ? "md:grid-cols-[3.5rem_minmax(0,1fr)] xl:grid-cols-[3.5rem_minmax(0,1fr)_15rem]" : "md:grid-cols-[11rem_minmax(0,1fr)] xl:grid-cols-[12rem_minmax(0,1fr)_15rem]"}`}>
          <aside className="sticky top-6 hidden min-w-0 md:flex md:flex-col">
            <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? "Expand navigation" : "Collapse navigation"} title={collapsed ? "Expand navigation" : "Collapse navigation"} className="mb-5 text-muted-foreground">
              {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
            </Button>
            <nav aria-label="Main navigation" className="flex flex-col gap-2">
              {tabs.map(({ to, label, icon: Icon }) => (
                <Button key={to} asChild variant="ghost" className={`h-auto min-h-11 whitespace-normal text-base font-semibold text-muted-foreground ${collapsed ? "justify-center px-2" : "justify-start px-3"}`}>
                  <Link to={to} title={t(label)} aria-label={t(label)} activeProps={{ className: "bg-primary/10 text-primary" }} activeOptions={{ exact: true }}>
                    <Icon className="shrink-0" />{!collapsed && <span className="min-w-0">{t(label)}</span>}
                  </Link>
                </Button>
              ))}
            </nav>
            {!hideCrisisBar && (
              <Button variant="ghost" onClick={() => setOpen(true)} title={t("crisisBar")} aria-label={t("crisisBar")} className={`mt-8 h-auto min-h-11 whitespace-normal text-left text-sm font-semibold text-muted-foreground ${collapsed ? "px-2" : "justify-start px-3 py-3"}`}>
                <LifeBuoy className="shrink-0" />{!collapsed && <span>{t("crisisBar")}</span>}
              </Button>
            )}
          </aside>
          <main className="relative z-0 flex min-w-0 flex-1 flex-col md:workspace-panel md:min-h-[calc(100dvh-14rem)] md:p-6 lg:p-8">{children}</main>
          <aside aria-label="Quick actions" className="sticky top-6 hidden min-w-0 xl:block">
            <div className="flex items-center gap-2 border-b border-border pb-4 text-primary">
              <Compass className="h-5 w-5 shrink-0" />
              <h2 className="font-display text-lg font-semibold">MonereAI</h2>
              {premium && <span className="ml-auto text-xs font-bold">PLUS</span>}
            </div>
            <div className="space-y-1 py-4">
              {tabs.filter(({ to }) => to !== "/").map(({ to, label, icon: Icon }) => (
                <Button key={to} asChild variant="ghost" className="h-auto w-full justify-start whitespace-normal px-0 py-3 text-base font-semibold text-muted-foreground">
                  <Link to={to}><Icon /><span className="min-w-0 flex-1 text-left">{t(label)}</span><ArrowUpRight /></Link>
                </Button>
              ))}
            </div>
            <div className="border-y border-border py-5">
              <Link to="/find" className="flex items-center justify-between gap-3" aria-label={`${t("game")}: ${wallet} Shop Points`}>
                <span className="flex items-center gap-2 text-sm text-muted-foreground"><Award className="h-4 w-4 text-primary" />Shop Points</span>
                <span className="font-display text-2xl font-semibold tabular-nums text-primary">{wallet}</span>
              </Link>
              {game.detective && <p className="mt-3 text-xs text-primary">Master Detective</p>}
              <Link to="/shop" aria-label="Points Shop" className="mt-3 block w-fit transition-opacity hover:opacity-80"><img src={signSrc(lang)} alt="Points Shop" width={1205} height={389} loading="lazy" className="h-auto w-full max-w-[11rem]" /></Link>
            </div>
            {!premium && <div className="py-5"><PassCodeLink label="Access code" className="font-semibold !text-primary" /></div>}
          </aside>
        </div>
        <footer className="hidden pt-6 text-center md:block">
          <a href="https://MonereAI.com" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary">Powered by <span className="font-semibold">MonereAI.com</span></a>
        </footer>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md md:hidden">
        {!hideCrisisBar && (
          <Button onClick={() => setOpen(true)} className="mx-3 mb-2 h-auto w-[calc(100%-1.5rem)] justify-start whitespace-normal rounded-2xl bg-accent px-4 py-2.5 text-left text-xs text-accent-foreground">
            <LifeBuoy className="h-4 w-4 shrink-0" />
            {t("crisisBar")}
          </Button>
        )}
        <footer className="bg-card/95 py-2 text-center backdrop-blur">
          <a href="https://MonereAI.com" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground transition-colors hover:text-primary">Powered by <span className="font-semibold">MonereAI.com</span></a>
        </footer>
        <nav className="flex justify-around border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
          {tabs.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className="flex flex-1 flex-col items-center gap-1 px-0.5 py-3 text-sm font-semibold leading-tight text-muted-foreground" activeProps={{ className: "text-primary" }} activeOptions={{ exact: true }}>
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
