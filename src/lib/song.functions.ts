import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type SongPreview = { previewUrl: string; artwork: string; title: string; artist: string; album: string } | null;

export const findSongPreview = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ title: z.string().max(200), artist: z.string().max(200) }).parse(d))
  .handler(async ({ data }): Promise<SongPreview> => {
    try {
      const term = encodeURIComponent(`${data.title} ${data.artist}`);
      const res = await fetch(`https://itunes.apple.com/search?term=${term}&media=music&entity=song&limit=1`);
      if (!res.ok) return null;
      const json = (await res.json()) as { results?: { previewUrl?: string; artworkUrl100?: string; trackName?: string; artistName?: string; collectionName?: string }[] };
      const r = json.results?.[0];
      if (!r?.previewUrl) return null;
      return {
        previewUrl: r.previewUrl,
        artwork: (r.artworkUrl100 ?? "").replace("100x100", "300x300"),
        title: r.trackName ?? data.title,
        artist: r.artistName ?? data.artist,
        album: r.collectionName ?? "",
      };
    } catch {
      return null;
    }
  });
