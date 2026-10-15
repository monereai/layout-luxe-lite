import { MonereFigure } from "@/components/MonereFigure";
import { useUserName } from "@/lib/username";

/** Monere's home: a faded treehouse watermark behind his crisp, currently-equipped character. */
export function Treehouse() {
  const name = useUserName();
  return (
    <section aria-labelledby="treehouse-title" className="surface-card relative isolate mt-5 overflow-hidden p-5 pb-4">
      <img
        src="/treehouse-watermark.webp"
        alt=""
        aria-hidden="true"
        width={640}
        height={640}
        loading="lazy"
        className="pointer-events-none absolute left-1/2 top-1/2 -z-0 w-[85%] max-w-[420px] -translate-x-1/2 -translate-y-1/2 select-none opacity-20"
      />
      <div className="relative z-10">
        <h2 id="treehouse-title" className="font-display text-xs font-bold uppercase tracking-widest text-primary">
          The Treehouse
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">Monere's cozy hideout</p>

        <div className="relative mx-auto mt-4 max-w-sm">
          <div className="relative rounded-2xl border border-primary/30 bg-card/95 px-4 py-3 text-sm leading-relaxed shadow-lg">
            {name ? `Welcome back to The Treehouse, ${name}! Pull up a seat — I'm glad you're here.` : "Welcome back to The Treehouse! Pull up a seat — I'm glad you're here."}
            <span aria-hidden="true" className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-b border-r border-primary/30 bg-card" />
          </div>
          <div className="relative z-10 mx-auto mt-4 w-48 sm:w-56">
            <MonereFigure gesture="wave" alt="Monere waving from The Treehouse" className="w-full" />
          </div>
        </div>
      </div>
    </section>
  );
}
