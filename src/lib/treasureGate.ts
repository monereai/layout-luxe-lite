// Treasure Hunt maintenance gate. Flip to false to restore the game everywhere
// (menus, direct navigation, sitemap). All game code stays intact underneath.
export const TREASURE_MAINTENANCE = true;

/** Only pass identity and roles validated by the authenticated server. */
export function isTreasureTester(email: string | undefined, roles: readonly string[]): boolean {
  return email?.toLowerCase() === "carlhillyard@icloud.com" && roles.some(role => role === "admin" || role === "tester");
}

export function visibleAdventureNavigation<T extends { to: string }>(items: readonly T[], maintenance: boolean = TREASURE_MAINTENANCE, tester = false): T[] {
  return items.filter(item => !(maintenance && !tester && item.to === "/treasure"));
}
