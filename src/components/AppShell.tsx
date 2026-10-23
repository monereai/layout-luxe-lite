import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { Globe, Compass, Sun, BookHeart, LifeBuoy, Search, Menu, PanelLeftClose, PanelLeftOpen, Award, Puzzle, Zap, Coins, BookOpen, PawPrint } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { CrisisDialog } from "./CrisisDialog";
import { PassCodeLink } from "./PassCodeDialog";
import { usePlan } from "@/hooks/usePlan";
import { useCare } from "@/hooks/useCare";
import { energyGain } from "@/lib/care";
import { useT, useLang, setLang, LANGS, type Lang } from "@/lib/i18n";
import { visibleAdventureNavigation } from "@/lib/treasureGate";
import { useTreasureAccess } from "@/hooks/useTreasureAccess";
import { Button } from "@/components/ui/button";
import { useGame } from "@/lib/game";
import { usePointsWallet } from "@/hooks/usePointsWallet";
import shopMark from "@/assets/shop/store-front.png";
import petShopMark from "@/assets/shop/pet-shop.png";
import crossAsset from "@/assets/monere-cross.png.asset.json";

import { useWebMCP } from "use-webmcp-tool";
import { runWebMCPTool } from "@/lib/webmcp-telemetry";
import { QaPanel } from "@/components/QaPanel";
import { GuestRewardHost, GuestPointsTransfer } from "@/components/GuestSignupModal";

const allTabs = [
  { to: "/", label: "talk", icon: BookOpen },
  { to: "/treasure", label: "treasure", icon: Compass },
  { to: "/daily", label: "daily", icon: Sun },
  { to: "/journal", label: "journal", icon: BookHeart },
  { to: "/find", label: "game", icon: Search },
  { to: "/jigsaw", label: "jigsaw", icon: Puzzle },
] as const;

const allMenuItems = [
  { to: "/", label: "talk", icon: BookOpen },
  { to: "/treasure", label: "treasure", icon: Compass },
  { to: "/daily", label: "daily", icon: Sun },
  { to: "/journal", label: "journal", icon: BookHeart },
  { to: "/find", label: "game", icon: Search },
  { to: "/jigsaw", label: "jigsaw", icon: Puzzle },
  { to: "/shop", label: "shop", icon: Coins },
] as const;

