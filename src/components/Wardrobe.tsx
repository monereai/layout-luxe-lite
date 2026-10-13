import { useState } from "react";
import { Check, Footprints, GraduationCap, Shirt } from "lucide-react";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { HATS, SHOES, TOPS, getOutfit, useOutfit, type HatId, type ShoeId, type TopId } from "@/lib/outfit";

export function WardrobeButton({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const { selection, setOutfit } = useOutfit();
  const preview = getOutfit(selection);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        aria-label="Customize Monere"
        className={`rounded-full border-primary/40 bg-background/70 text-xs font-semibold text-primary shadow-lg backdrop-blur-md ${className}`}
      >
        <Shirt aria-hidden="true" /> Customize Monere
      </Button>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="mx-auto max-h-[92dvh] max-w-md border-border bg-background">
          <DrawerHeader className="pb-2 text-center">
            <DrawerTitle className="font-display text-xl">Monere's Wardrobe 👔</DrawerTitle>
            <DrawerDescription>Build Monere's look one item at a time.</DrawerDescription>
          </DrawerHeader>

          <div className="min-h-0 overflow-y-auto px-4 pb-8">
            <div className="mb-3 flex h-44 items-center justify-center overflow-hidden rounded-lg border border-border bg-card/60">
              <img src={preview.src} alt={`Monere wearing ${preview.name}`} width={260} height={340} className="h-full w-full object-contain" />
            </div>

            <Tabs defaultValue="tops">
              <TabsList className="grid h-auto w-full grid-cols-3 gap-1 rounded-lg p-1">
                <TabsTrigger value="tops" className="min-h-11 gap-1 px-2 text-xs"><Shirt className="h-4 w-4" /> Tops &amp; Jackets</TabsTrigger>
                <TabsTrigger value="headwear" className="min-h-11 gap-1 px-2 text-xs"><GraduationCap className="h-4 w-4" /> Headwear</TabsTrigger>
                <TabsTrigger value="footwear" className="min-h-11 gap-1 px-2 text-xs"><Footprints className="h-4 w-4" /> Footwear</TabsTrigger>
              </TabsList>

              <TabsContent value="tops">
                <ChoiceGrid
                  label="Tops and jackets"
                  items={TOPS}
                  active={selection.top}
                  image={(id) => getOutfit({ ...selection, top: id as TopId }).src}
                  onSelect={(top) => setOutfit({ ...selection, top: top as TopId })}
                />
              </TabsContent>
              <TabsContent value="headwear">
                <ChoiceGrid
                  label="Headwear"
                  items={HATS}
                  active={selection.hat}
                  image={(id) => getOutfit({ ...selection, hat: id as HatId }).src}
                  onSelect={(hat) => setOutfit({ ...selection, hat: hat as HatId })}
                />
              </TabsContent>
              <TabsContent value="footwear">
                <ChoiceGrid
                  label="Footwear"
                  items={SHOES}
                  active={selection.shoe}
                  image={(id) => getOutfit({ ...selection, shoe: id as ShoeId }).src}
                  onSelect={(shoe) => setOutfit({ ...selection, shoe: shoe as ShoeId })}
                />
              </TabsContent>
            </Tabs>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

function ChoiceGrid({
  label,
  items,
  active,
  image,
  onSelect,
}: {
  label: string;
  items: ReadonlyArray<{ id: string; name: string; detail: string }>;
  active: string;
  image: (id: string) => string;
  onSelect: (id: string) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="grid grid-cols-2 gap-3 pt-2">
      {items.map((item) => {
        const equipped = active === item.id;
        return (
          <Button
            key={item.id}
            type="button"
            variant="outline"
            role="radio"
            aria-checked={equipped}
            onClick={() => onSelect(item.id)}
            className={`relative h-auto min-w-0 flex-col justify-start overflow-hidden whitespace-normal rounded-lg p-2 text-center ${equipped ? "border-primary ring-2 ring-primary" : "border-border"}`}
          >
            {equipped && (
              <span className="absolute right-1.5 top-1.5 z-10 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-1 text-[10px] font-bold text-primary-foreground">
                <Check className="h-3 w-3" /> Equipped
              </span>
            )}
            <img src={image(item.id)} alt="" loading="lazy" width={150} height={150} className="h-28 w-full object-contain" />
            <span className="mt-1 text-sm font-semibold leading-tight">{item.name}</span>
            <span className="mt-1 text-[11px] font-normal leading-tight text-muted-foreground">{item.detail}</span>
          </Button>
        );
      })}
    </div>
  );
}
