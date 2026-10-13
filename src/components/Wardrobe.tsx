import { useState } from "react";
import { Shirt, Check } from "lucide-react";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { OUTFITS, useOutfit } from "@/lib/outfit";

export function WardrobeButton({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const { outfit, setOutfit } = useOutfit();
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Customize Monere"
        className={`inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-background/70 px-3 py-1.5 text-xs font-semibold text-primary shadow-lg backdrop-blur-md transition hover:scale-105 hover:border-primary ${className}`}
      >
        <Shirt className="h-4 w-4" aria-hidden="true" /> Customize Monere
      </button>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="mx-auto max-w-md border-border bg-background">
          <DrawerHeader className="text-center">
            <DrawerTitle className="font-display text-xl">Monere's Wardrobe 👔</DrawerTitle>
            <DrawerDescription>Pick an outfit — Monere will wear it everywhere in the app.</DrawerDescription>
          </DrawerHeader>
          <div role="radiogroup" aria-label="Monere's outfit" className="grid grid-cols-2 gap-3 overflow-y-auto px-4 pb-8">
            {OUTFITS.map((o) => {
              const active = o.id === outfit.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setOutfit(o.id)}
                  className={`relative flex flex-col items-center rounded-2xl border bg-card/60 p-2 text-center transition ${active ? "border-primary ring-2 ring-primary shadow-[0_0_18px_-4px_#F59E0B]" : "border-border hover:border-primary/50"}`}
                >
                  {active && <span className="absolute right-2 top-2 rounded-full bg-primary p-0.5 text-primary-foreground"><Check className="h-3 w-3" /></span>}
                  <img src={o.src} alt="" loading="lazy" width={160} height={160} className="h-28 w-28 object-contain" />
                  <span className="mt-1 text-sm font-semibold">{o.name}</span>
                  <span className="text-[11px] leading-tight text-muted-foreground">{o.detail}</span>
                </button>
              );
            })}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
