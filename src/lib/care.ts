import { z } from "zod";

export const INITIAL_ENERGY = 50;
export const ENERGY_MAX = 100;
export const HOURLY_DRAIN = 10;
export const GAME_ENERGY = 5;
export const GAME_POINTS = 5;
export const MINI_ENERGY = 5;
export const FULL_ENERGY_BONUS = 0;
export const dailyAllowance = (tier: "free" | "plus" | "club") => tier === "club" ? 300 : tier === "plus" ? 200 : 100;
export const addEnergy = (energy: number, amount: number) => Math.min(ENERGY_MAX, Math.max(0, energy + amount));
export function drainEnergy(energy: number, lastDrain: number, now: number) {
  const hours = Math.max(0, Math.floor((now - lastDrain) / 3_600_000));
  return { energy: Math.max(0, energy - hours * HOURLY_DRAIN), lastDrain: lastDrain + hours * 3_600_000 };
}
export const canClaimCare = (energy: number, _claimed: boolean, claimDate: string | null, today: string) => energy === 100 && claimDate !== today;
// Only a real increase counts as a gain: the first reading, a drop from the
// hourly drain, and a refresh that changes nothing must never celebrate.
export const energyGain = (previous: number | null | undefined, current: number | null | undefined) =>
  previous == null || current == null ? 0 : Math.max(0, current - previous);
export const careSchema = z.object({
  energy: z.number().int().min(0).max(100), lastDrain: z.string(), claimed: z.boolean(),
  claimDate: z.string().nullable(), tokens: z.number().int().nonnegative(),
  allowance: z.union([z.literal(100), z.literal(200), z.literal(300)]), pointsAwarded: z.number(), energyAwarded: z.number(), today: z.string(), fullBonus: z.number(),
});
export type CareState = z.infer<typeof careSchema>;