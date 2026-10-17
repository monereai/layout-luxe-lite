import { createFileRoute, Link } from "@tanstack/react-router";
import { Award, Check, Footprints, Gem, Glasses, GraduationCap, Home, Lock, Sparkles } from "lucide-react";
import { PROPERTIES, buyProperty, equipProperty, saveProperties, useProperties } from "@/lib/properties";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { MonereFigure } from "@/components/MonereFigure";
import { MonereCharacterView } from "@/components/MonereCharacterView";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePointsWallet } from "@/hooks/usePointsWallet";
import { usePlan } from "@/hooks/usePlan";
import { SHOP_ITEMS, COMBINATIONS_BY_VALUE, buy, buyCombination, combinationPrice, equip, equipmentSlot, saveShop, useShop, type ShopCategory } from "@/lib/shop";
import { signSrc, useLang } from "@/lib/i18n";
import { COMBINATION_FAMILIES, hasCombinationArt } from "@/lib/shop-combinations";
import { MonereStore } from "@/components/MonereStore";
import { MonereCare } from "@/components/MonereCare";
import stormViking from "@/assets/combinations/storm-viking.png";
import partyStar from "@/assets/combinations/party-star.png";
import galaxyVoyager from "@/assets/combinations/galaxy-voyager.png";
import dapperPirate from "@/assets/combinations/dapper-pirate.png";

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

const COMBINATION_PICTURES: Record<string, string> = {
  "viking-storm-boots": stormViking,
  "party-flame-sliders": partyStar,
  "halo-galaxy-rocket": galaxyVoyager,
  "tophat-pirate-rain": dapperPirate,
};

const CLOTHING_BUTTON_CLASS = "mt-auto h-auto min-h-8 w-full whitespace-normal px-2 py-2 text-center leading-tight";