export function AppShell({ children, hideCrisisBar = false, adventure = false }: { children: ReactNode; hideCrisisBar?: boolean; adventure?: boolean }) {
  const { tester } = useTreasureAccess();
  const tabs = visibleAdventureNavigation(allTabs, undefined, tester);
  const menuItems = visibleAdventureNavigation(allMenuItems, undefined, tester);
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const game = useGame();
  const { user, premium, signOut, tier } = usePlan();
  const wallet = usePointsWallet();
  const care = useCare();
  const energy = care.data?.energy;
  const seenEnergy = useRef<number | null>(null);
  const [gain, setGain] = useState<{ amount: number; id: number } | null>(null);
  useEffect(() => {
    const amount = energyGain(seenEnergy.current, energy);
    seenEnergy.current = energy ?? null;
    if (!amount) return;
    const id = Date.now();
    setGain({ amount, id });
    const timer = setTimeout(() => setGain((g) => (g?.id === id ? null : g)), 1800);
    return () => clearTimeout(timer);
  }, [energy]);
  const t = useT();
  const navigationLabel = (to: string, label: Parameters<typeof t>[0]) => to === "/treasure" ? (tester ? `${t("treasure")} · Dev` : t("treasure")) : to === "/shop" ? `${t(label)} / Wardrobe` : to === "/" ? `Dashboard / ${t(label)}` : t(label);
  const lang = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  useWebMCP({
    name: "read_header_status",
    description: "Read the current page and visible header's spendable Shop Points, membership, and energy.",
    annotations: { readOnlyHint: true },
    execute: () => runWebMCPTool("read_header_status", () => `Page: ${location.pathname}. Shop Points: ${wallet}. ${user ? `Membership: ${tier}. Energy: ${energy == null ? "loading" : `${energy}%`}.` : "Signed out; energy and membership are unavailable."}`),
  });
  useWebMCP({
    name: "navigate_monere",
    description: "Open a page allowed by MonereAI's visible menu, or Monere’s Daily Dilemma.",
    inputSchema: { type: "object", properties: { page: { type: "string", enum: [...menuItems.map(item => item.to), "dilemma"], description: "The menu page path to open, or \"dilemma\" for Monere’s Daily Dilemma story." } }, required: ["page"], additionalProperties: false },
    execute: ({ page }: { page: unknown }) => runWebMCPTool("navigate_monere", async () => {
      if (page === "dilemma") {
        setMenuOpen(false);
        await navigate({ to: "/", search: { dilemma: 1 } });
        return `Opened ${t("dailyDilemma")}.`;
      }
      const item = menuItems.find(item => item.to === page);
      if (typeof page !== "string" || !item) throw new Error("Choose a page from the visible menu.");
      setMenuOpen(false);
      await navigate({ to: item.to });
      return `Opened ${t(item.label)}.`;
    }),
  });
  return (
    <div className={`bg-glow relative isolate min-h-screen ${adventure ? "adventure-shell" : ""}`}>
      <svg className="wisdom-pattern" aria-hidden="true"><defs><pattern id="wisdom-stars" width="120" height="140" patternUnits="userSpaceOnUse"><path d="M20 15v10m-5-5h10M80 90l5 8-5 8-5-8ZM105 30v6m-3-3h6" fill="none" stroke="currentColor" strokeWidth="1" /></pattern></defs><rect width="100%" height="100%" fill="url(#wisdom-stars)" /></svg>
      <div className="relative mx-auto flex min-h-screen max-w-md flex-col px-4 pt-5 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:max-w-2xl sm:px-5 sm:pt-8 md:max-w-7xl md:px-6 md:pt-6 md:pb-6">
        <header className="mb-5 sm:mb-7 md:mb-6 md:border-b md:border-border md:pb-5">
          <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
            <Link to="/" aria-label="MonereAI home" className="inline-flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl sm:h-14 sm:w-14 md:h-16 md:w-16 border border-primary/30 bg-primary/10 text-primary">
              <Compass className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10" strokeWidth={1.5} aria-hidden="true" />
            </span>
            <span className="truncate font-display text-3xl font-semibold min-[380px]:text-4xl sm:text-5xl md:text-6xl text-foreground pop-shadow">Monere<span className="text-primary">AI</span></span>
            <img src={crossAsset.url} alt="" width={432} height={692} decoding="async" className="h-9 w-auto shrink-0 object-contain sm:h-11 md:h-14" />
          </Link>
          <div className="flex flex-row flex-wrap items-center justify-end gap-x-3 gap-y-1 pt-1 text-xs">
            <Button variant="outline" size="icon" onClick={() => setMenuOpen(true)} aria-label="Open menu" className="md:hidden shrink-0"><Menu className="h-5 w-5" aria-hidden="true" /></Button>
            <Button asChild variant="ghost" size="sm" className="h-auto gap-1.5 px-1 py-1 text-primary"><Link to="/pet-shop" aria-label={t("petShop")}><PawPrint className="h-4 w-4 shrink-0" aria-hidden="true" /><span>{t("petShop")}</span></Link></Button>
            <Link to="/shop" aria-label={`Points Shop: ${wallet} points`} className="flex items-center gap-1.5 rounded-full border border-points/45 bg-points/10 px-2 py-0.5 font-semibold text-points pop-shadow"><Coins className="h-3.5 w-3.5" aria-hidden="true" /><span className="font-heading text-sm tabular-nums">{wallet}</span> pts</Link>
            {user && energy != null && <span key={gain ? `gain-${gain.id}` : "energy"} aria-label={`Monere energy: ${energy} percent`} title="Monere's energy" className={`relative flex items-center gap-1.5 rounded-full border border-energy/45 bg-energy/10 px-3 py-1 text-base font-semibold text-energy pop-shadow ${gain ? "energy-pop" : ""}`}><Zap className="h-5 w-5" aria-hidden="true" /><span className="font-heading text-lg tabular-nums">{energy}</span>%{gain && <span className="energy-gain" aria-hidden="true">+{gain.amount}</span>}</span>}
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
          <p className="mt-3 text-lg font-medium leading-relaxed text-muted-foreground sm:text-xl md:text-2xl">{t("tagline")}</p>
        </header>
        <div className={adventure ? "adventure-content" : `flex flex-1 flex-col md:grid md:items-start md:gap-5 ${collapsed ? "md:grid-cols-[3.5rem_minmax(0,1fr)] xl:grid-cols-[3.5rem_minmax(0,1fr)_15rem]" : "md:grid-cols-[11rem_minmax(0,1fr)] xl:grid-cols-[12rem_minmax(0,1fr)_15rem]"}`}>
          <aside className="sticky top-6 hidden min-w-0 md:flex md:flex-col">
            <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? "Expand navigation" : "Collapse navigation"} title={collapsed ? "Expand navigation" : "Collapse navigation"} className="mb-5 text-muted-foreground">
              {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
            </Button>
            <nav aria-label="Main navigation" className="flex flex-col gap-2">
              {menuItems.map(({ to, label, icon: Icon }) => (
                <Button key={to} asChild variant="ghost" className={`font-nav h-auto min-h-11 whitespace-normal text-base font-semibold text-muted-foreground ${collapsed ? "justify-center px-2" : "justify-start px-3"}`}>
                  <Link to={to} title={navigationLabel(to, label)} aria-label={navigationLabel(to, label)} activeProps={{ className: "bg-primary/10 text-primary" }} activeOptions={{ exact: true }}>
                    <Icon className="shrink-0" />{!collapsed && <span className="min-w-0">{navigationLabel(to, label)}</span>}
                  </Link>
                </Button>
              ))}
              <Button asChild variant="ghost" className={`font-nav h-auto min-h-11 whitespace-normal text-base font-semibold text-muted-foreground ${collapsed ? "justify-center px-2" : "justify-start px-3"}`}>
                <Link to="/" search={{ dilemma: 1 }} title={t("dailyDilemma")} aria-label={t("dailyDilemma")}>
                  <BookOpen className="shrink-0" />{!collapsed && <span className="min-w-0">{t("dailyDilemma")}</span>}
                </Link>
              </Button>
            </nav>
            {!hideCrisisBar && (
              <Button variant="ghost" onClick={() => setOpen(true)} title={t("crisisBar")} aria-label={t("crisisBar")} className={`mt-8 h-auto min-h-11 whitespace-normal text-left text-sm font-semibold text-muted-foreground ${collapsed ? "px-2" : "justify-start px-3 py-3"}`}>
                <LifeBuoy className="shrink-0" />{!collapsed && <span>{t("crisisBar")}</span>}
              </Button>
            )}
          </aside>
          <main className="relative z-0 flex min-w-0 flex-1 flex-col md:workspace-panel md:min-h-[calc(100dvh-14rem)] md:p-6 lg:p-8">{children}</main>
          {!adventure && <QaPanel />}
          {user ? <GuestPointsTransfer userId={user.id} /> : <GuestRewardHost />}
          <aside aria-label="Points Shop" className="sticky top-6 hidden min-w-0 xl:block">
            <div className="flex items-center gap-2 border-b border-border pb-4 text-primary">
              <Compass className="h-5 w-5 shrink-0" />
              <h2 className="font-nav text-lg">MonereAI</h2>
              {premium && <span className="ml-auto text-xs font-bold">PLUS</span>}
            </div>
            <div className="border-b border-border py-5">
              <Link to="/shop" className="flex items-center justify-between gap-3" aria-label={`Points Shop: ${wallet} Shop Points`}>
                <span className="flex items-center gap-2 text-sm text-muted-foreground"><Award className="h-4 w-4 text-primary" />Shop Points</span>
                <span className="font-heading text-2xl font-semibold tabular-nums text-points pop-shadow">{wallet}</span>
              </Link>
              {game.detective && <p className="mt-3 text-xs text-primary">Master Detective</p>}
              <Link to="/shop" title={t("shop")} aria-label={`${t("shop")}: ${wallet} Shop Points`} className="mt-4 flex flex-col items-center gap-1.5 rounded-2xl border border-primary/25 bg-primary/5 p-3 transition-colors hover:border-primary/50 hover:bg-primary/10">
                <img src={shopMark} alt="" width={816} height={816} loading="lazy" className="h-[11.25rem] w-[11.25rem] max-w-full" />
                <span className="text-sm font-semibold text-primary">{t("shop")}</span>
              </Link>
            </div>
            {(
              <div className="border-b border-border py-5">
                <Link to="/pet-shop" title={t("petShop")} aria-label={`${t("petShop")}: ${t("petShopSub")}`} className="flex flex-col items-center gap-1.5 rounded-2xl border border-primary/25 bg-primary/5 p-3 transition-colors hover:border-primary/50 hover:bg-primary/10">
                  <img src={petShopMark} alt="" width={816} height={816} loading="lazy" className="h-[11.25rem] w-[11.25rem] max-w-full" />
                  <span className="text-sm font-semibold text-primary">{t("petShop")}</span>
                  <span className="text-center text-[11px] leading-snug text-muted-foreground">{t("petShopSub")}</span>
                </Link>
              </div>
            )}
          </aside>
          {(
            <Link
              to="/pet-shop"
              title={t("petShop")}
              aria-label={`${t("petShop")}: ${t("petShopSub")}`}
              className="mt-6 flex items-center gap-3 rounded-2xl border border-primary/25 bg-primary/5 p-3 transition-colors hover:border-primary/50 hover:bg-primary/10 md:hidden"
            >
              <img src={petShopMark} alt="" width={816} height={816} loading="lazy" className="h-24 w-24 shrink-0 max-w-full" />
              <span className="min-w-0">
                <span className="block text-base font-semibold text-primary">{t("petShop")}</span>
                <span className="mt-1 block text-xs leading-snug text-muted-foreground">{t("petShopSub")}</span>
              </span>
            </Link>
          )}
        </div>
        <footer className="pt-6 text-center">
          <a href="https://MonereAI.com" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary">Powered by <span className="font-semibold">MonereAI.com</span></a>
        </footer>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md sm:max-w-2xl md:hidden">
        <nav aria-label="Main navigation" className="flex justify-around border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
          {tabs.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className="font-nav flex min-h-12 min-w-0 flex-1 flex-col items-center gap-0.5 px-0.5 py-2 text-xs font-semibold leading-tight text-muted-foreground" activeProps={{ className: "text-primary" }} activeOptions={{ exact: true }}>
              <Icon className="h-5 w-5 shrink-0" />
              <span className="min-h-[2.5em] text-center leading-tight">{t(label)}</span>
            </Link>
          ))}
        </nav>
      </div>
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-72 overflow-y-auto bg-card sm:max-w-72">
          <SheetHeader className="border-b border-border px-4 py-4">
            <SheetTitle className="font-nav text-lg text-foreground">Monere<span className="text-primary">AI</span></SheetTitle>
          </SheetHeader>
          <nav aria-label="Main navigation" className="flex flex-col gap-1 p-3">
            {menuItems.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} onClick={() => setMenuOpen(false)} title={navigationLabel(to, label)} aria-label={navigationLabel(to, label)} className="font-nav flex min-h-11 items-center gap-3 rounded-xl px-3 text-base font-semibold text-muted-foreground hover:bg-primary/10 hover:text-primary" activeProps={{ className: "bg-primary/10 text-primary" }} activeOptions={{ exact: true }}>
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span className="min-w-0">{navigationLabel(to, label)}</span>
              </Link>
            ))}
            <Link to="/" search={{ dilemma: 1 }} onClick={() => setMenuOpen(false)} title={t("dailyDilemma")} aria-label={t("dailyDilemma")} className="font-nav flex min-h-11 items-center gap-3 rounded-xl px-3 text-base font-semibold text-muted-foreground hover:bg-primary/10 hover:text-primary">
              <BookOpen className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span className="min-w-0">{t("dailyDilemma")}</span>
            </Link>
            <div className="my-2 border-t border-border" />
            <Button variant="ghost" className="h-auto min-h-11 justify-start whitespace-normal px-3 text-left text-sm font-semibold text-muted-foreground" onClick={() => { setMenuOpen(false); setOpen(true); }}>
              <LifeBuoy className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="min-w-0">{t("crisisBar")}</span>
            </Button>

            {user ? (
              <Button variant="ghost" className="min-h-11 justify-start px-3 text-base font-semibold text-muted-foreground" onClick={() => { setMenuOpen(false); void signOut(); }}>{t("signOut")}</Button>
            ) : (
              <Link to="/auth" onClick={() => setMenuOpen(false)} className="font-nav flex min-h-11 items-center gap-3 rounded-xl px-3 text-base font-semibold text-muted-foreground hover:bg-primary/10 hover:text-primary">{t("signIn")}</Link>
            )}
          </nav>
        </SheetContent>
      </Sheet>
      <CrisisDialog open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
