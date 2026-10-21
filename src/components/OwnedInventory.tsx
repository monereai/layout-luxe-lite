import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Home } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { usePlan } from "@/hooks/usePlan";
import { PROPERTIES, useProperties, type Property, type PropertyState } from "@/lib/properties";
import {
  SHOP_ITEMS,
  equipmentSlot,
  clothingCost,
  equip,
  persistShop,
  useShop,
  type ShopCategory,
  type ShopItem,
  type ShopState,
} from "@/lib/shop";

const GROUPS: { id: ShopCategory; label: string }[] = [
  { id: "hat", label: "Hats" },
  { id: "glasses", label: "Glasses" },
  { id: "costume", label: "Costumes" },
  { id: "footwear", label: "Footwear" },
  { id: "accessory", label: "Extras" },
];

export type OwnedGroup = { id: ShopCategory; label: string; items: ShopItem[] };

/**
 * Pure listing rule: only what the account really owns, in shop order,
 * grouped by category. Unknown ids are ignored, habitats come from the
 * unlocked list (Space Station counts for Club members).
 */
export function ownedCollection(shop: ShopState, props: PropertyState, club = false) {
  const groups: OwnedGroup[] = GROUPS.map(({ id, label }) => ({
    id,
    label,
    items: SHOP_ITEMS.filter((item) => item.category === id && shop.owned.includes(item.id))
      .map((item) => ({ ...item, cost: clothingCost(item.id, item.cost, shop.owned) })),
  })).filter((group) => group.items.length > 0);
  const habitats: Property[] = PROPERTIES.filter(
    (p) => props.unlockedProperties.includes(p.id) || (club && p.id === "space-station"),
  );
  return { groups, habitats, total: groups.reduce((n, g) => n + g.items.length, 0) };
}

/** Everything the player has bought or been given, shown beside the journal. */
export function OwnedInventory() {
  const shop = useShop();
  const props = useProperties();
  const { tier } = usePlan();
  const [mounted, setMounted] = useState(false);
  const [equipping, setEquipping] = useState<string | null>(null);
  useEffect(() => setMounted(true), []);

  async function wear(item: ShopItem) {
    setEquipping(item.id);
    try {
      await persistShop((current) => equip(current, item.category, item.id));
      toast.success(`Equipped ${item.name}!`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Your outfit could not be saved.");
    } finally { setEquipping(null); }
  }

  const { groups, habitats, total } = ownedCollection(shop, props, tier === "club");
  if (!mounted) return null;

  if (!groups.length && !habitats.length) {
    return (
      <section className="surface-card mt-8 p-6 text-center">
        <h2 className="font-display text-xl">Items You Own</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Nothing in your collection yet — points from Where's Monere? unlock hats, capes and habitats.
        </p>
        <Link to="/shop" className="btn-gold mt-4 inline-block px-5 py-2.5 text-sm">
          Visit the Points Shop
        </Link>
      </section>
    );
  }

  return (
    <section className="surface-card mt-8 p-5" aria-labelledby="owned-heading">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 id="owned-heading" className="font-display text-xl">
          Items You Own
        </h2>
        <p className="text-xs text-muted-foreground">
          {total} {total === 1 ? "item" : "items"}
          {habitats.length > 0 && ` · ${habitats.length} ${habitats.length === 1 ? "habitat" : "habitats"}`}
        </p>
      </div>

      {groups.map((group) => (
        <div key={group.id} className="mb-5 last:mb-0">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-primary">{group.label}</h3>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {group.items.map((item) => {
              const wearing = shop.equipped[equipmentSlot(item.category)] === item.id;
              return (
                <li
                  key={item.id}
                  className={`rounded-lg border bg-card p-2 ${wearing ? "border-primary ring-2 ring-primary" : "border-border"}`}
                >
                  <img src={item.src} alt="" loading="lazy" className="h-20 w-full object-contain" />
                  <p className="mt-1 text-xs font-semibold leading-tight">{item.name}</p>
                  {wearing && (
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-primary">
                      <Check className="h-3 w-3" /> Wearing
                    </p>
                  )}
                  {!wearing && <Button size="sm" variant="outline" className="mt-2 w-full" disabled={equipping !== null} onClick={() => wear(item)} aria-label={`Equip ${item.name}`}>Equip</Button>}
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      {habitats.length > 0 && (
        <div className="mt-5">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-primary">Habitats</h3>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {habitats.map((p) => {
              const home = props.activeProperty === p.id;
              return (
                <li
                  key={p.id}
                  className={`rounded-lg border bg-card p-2 ${home ? "border-primary ring-2 ring-primary" : "border-border"}`}
                >
                  <img
                    src={p.src ?? "/treehouse-watermark.webp"}
                    alt=""
                    loading="lazy"
                    width={816}
                    height={816}
                    className="h-20 w-full rounded-md object-cover"
                  />
                  <p className="mt-1 text-xs font-semibold leading-tight">{p.name}</p>
                  {home && (
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-primary">
                      <Home className="h-3 w-3" /> Home now
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <p className="mt-4 text-center text-xs text-muted-foreground">
        <Link to="/find" className="text-primary underline-offset-2 hover:underline">
          Find Monere
        </Link>{" "}
        to earn more points, or{" "}
        <Link to="/shop" className="text-primary underline-offset-2 hover:underline">
          visit the Points Shop
        </Link>
        .
      </p>
    </section>
  );
}
