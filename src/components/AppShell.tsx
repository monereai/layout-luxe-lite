import { Link } from "@tanstack/react-router";
import { Compass, Sun, BookHeart, LifeBuoy } from "lucide-react";
import { useState, type ReactNode } from "react";
import { CrisisDialog } from "./CrisisDialog";

const tabs = [
  { to: "/", label: "Seek", icon: Compass },
  { to: "/daily", label: "Daily", icon: Sun },
  { to: "/journal", label: "Journal", icon: BookHeart },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-glow relative isolate min-h-screen">
      <svg className="wisdom-pattern" aria-hidden="true"><defs><pattern id="wisdom-stars" width="120" height="140" patternUnits="userSpaceOnUse"><path d="M20 15v10m-5-5h10M80 90l5 8-5 8-5-8ZM105 30v6m-3-3h6" fill="none" stroke="currentColor" strokeWidth="1" /></pattern></defs><rect width="100%" height="100%" fill="url(#wisdom-stars)" /></svg>
      <div className="relative mx-auto flex min-h-screen max-w-md flex-col px-5 pb-40 pt-8">
        <header className="mb-7">
          <Link to="/" aria-label="MonereAI home" className="inline-flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
              <Compass className="h-7 w-7" strokeWidth={1.5} aria-hidden="true" />
            </span>
            <span className="font-display text-3xl font-semibold text-foreground">Monere<span className="text-primary">AI</span></span>
          </Link>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Guided Wisdom &amp; Decision Integrity for Teens</p>
        </header>
        <main className="flex flex-1 flex-col">{children}</main>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md">
        <button onClick={() => setOpen(true)} className="mx-3 mb-2 flex w-[calc(100%-1.5rem)] items-center gap-2 rounded-2xl bg-accent px-4 py-2.5 text-left text-xs text-accent-foreground">
          <LifeBuoy className="h-4 w-4 shrink-0" />
          In crisis or feeling unsafe? Tap for free, confidential 24/7 help.
        </button>
        <footer className="bg-card/95 py-2 text-center backdrop-blur">
          <a href="https://MonereAI.com" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground transition-colors hover:text-primary">Powered by <span className="font-semibold">MonereAI.com</span></a>
        </footer>
        <nav className="flex justify-around border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
          {tabs.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className="flex flex-1 flex-col items-center gap-1 py-3 text-xs text-muted-foreground" activeProps={{ className: "text-primary" }} activeOptions={{ exact: true }}>
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          ))}
        </nav>
      </div>
      <CrisisDialog open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
