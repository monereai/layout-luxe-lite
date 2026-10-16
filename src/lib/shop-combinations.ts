export const COMBINATION_FAMILIES = [
  { id: "crown-hero-sneakers", name: "Royal Hero", hat: "crown", outfit: "hero-cape", footwear: "crisp-sneakers" },
  { id: "explorer-emerald-boots", name: "Forest Explorer", hat: "explorer-hat", outfit: "emerald-cloak", footwear: "trail-boots" },
  { id: "wizard-galaxy-skates", name: "Galaxy Wizard", hat: "wizard-hat", outfit: "galaxy-cape", footwear: "skate-classics" },
  { id: "beanie-arctic-sneakers", name: "Winter Adventurer", hat: "cozy-beanie", outfit: "arctic-cloak", footwear: "crisp-sneakers" },
] as const;

type Selection = Partial<Record<"hat" | "outfit" | "footwear" | "glasses" | "accessory", string>>;
export function combinationLook(equipped: Selection): string | null {
  const ids = Object.values(equipped).filter((id): id is string => typeof id === "string");
  if (!ids.length) return "default";
  if (ids.length === 1) return ids[0] ?? "default";
  const family = COMBINATION_FAMILIES.find((f) => ids.every((id) => [f.hat, f.outfit, f.footwear].some((value) => value === id)));
  if (!family) return null;
  const slots = (["hat", "outfit", "footwear"] as const).filter((slot) => equipped[slot]);
  return `combo-${family.id}${slots.length === 3 ? "" : `-${slots.join("-")}`}`;
}