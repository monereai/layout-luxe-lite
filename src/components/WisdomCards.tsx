import { BookOpen, Footprints, ShieldCheck, Compass, Music, Youtube, Play, Pause } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { usePlan } from "@/hooks/usePlan";
import { findSongPreview, type SongPreview } from "@/lib/song.functions";
import type { ReactNode } from "react";
import { MonereFigure } from "@/components/MonereFigure";
import { useT } from "@/lib/i18n";
import type { Wisdom } from "@/lib/wisdom.functions";

function CheerBadge({ text }: { text: string }) {
  return (
    <div className="mt-4 flex items-center gap-3 rounded-2xl bg-primary/10 p-2 pr-4">
      <MonereFigure gesture="thumbs" alt="Monere giving you a thumbs-up" className="gesture-pop h-14 w-14 shrink-0" />
      <p className="text-sm font-medium text-primary">{text}</p>
    </div>
  );
}

function Card({ icon, title, children, delay }: { icon: ReactNode; title: string; children: ReactNode; delay: number }) {
  return (
    <section className="surface-card p-5 animate-in fade-in slide-in-from-bottom-3 fill-mode-both" style={{ animationDelay: `${delay}ms` }}>
      <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">{icon}{title}</div>
      {children}
    </section>
  );
}

export function WisdomCards({ w }: { w: Wisdom }) {
  const t = useT();
  return (
    <div className="space-y-4">
      <Card icon={<Compass className="h-4 w-4" />} title={t("perspective")} delay={0}>
        <p className="leading-relaxed">{w.bigPicture}</p>
      </Card>
      <Card icon={<BookOpen className="h-4 w-4" />} title={t("wisdom")} delay={120}>
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
      <Card icon={<Footprints className="h-4 w-4" />} title={t("steps")} delay={240}>
        <ol className="space-y-3">
          {w.path.map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">{i + 1}</span>
              <span className="text-sm leading-relaxed">{s}</span>
            </li>
          ))}
        </ol>
        <CheerBadge text={t("cheer1")} />
      </Card>
      <Card icon={<ShieldCheck className="h-4 w-4" />} title={t("honor")} delay={360}>
        <div className="grid gap-3">
          <div className="border-l-2 border-border pl-3"><p className="text-xs font-bold text-muted-foreground">{t("nextStep")}</p><p className="mt-1 text-sm">{w.shortTerm}</p></div>
          <div className="border-l-2 border-primary pl-3"><p className="text-xs font-bold text-primary">{t("becoming")}</p><p className="mt-1 text-sm">{w.longTerm}</p></div>
        </div>
        <CheerBadge text={t("cheer2")} />
      </Card>
      {w.song && <SongCard song={w.song} />}
    </div>
  );
}

function SongCard({ song }: { song: NonNullable<Wisdom["song"]> }) {
  const q = encodeURIComponent(`${song.title} ${song.artist}`).replace(/%20/g, "+");
  const find = useServerFn(findSongPreview);
  const [preview, setPreview] = useState<SongPreview | undefined>(undefined);
  const [playing, setPlaying] = useState(false);
  const { premium } = usePlan();
  const audio = useRef<HTMLAudioElement>(null);
  const t = useT();
  useEffect(() => {
    let live = true;
    find({ data: { title: song.title, artist: song.artist } }).then((p) => live && setPreview(p)).catch(() => live && setPreview(null));
    return () => { live = false; };
  }, [song.title, song.artist, find]);
  const toggle = () => {
    const a = audio.current;
    if (!a) return;
    if (a.paused) void a.play(); else a.pause();
  };
  const title = preview?.title ?? song.title;
  const artist = preview?.artist ?? song.artist;
  return (
    <Card icon={<Music className="h-4 w-4" />} title={t("soundtrack")} delay={480}>
      <div className="flex items-center gap-4">
        {preview?.artwork ? (
          <img src={preview.artwork} alt={`${preview.album || title} album art`} className="h-20 w-20 shrink-0 rounded-xl object-cover shadow-lg" />
        ) : (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-accent text-primary"><Music className="h-8 w-8" /></div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-bold leading-snug">{title}</p>
          <p className="text-sm font-bold text-primary">{artist}</p>
          {preview?.album && <p className="truncate text-xs text-muted-foreground">{preview.album}</p>}
          {preview === undefined && <p className="mt-1 text-xs text-muted-foreground">Finding a preview…</p>}
          {preview === null && <p className="mt-1 text-xs text-muted-foreground">No preview available — use the links below.</p>}
        </div>
        {preview && premium && (
          <button onClick={toggle} aria-label={playing ? "Pause preview" : "Play preview"}
            className="btn-gold flex h-14 w-14 shrink-0 items-center justify-center rounded-full">
            {playing ? <Pause className="h-6 w-6" /> : <Play className="ml-0.5 h-6 w-6" />}
          </button>
        )}
      </div>
      {preview && !premium && (
        <p className="mt-3 rounded-xl border border-primary/25 bg-primary/10 px-3 py-2 text-xs text-primary">🔒 Play the preview right here with Monere Plus.</p>
      )}
      {preview && premium && (
        <>
          <audio ref={audio} src={preview.previewUrl} preload="none" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} />
          <div className="mt-3 flex h-6 items-end gap-1" aria-hidden>
            {Array.from({ length: 24 }, (_, i) => (
              <span key={i} className={`wave-bar w-1 flex-1 rounded-full bg-primary ${playing ? "is-playing" : ""}`} style={{ animationDelay: `${(i * 97) % 700}ms` }} />
            ))}
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">30-second preview courtesy of Apple Music</p>
        </>
      )}
      <p className="mt-3 text-sm italic text-muted-foreground">"{t("why")} {song.why}"</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <a href={`https://open.spotify.com/search/${q}`} target="_blank" rel="noopener noreferrer" className="song-link"><Music className="h-3.5 w-3.5" />Open full track in Spotify</a>
        <a href={`https://www.youtube.com/results?search_query=${q}`} target="_blank" rel="noopener noreferrer" className="song-link"><Youtube className="h-3.5 w-3.5" />Watch on YouTube</a>
      </div>
    </Card>
  );
}