function ShopPage() {
  const lang = useLang();
  const shop = useShop();
  const props = useProperties();
  const wallet = usePointsWallet();
  const { tier } = usePlan();

  function purchase(id: string) {
    const next = buy(shop, wallet + shop.spent, id);
    if (!next) return;
    saveShop(next);
    const item = SHOP_ITEMS.find((i) => i.id === id);
    toast.success(`${item?.name} unlocked${item && next.equipped[equipmentSlot(item.category)] === id ? " and equipped" : " — saved to your inventory"}!`);
  }

  function wear(category: ShopCategory, id: string | null) {
    saveShop(equip(shop, category, id));
  }

  function wearCombo(family: (typeof COMBINATION_FAMILIES)[number]) {
    // Items already bought stay wearable: combinations cost nothing extra.
    saveShop(equip(equip(equip(shop, "hat", family.hat), "costume", family.outfit), "footwear", family.footwear));
  }

  function buyCombo(family: (typeof COMBINATION_FAMILIES)[number]) {
    const next = buyCombination(shop, wallet, family);
    if (!next) {
      const missingPoints = combinationPrice(shop, family) - wallet;
      if (missingPoints > 0) toast.error(`You need ${missingPoints} more points to buy ${family.name}.`);
      return;
    }
    saveShop(next);
    toast.success(`${family.name} bought — Monere is wearing it!`);
  }

  function takeOffCombo(family: (typeof COMBINATION_FAMILIES)[number]) {
    // Taking a combination off frees its three slots; anything else stays on.
    let next = shop;
    if (next.equipped.hat === family.hat) next = equip(next, "hat", null);
    if (next.equipped.outfit === family.outfit) next = equip(next, "costume", null);
    if (next.equipped.footwear === family.footwear) next = equip(next, "footwear", null);
    saveShop(next);
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

        <MonereStore />
        <MonereCare snack />
        <section className="mb-5">
          <h2 className="mb-3 font-display text-xl font-semibold">Clothing combinations</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {COMBINATION_FAMILIES.map((family) => {
              const ids = [family.hat, family.outfit, family.footwear];
              const ready = ids.every((id) => shop.owned.includes(id));
              const price = combinationPrice(shop, family);
              const on = shop.equipped.hat === family.hat && shop.equipped.outfit === family.outfit && shop.equipped.footwear === family.footwear;
               const picture = COMBINATION_PICTURES[family.id] ?? (hasCombinationArt(family.id) ? `/monere/looks/combo-${family.id}/0.webp` : SHOP_ITEMS.find((item) => item.id === family.outfit)?.src ?? "");
              return <div key={family.id} className={`flex flex-col rounded-lg border bg-card p-3 ${on ? "border-primary ring-2 ring-primary" : "border-border"}`}>
                <img src={picture} alt={family.name} className="aspect-square w-full object-contain" loading="lazy" onError={(e) => { const fallback = SHOP_ITEMS.find((item) => item.id === family.outfit)?.src; if (fallback && !e.currentTarget.src.endsWith(fallback)) e.currentTarget.src = fallback; }} />
                <h3 className="text-sm font-semibold">{family.name}</h3>
                <p className="text-xs text-muted-foreground">{ids.map((id) => SHOP_ITEMS.find((item) => item.id === id)?.name).join(" + ")}</p>
                <p className="mb-3 text-xs text-muted-foreground">{ready ? "Free — items owned" : `${price} pts`}</p>
                {on ? (
                  <Button size="sm" variant="secondary" className={CLOTHING_BUTTON_CLASS} onClick={() => takeOffCombo(family)} aria-label={`${family.name} equipped — tap to take off`}>
                    <Check /> Equipped
                  </Button>
                ) : ready ? (
                  <Button size="sm" variant="outline" className={CLOTHING_BUTTON_CLASS} onClick={() => wearCombo(family)}>Equip</Button>
                ) : (
                  <Button size="sm" className={CLOTHING_BUTTON_CLASS} onClick={() => buyCombo(family)}>
                    Buy Now for {price} pts
                  </Button>
                )}
              </div>;
            })}
          </div>
        </section>
        <Tabs defaultValue="hat">
          <TabsList className="grid h-auto w-full grid-cols-3 gap-1 p-1 sm:grid-cols-6">
            {CATS.map(({ id, label, icon: Icon }) => (
              <TabsTrigger key={id} value={id} className="min-h-11 gap-1 text-xs"><Icon className="h-4 w-4" />{label}</TabsTrigger>
            ))}
            <TabsTrigger value="habitats" className="min-h-11 gap-1 text-xs"><Home className="h-4 w-4" />Habitats</TabsTrigger>
          </TabsList>
          <TabsContent value="habitats">
            <div className="grid grid-cols-2 gap-3">
              {PROPERTIES.map((p) => {
                const clubIncluded = p.id === "space-station" && tier === "club";
                const owned = props.unlockedProperties.includes(p.id) || clubIncluded;
                const on = props.activeProperty === p.id;
                return (
                  <div key={p.id} className={`flex flex-col rounded-lg border bg-card p-3 ${on ? "border-primary ring-2 ring-primary" : "border-border"}`}>
                    <img src={p.src ?? "/treehouse-watermark.webp"} alt={p.name} loading="lazy" width={816} height={816} className="mb-2 aspect-square w-full rounded-md object-cover" />
                    <p className="text-sm font-semibold">{p.name}</p>
                    <p className="mb-3 text-xs text-muted-foreground">{clubIncluded && !props.unlockedProperties.includes(p.id) ? "Included with Monere Club" : p.cost ? `${p.cost} pts` : "Free"}</p>
                    {on ? (
                      <Button size="sm" variant="secondary" className="mt-auto" disabled><Check /> Equipped</Button>
                    ) : owned ? (
                      <Button size="sm" variant="outline" className="mt-auto" onClick={() => saveProperties(equipProperty(clubIncluded && !props.unlockedProperties.includes(p.id) ? { ...props, unlockedProperties: [...props.unlockedProperties, p.id] } : props, p.id))}>Equip</Button>
                    ) : (
                      <Button size="sm" className={CLOTHING_BUTTON_CLASS} onClick={() => {
                        const next = buyProperty(props, wallet, p.id);
                        if (!next) {
                          if (wallet < p.cost) toast.error(`You need ${p.cost - wallet} more points to buy ${p.name}.`);
                          return;
                        }
                        saveProperties(next);
                        toast.success(`${p.name} unlocked and equipped!`);
                      }}>
                        Buy Now for {p.cost} pts
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </TabsContent>
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
                          <Button size="sm" variant="secondary" className={CLOTHING_BUTTON_CLASS} onClick={() => wear(item.category, null)} aria-label={`${item.name} equipped — tap to take off`}>
                          <Check /> Equipped
                        </Button>
                      ) : owned ? (
                        <Button size="sm" variant="outline" className={CLOTHING_BUTTON_CLASS} onClick={() => wear(item.category, item.id)}>Equip</Button>
                      ) : (
                        <Button size="sm" className={CLOTHING_BUTTON_CLASS} disabled={!afford} onClick={() => purchase(item.id)}>
                          {!afford && <Lock />} Buy Now for {item.cost} pts
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
