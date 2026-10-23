// Treasure Hunt maintenance gate. Flip to false to restore the game everywhere
// (menus, direct navigation, sitemap). All game code stays intact underneath.
export const TREASURE_MAINTENANCE = true;

export function visibleAdventureNavigation<T extends { to: string }>(items: readonly T[], maintenance: boolean = TREASURE_MAINTENANCE): T[] {
  return items.filter(item => !(maintenance && item.to === "/treasure"));
}
