import { describe, it, expect } from 'vitest';
import { SNAP_TARGET, SNAP_CYCLE_MS, SNAP_POINTS, SNAP_ENERGY, snapMatches, snapEnergyGain, snapRewardAvailable } from '@/lib/biblical-snap';
describe('Biblical Snap rules', () => {
  it('uses first-to-3 scoring', () => expect(SNAP_TARGET).toBe(3));
  it('cycles within 1.5 to 2 seconds', () => { expect(SNAP_CYCLE_MS).toBeGreaterThanOrEqual(1500); expect(SNAP_CYCLE_MS).toBeLessThanOrEqual(2000); });
  it('matches each of the six paired categories', () => { for (let n = 0; n < 12; n += 2) { expect(snapMatches(n, n + 1)).toBe(true); expect(snapMatches(n, (n + 2) % 12)).toBe(false); } });
  it('grants 50 points per daily victory', () => expect(SNAP_POINTS).toBe(50));
  it('grants 25 energy', () => { expect(SNAP_ENERGY).toBe(25); expect(snapEnergyGain(50)).toBe(25); });
  it('caps energy at 100', () => { expect(snapEnergyGain(98)).toBe(2); expect(snapEnergyGain(100)).toBe(0); });
  it('allows one payout per UTC day', () => { expect(snapRewardAvailable('2026-10-19', new Date('2026-10-19T23:59:59Z'))).toBe(false); expect(snapRewardAvailable('2026-10-19', new Date('2026-10-20T00:00:00Z'))).toBe(true); });
});
