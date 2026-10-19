import { describe, it, expect } from 'vitest';
import { DAILY_DILEMMAS, DILEMMA_ENERGY, DILEMMA_POINTS, dilemmaEnergyGain, dilemmaRewardAvailable, dilemmaIndex, dilemmaCountdown } from '@/lib/daily-dilemma';
describe('Daily Dilemma rules', () => {
  it('offers three distinct decisions with one wisdom choice per story', () => {
    for (const story of DAILY_DILEMMAS) { expect(new Set(story.choices).size).toBe(3); expect(story.wise).toBeGreaterThanOrEqual(0); expect(story.wise).toBeLessThan(3); }
  });
  it('awards 50 points', () => expect(DILEMMA_POINTS).toBe(50));
  it('awards 25 energy', () => { expect(DILEMMA_ENERGY).toBe(25); expect(dilemmaEnergyGain(50)).toBe(25); });
  it('caps energy at 100', () => { expect(dilemmaEnergyGain(98)).toBe(2); expect(dilemmaEnergyGain(100)).toBe(0); });
  it('allows one completion per UTC calendar day', () => { expect(dilemmaRewardAvailable('2026-10-19', new Date('2026-10-19T23:59:59Z'))).toBe(false); expect(dilemmaRewardAvailable('2026-10-19', new Date('2026-10-20T00:00:00Z'))).toBe(true); });
  it('rotates the scenario at UTC midnight', () => { expect(dilemmaIndex('2026-01-01')).toBe(0); expect(dilemmaIndex('2026-01-02')).toBe(1); expect(dilemmaIndex('2026-01-05')).toBe(0); });
  it('counts down from server time without using the device clock', () => { expect(dilemmaCountdown(86400000, 86300000, 1000)).toBe('00:01:39'); expect(dilemmaCountdown(86400000, 86300000, 100001)).toBe('00:00:00'); });
});