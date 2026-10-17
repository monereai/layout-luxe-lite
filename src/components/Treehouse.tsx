import type { ReactNode } from "react";
import { useUserName } from "@/lib/username";
import { propertyName, useProperties } from "@/lib/properties";

export const TREEHOUSE_BACKDROP = "/treehouse-watermark.webp";

/** Monere's home: the wrapper around the single main mascot (drawn by CategoryPicker with the active habitat picture). */
export function Treehouse({ children }: { children: ReactNode }) {
  const name = useUserName();
  const props = useProperties();
  const habitat = propertyName(props.activeProperty);
  return (
    <section aria-labelledby="treehouse-title" className="surface-card relative isolate overflow-hidden p-4">
      <h2 id="treehouse-title" className="text-center font-display text-xs font-bold uppercase tracking-widest text-primary">
        The {habitat}
      </h2>
      <div className="relative mx-auto mt-3 w-full max-w-sm rounded-2xl border border-primary/30 bg-card/95 px-4 py-3 text-center text-sm leading-relaxed shadow-lg">
        {name ? `Welcome to the ${habitat}, ${name}! Pull up a seat.` : `Welcome to the ${habitat}! Pull up a seat.`}
        <span aria-hidden="true" className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-b border-r border-primary/30 bg-card" />
      </div>
      <div className="relative z-10">{children}</div>
    </section>
  );
}
