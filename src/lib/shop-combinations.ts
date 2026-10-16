export const COMBINATION_FAMILIES = [
  { id: "crown-hero-sneakers", name: "Royal Hero", hat: "crown", outfit: "hero-cape", footwear: "crisp-sneakers" },
  { id: "explorer-emerald-boots", name: "Forest Explorer", hat: "explorer-hat", outfit: "emerald-cloak", footwear: "trail-boots" },
  { id: "wizard-galaxy-skates", name: "Galaxy Wizard", hat: "wizard-hat", outfit: "galaxy-cape", footwear: "skate-classics" },
  { id: "beanie-arctic-sneakers", name: "Winter Adventurer", hat: "cozy-beanie", outfit: "arctic-cloak", footwear: "crisp-sneakers" },
  { id: "viking-storm-boots", name: "Storm Viking", hat: "viking-helmet", outfit: "storm-cloak", footwear: "knight-boots" },
  { id: "party-flame-sliders", name: "Party Star", hat: "party-hat", outfit: "flame-cape", footwear: "golden-sliders" },
  { id: "halo-galaxy-rocket", name: "Galaxy Voyager", hat: "halo", outfit: "galaxy-cape", footwear: "rocket-boots" },
  { id: "tophat-pirate-rain", name: "Dapper Pirate", hat: "top-hat", outfit: "pirate-coat", footwear: "rain-boots" },
] as const;

/** Families that have their own hand-drawn combination pictures; the rest show their outfit picture. */
export const COMBINATION_ART_IDS = ["crown-hero-sneakers", "explorer-emerald-boots", "wizard-galaxy-skates", "beanie-arctic-sneakers"];
export function hasCombinationArt(id: string) { return COMBINATION_ART_IDS.includes(id); }

type Selection = Partial<Record<"hat" | "outfit" | "footwear" | "glasses" | "accessory", string>>;

/** Single-item looks that have their own turnaround pictures in public/monere/looks. */
export const LOOKS_WITH_ART = new Set<string>(["amber-snapback", "angel-wings", "arctic-cloak", "bandana", "bow-tie", "cowboy-hat", "cozy-beanie", "cozy-scarf", "crimson-cape", "crisp-sneakers", "crown", "default", "detective-hat", "emerald-cloak", "explorer-hat", "flame-cape", "friendship-beads", "galaxy-cape", "gold-chain", "gold-medal", "golden-sliders", "halo", "hero-cape", "knight-boots", "knight-cape", "phoenix-wings", "round-specs", "royal-cape", "scholar-cap", "shadow-cloak", "skate-classics", "soccer-cleats", "storm-cloak", "sunglasses", "top-hat", "trail-boots", "wizard-hat"]);

/**
 * Every selection is wearable. Returns the exact combination picture when one
 * exists, otherwise the closest complete look that actually has a picture: the
 * outfit, then hat, footwear, glasses, accessory, and finally the default look.
 * Items not drawn in that picture are layered on top by MonereFigure.
 */
export function combinationLook(equipped: Selection): string {
  const ids = Object.values(equipped).filter((id): id is string => typeof id === "string");
  if (!ids.length) return "default";
  const family = COMBINATION_FAMILIES.find((f) => hasCombinationArt(f.id) && ids.every((id) => [f.hat, f.outfit, f.footwear].some((value) => value === id)));
  if (family && ids.length >= 2) {
    if (ids.length >= 3 && equipped.hat === family.hat && equipped.outfit === family.outfit && equipped.footwear === family.footwear) {
      return `combo-${family.id}`;
    }
    const slots = (["hat", "outfit", "footwear"] as const).filter((slot) => equipped[slot]);
    if (slots.length === 2) return `combo-${family.id}-${slots.join("-")}`;
  }
  const order = [equipped.outfit, equipped.hat, equipped.footwear, equipped.glasses, equipped.accessory];
  return order.find((id): id is string => !!id && LOOKS_WITH_ART.has(id)) ?? "default";
}

/** Item ids already drawn into a look picture, so they are not layered twice. */
export function itemsDrawnIn(look: string, equipped: Selection): string[] {
  const family = COMBINATION_FAMILIES.find((f) => look === `combo-${f.id}` || look.startsWith(`combo-${f.id}-`));
  if (!family) return [look];
  if (look === `combo-${family.id}`) return [family.hat, family.outfit, family.footwear];
  const slots = look.slice(`combo-${family.id}-`.length).split("-") as ("hat" | "outfit" | "footwear")[];
  return slots.map((slot) => equipped[slot]).filter((id): id is string => !!id);
}
