import { BookOpen, Footprints, ShieldCheck, Compass, Music, Youtube } from "lucide-react";
import type { ReactNode } from "react";
import type { Wisdom } from "@/lib/wisdom.functions";

function Card({ icon, title, children, delay }: { icon: ReactNode; title: string; children: ReactNode; delay: number }) {
  return (
    <section className="surface-card p-5 animate-in fade-in slide-in-from-bottom-3 fill-mode-both" style={{ animationDelay: `${delay}ms` }}>
      <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">{icon}{title}</div>
      {children}
    </section>
  );
}

export function WisdomCards({ w }: { w: Wisdom }) {
  return (
    <div className="space-y-4">
      <Card icon={<Compass className="h-4 w-4" />} title="Monere's Perspective" delay={0}>
        <p className="leading-relaxed">{w.bigPicture}</p>
      </Card>
      <Card icon={<BookOpen className="h-4 w-4" />} title="Wisdom Anchor" delay={120}>
        <div className="space-y-4">
          {w.verses.map((v) => (
            <div key={v.reference}>
              <blockquote className="font-display text-lg italic leading-snug">"{v.text}"</blockquote>
              <p className="mt-1 text-sm font-semibold text-primary">— {v.reference}</p>
              <p className="mt-2 text-sm text-muted-foreground">{v.application}</p>
            </div>
          ))}
        </div>
      </Card>
      <Card icon={<Footprints className="h-4 w-4" />} title="Steps of Courage" delay={240}>
        <ol className="space-y-3">
          {w.path.map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">{i + 1}</span>
              <span className="text-sm leading-relaxed">{s}</span>
            </li>
          ))}
        </ol>
      </Card>
      <Card icon={<ShieldCheck className="h-4 w-4" />} title="The Honor Outlook" delay={360}>
        <div className="grid gap-3">
          <div className="border-l-2 border-border pl-3"><p className="text-xs font-bold text-muted-foreground">YOUR NEXT STEP</p><p className="mt-1 text-sm">{w.shortTerm}</p></div>
          <div className="border-l-2 border-primary pl-3"><p className="text-xs font-bold text-primary">THE PERSON YOU'RE BECOMING</p><p className="mt-1 text-sm">{w.longTerm}</p></div>
        </div>
      </Card>
      {w.song && <SongCard song={w.song} />}
    </div>
  );
}

function SongCard({ song }: { song: NonNullable<Wisdom["song"]> }) {
  const q = encodeURIComponent(`${song.title} ${song.artist}`).replace(/%20/g, "+");
  const links = [
    { label: "Spotify", href: `https://open.spotify.com/search/${q}`, icon: <Music className="h-4 w-4" /> },
    { label: "Apple Music", href: `https://music.apple.com/us/search?term=${q}`, icon: <Music className="h-4 w-4" /> },
    { label: "YouTube", href: `https://www.youtube.com/results?search_query=${q}`, icon: <Youtube className="h-4 w-4" /> },
  ];
  return (
    <Card icon={<Music className="h-4 w-4" />} title="Monere's Soundtrack 🎵" delay={480}>
      <p className="font-display text-lg font-bold leading-snug">{song.title}</p>
      <p className="text-sm font-bold text-primary">{song.artist}</p>
      <p className="mt-3 text-sm italic text-muted-foreground">"Why I picked this for you: {song.why}"</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {links.map((l) => (
          <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" aria-label={`Listen on ${l.label}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground transition hover:border-primary hover:text-primary">
            {l.icon}{l.label}
          </a>
        ))}
      </div>
    </Card>
  );
}
