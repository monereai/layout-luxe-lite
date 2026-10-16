export const COMBINATION_FAMILIES = [
  { id: "crown-hero-sneakers", name: "Royal Hero", hat: "crown", outfit: "hero-cape", footwear: "crisp-sneakers" },
  { id: "explorer-emerald-boots", name: "Forest Explorer", hat: "explorer-hat", outfit: "emerald-cloak", footwear: "trail-boots" },
  { id: "wizard-galaxy-skates", name: "Galaxy Wizard", hat: "wizard-hat", outfit: "galaxy-cape", footwear: "skate-classics" },
  { id: "beanie-arctic-sneakers", name: "Winter Adventurer", hat: "cozy-beanie", outfit: "arctic-cloak", footwear: "crisp-sneakers" },
] as const;

type Selection = Partial<Record<"hat" | "outfit" | "footwear" | "glasses" | "accessory", string>>;

/**
 * Every selection is wearable. Returns the exact combination picture when one
 * exists, otherwise the closest complete look: the outfit picture, then the
 * hat, then footwear, glasses, accessory, and finally the default look.
 */
export function combinationLook(equipped: Selection): string {
  const ids = Object.values(equipped).filter((id): id is string => typeof id === "string");
  if (!ids.length) return "default";
  if (ids.length === 1) return ids[0] ?? "default";
  const family = COMBINATION_FAMILIES.find((f) => ids.every((id) => [f.hat, f.outfit, f.footwear].some((value) => value === id)));
  if (family) {
    if (ids.length >= 3 && equipped.hat === family.hat && equipped.outfit === family.outfit && equipped.footwear === family.footwear) {
      return `combo-${family.id}`;
    }
    const slots = (["hat", "outfit", "footwear"] as const).filter((slot) => equipped[slot]);
    if (slots.length === 2) return `combo-${family.id}-${slots.join("-")}`;
  }
  return equipped.outfit ?? equipped.hat ?? equipped.footwear ?? equipped.glasses ?? equipped.accessory ?? "default";
}
