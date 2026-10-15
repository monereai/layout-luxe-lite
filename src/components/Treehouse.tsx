import type { ReactNode } from "react";
import { useUserName } from "@/lib/username";

/** Monere's home: a wrapper for the one main mascot, with the faded treehouse sitting behind him. */
export function Treehouse({ children }: { children: ReactNode }) {
  const name = useUserName();
  return (
    <section aria-labelledby="treehouse-title" className="surface-card relative isolate overflow-hidden p-4 pb-2">
      <img
        src="/treehouse-watermark.webp"
        alt=""
        aria-hidden="true"
        width={640}
        height={640}
        loading="lazy"
        className="pointer-events-none absolute inset-0 z-0 h-full w-full select-none object-contain opacity-20"
      />
      <div className="relative z-10">
        <h2 id="treehouse-title" className="text-center font-display text-xs font-bold uppercase tracking-widest text-primary">
          The Treehouse
        </h2>
        <div className="relative mx-auto mt-3 w-full max-w-sm">
          <div className="relative rounded-2xl border border-primary/30 bg-card/95 px-4 py-3 text-center text-sm leading-relaxed shadow-lg">
            {name ? `Welcome to The Treehouse, ${name}! Pull up a seat.` : "Welcome to The Treehouse! Pull up a seat."}
            <span aria-hidden="true" className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-b border-r border-primary/30 bg-card" />
          </div>
          <div className="relative z-10 mt-1 flex justify-center">{children}</div>
        </div>
      </div>
    </section>
  );
}
