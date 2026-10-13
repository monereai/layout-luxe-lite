import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { WisdomCards } from "@/components/WisdomCards";
import { deleteEntry, getEntries, type Entry } from "@/lib/journal";

export const Route = createFileRoute("/journal")({
  head: () => ({
    meta: [
      { title: "Reflection Journal — MoralSphere" },
      { name: "description", content: "Your saved moments of wisdom, kept privately on your device." },
      { property: "og:title", content: "Reflection Journal — MoralSphere" },
      { property: "og:description", content: "Your saved moments of wisdom, kept privately on your device." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Journal,
});

function Journal() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => setEntries(getEntries()), []);
  return (
    <AppShell>
      <h1 className="font-display text-4xl">Reflection Journal</h1>
      <p className="mt-2 text-sm text-muted-foreground">Saved privately on this device only.</p>
      {entries.length === 0 ? (
        <div className="surface-card mt-8 p-8 text-center">
          <p className="text-muted-foreground">Nothing saved yet.</p>
          <Link to="/" className="btn-gold mt-4 inline-block px-5 py-2.5 text-sm">Seek wisdom</Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {entries.map((e) => (
            <div key={e.id} className="surface-card p-4">
              <button className="w-full text-left" onClick={() => setOpen(open === e.id ? null : e.id)}>
                <p className="text-xs font-bold uppercase tracking-widest text-primary">{e.category} · {new Date(e.date).toLocaleDateString()}</p>
                <p className="mt-1 line-clamp-2 text-sm">{e.situation}</p>
              </button>
              {open === e.id && (
                <div className="mt-4">
                  <WisdomCards w={e.wisdom} />
                  <button onClick={() => { deleteEntry(e.id); setEntries(getEntries()); }} className="mt-3 flex items-center gap-1 text-xs text-destructive"><Trash2 className="h-3 w-3" /> Delete</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
