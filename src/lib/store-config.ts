// Browser-safe store catalog. Price IDs are the human-readable Stripe lookup keys.
export type PackId = "pocket" | "popular" | "mega";
export const POINT_PACKS: { id: PackId; priceId: string; name: string; points: number; price: string; badge?: string }[] = [
  { id: "pocket", priceId: "pocket_pack", name: "Pocket Pack", points: 250, price: "1.99" },
  { id: "popular", priceId: "popular_pack", name: "Popular Pack", points: 600, price: "3.99", badge: "Popular" },
  { id: "mega", priceId: "mega_bundle", name: "Mega Bundle", points: 1000, price: "7.99", badge: "Best Value" },
];

export type Tier = "plus" | "club";
export type Interval = "monthly" | "yearly";

export const MEMBERSHIPS: { tier: Tier; name: string; monthly: string; yearly: string; points: number; tokens: number; perks: string[]; badge?: string; prices: Record<Interval, string> }[] = [
  { tier: "plus", name: "Monere Plus", monthly: "2.99", yearly: "24.99", points: 100, tokens: 25, perks: ["100 Points + 25 Tokens every month", "2x Daily Care Points (40 pts at 100% energy)"], prices: { monthly: "plus_monthly", yearly: "plus_yearly" } },
  { tier: "club", name: "Monere Club", monthly: "4.99", yearly: "44.99", points: 250, tokens: 75, perks: ["Everything in Plus", "250 Points + 75 Tokens every month", "3x Daily Care Points (60 pts at 100% energy)", "Space Station Property Access", "Exclusive subscriber-only outfits", "Priority features"], badge: "BEST VALUE", prices: { monthly: "club_monthly", yearly: "club_yearly" } },
];

export function membershipPrice(priceId: string): { tier: Tier; interval: Interval; points: number; tokens: number } | null {
  for (const m of MEMBERSHIPS) for (const i of ["monthly", "yearly"] as Interval[]) if (m.prices[i] === priceId) return { tier: m.tier, interval: i, points: m.points, tokens: m.tokens };
  return null;
}

export function packPrice(priceId: string) {
  return POINT_PACKS.find((p) => p.priceId === priceId) ?? null;
}

export const STORE_PRICE_IDS = [...POINT_PACKS.map((p) => p.priceId), ...MEMBERSHIPS.flatMap((m) => Object.values(m.prices))];
