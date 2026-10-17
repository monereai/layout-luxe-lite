// Browser-safe PayPal store configuration (Client ID is publishable).
export const PAYPAL_CLIENT_ID = "AQO0xTLBWAu7ZLtj1RiNqb6seXYMkpRXPYmqommtMgqHfxOm9lx62PT3lTzDr8NAl41mIcMpzVY0W_Xx";
export const PAYPAL_API = "https://api-m.sandbox.paypal.com";

export type PackId = "pocket" | "popular" | "mega";
export const POINT_PACKS: { id: PackId; name: string; points: number; price: string; badge?: string }[] = [
  { id: "pocket", name: "Pocket Pack", points: 250, price: "1.99" },
  { id: "popular", name: "Popular Pack", points: 600, price: "3.99", badge: "Popular" },
  { id: "mega", name: "Mega Bundle", points: 1500, price: "7.99", badge: "Best Value" },
];

export type Tier = "plus" | "club";
export type Interval = "monthly" | "yearly";

export const PLUS_MONTHLY_PLAN_ID = "P-8RF58833D7897102MNLJFCHI";
export const PLUS_YEARLY_PLAN_ID = "P-5JH18751UE3434140NLJFCHQ";
export const CLUB_MONTHLY_PLAN_ID = "P-32C74283MR221461ENLJFCHY";
export const CLUB_YEARLY_PLAN_ID = "P-07J4782826302621CNLJFCIA";

export const MEMBERSHIPS: { tier: Tier; name: string; monthly: string; yearly: string; points: number; tokens: number; perks: string[]; badge?: string; plans: Record<Interval, string> }[] = [
  { tier: "plus", name: "Monere Plus", monthly: "2.99", yearly: "24.99", points: 100, tokens: 25, perks: ["100 Points + 25 Tokens every month", "2x Daily Care Points (40 pts at 100% energy)"], plans: { monthly: PLUS_MONTHLY_PLAN_ID, yearly: PLUS_YEARLY_PLAN_ID } },
  { tier: "club", name: "Monere Club", monthly: "4.99", yearly: "44.99", points: 250, tokens: 75, perks: ["Everything in Plus", "250 Points + 75 Tokens every month", "3x Daily Care Points (60 pts at 100% energy)", "Space Station Property Access", "Exclusive subscriber-only outfits", "Priority features"], badge: "BEST VALUE", plans: { monthly: CLUB_MONTHLY_PLAN_ID, yearly: CLUB_YEARLY_PLAN_ID } },
];

export function planInfo(planId: string): { tier: Tier; interval: Interval; points: number; tokens: number } | null {
  if (!planId) return null;
  for (const m of MEMBERSHIPS) for (const i of ["monthly", "yearly"] as Interval[]) if (m.plans[i] === planId) return { tier: m.tier, interval: i, points: m.points, tokens: m.tokens };
  return null;
}
