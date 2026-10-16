import { createFileRoute, Link } from "@tanstack/react-router";
import { Award, Check, Footprints, Gem, Glasses, GraduationCap, Lock, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { MonereFigure } from "@/components/MonereFigure";
import { MonereCharacterView } from "@/components/MonereCharacterView";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGame } from "@/lib/game";
import { SHOP_ITEMS, buy, equip, equipmentSlot, saveShop, useShop, walletBalance, type ShopCategory } from "@/lib/shop";
import { signSrc, useLang } from "@/lib/i18n";
import { COMBINATION_FAMILIES } from "@/lib/shop-combinations";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Monere's Points Shop — MonereAI" },
      { name: "description", content: "Spend Wisdom Points from Where's Monere? on hats, glasses, capes and accessories for Monere the lion." },
      { property: "og:title", content: "Monere's Points Shop — MonereAI" },
      { property: "og:description", content: "Unlock hats, glasses, capes and accessories for Monere with your Wisdom Points." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ShopPage,
});

const CATS: { id: ShopCategory; label: string; icon: typeof Award }[] = [
  { id: "hat", label: "Hats", icon: GraduationCap },
  { id: "glasses", label: "Glasses", icon: Glasses },
  { id: "costume", label: "Costumes", icon: Sparkles },
  { id: "footwear", label: "Footwear", icon: Footprints },
  { id: "accessory", label: "Extras", icon: Gem },
];

function ShopPage() {
  const lang = useLang();
  const game = useGame();
  const shop = useShop();
  const wallet = walletBalance(game.points, shop);

  function purchase(id: string) {
    const next = buy(shop, game.points, id);
    if (!next) return;
    saveShop(next);
    const item = SHOP_ITEMS.find((i) => i.id === id);
    toast.success(`${item?.name} unlocked${item && next.equipped[equipmentSlot(item.category)] === id ? " and equipped" : " — saved to your inventory"}!`);
  }

  function wear(category: ShopCategory, id: string | null) {
    saveShop(equip(shop, category, id));
  }

  function wearCombo(family: (typeof COMBINATION_FAMILIES)[number]) {
    const unlocked = (shop.comboUnlocked ?? []).includes(family.id);
    const next = unlocked ? shop : unlockCombo(shop, game.points, family.id);
    if (!next) return;
    saveShop({ ...next, equipped: { ...next.equipped, hat: family.hat, outfit: family.outfit, footwear: family.footwear } });
    if (!unlocked) toast.success(`${family.name} unlocked with your Wisdom Points!`);
  }

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold"><img src={signSrc(lang)} alt="Points Shop" width={1205} height={389} loading="lazy" className="h-16 w-auto sm:h-20" /></h1>
            <p className="text-sm text-muted-foreground">Dress Monere up with points from <Link to="/find" className="text-primary underline-offset-2 hover:underline">Where's Monere?</Link></p>
          </div>
          <div className="flex shrink-0 items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-primary" aria-label={`${wallet} points available`}>
            <Award className="h-4 w-4" /><span className="font-display text-lg font-semibold tabular-nums">{wallet}</span><span className="text-xs">pts</span>
          </div>
        </div>

        <div className="relative mb-5 flex justify-center overflow-hidden rounded-lg border border-border bg-card/60 py-3">
          <img src="/monere/shop-interior.jpg" alt="" aria-hidden="true" loading="lazy" width={1024} height={1024} className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-45" />
          <div className="relative h-80 w-80 max-w-full">
            <MonereCharacterView>
              <MonereFigure bareBase alt="Monere wearing your equipped items" className="h-full w-full" />
            </MonereCharacterView>
          </div>
        </div>

        <section className="mb-5">
          <h2 className="mb-3 font-display text-xl font-semibold">Clothing combinations</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {COMBINATION_FAMILIES.map((family) => {
              const ids = [family.hat, family.outfit, family.footwear];
              const ready = ids.every((id) => shop.owned.includes(id));
              const on = shop.equipped.hat === family.hat && shop.equipped.outfit === family.outfit && shop.equipped.footwear === family.footwear;
              const unlocked = (shop.comboUnlocked ?? []).includes(family.id);
              const afford = wallet >= family.cost;
              return <div key={family.id} className="flex flex-col rounded-lg border border-border bg-card p-3">
                <img src={`/monere/looks/combo-${family.id}/0.webp`} alt={family.name} className="aspect-square w-full object-contain" loading="lazy" />
                <h3 className="text-sm font-semibold">{family.name}</h3>
                <p className="text-xs text-muted-foreground">{ids.map((id) => SHOP_ITEMS.find((item) => item.id === id)?.name).join(" + ")}</p>
                <p className="mb-3 text-xs font-semibold text-primary">{family.cost} pts</p>
                <Button
                  className="mt-auto"
                  size="sm"
                  variant={on ? "secondary" : "outline"}
                  disabled={!ready || on || (!unlocked && !afford)}
                  onClick={() => wearCombo(family)}
                >
                  {on ? <><Check /> Equipped</> : !ready ? <><Lock /> Unlock items</> : !unlocked ? <>Wear for {family.cost} pts</> : "Wear together"}
                </Button>
              </div>;
            })}
          </div>
        </section>
        <Tabs defaultValue="hat">
          <TabsList className="grid h-auto w-full grid-cols-5 gap-1 p-1">
            {CATS.map(({ id, label, icon: Icon }) => (
              <TabsTrigger key={id} value={id} className="min-h-11 gap-1 text-xs"><Icon className="h-4 w-4" />{label}</TabsTrigger>
            ))}
          </TabsList>
          {CATS.map(({ id }) => (
            <TabsContent key={id} value={id}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {SHOP_ITEMS.filter((i) => i.category === id).map((item) => {
                  const owned = shop.owned.includes(item.id);
                  const on = shop.equipped[equipmentSlot(item.category)] === item.id;
                  const afford = wallet >= item.cost;
                  return (
                    <div key={item.id} className={`flex flex-col rounded-lg border bg-card p-3 ${on ? "border-primary ring-2 ring-primary" : "border-border"}`}>
                      <div className="mb-2 flex h-24 items-center justify-center">
                        <img src={item.src} alt="" loading="lazy" className={`max-h-full max-w-full object-contain ${owned ? "" : "opacity-80"}`} />
                      </div>
                      <p className="text-sm font-semibold">{item.name}</p>
                      <p className="mb-3 text-xs text-muted-foreground">{item.cost} pts</p>
                      {on ? (
                          <Button size="sm" variant="secondary" className="mt-auto" onClick={() => wear(item.category, null)} aria-label={`${item.name} equipped — tap to take off`}>
                          <Check /> Equipped
                        </Button>
                      ) : owned ? (
                        <Button size="sm" variant="outline" className="mt-auto" onClick={() => wear(item.category, item.id)}>Equip</Button>
                      ) : (
                        <Button size="sm" className="mt-auto" disabled={!afford} onClick={() => purchase(item.id)}>
                          {!afford && <Lock />} Buy for {item.cost} pts
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>
        <p className="mt-4 text-center text-xs text-muted-foreground">Tap "Equipped" to take an item off. Find Monere to earn more points.</p>
      </div>
    </AppShell>
  );
}
