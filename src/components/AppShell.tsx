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
    <div className="bg-glow min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 pb-40 pt-8">{children}</div>
      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md">
        <button onClick={() => setOpen(true)} className="mx-3 mb-2 flex w-[calc(100%-1.5rem)] items-center gap-2 rounded-2xl bg-accent px-4 py-2.5 text-left text-xs text-accent-foreground">
          <LifeBuoy className="h-4 w-4 shrink-0" />
          In crisis or feeling unsafe? Tap for free, confidential 24/7 help.
        </button>
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
