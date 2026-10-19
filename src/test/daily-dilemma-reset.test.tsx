import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DailyDilemmaModal } from '@/components/DailyDilemmaModal';

const mocks = vi.hoisted(() => ({ play: vi.fn(), accept: vi.fn() }));
vi.mock('@tanstack/react-start', () => ({ useServerFn: () => mocks.play }));
vi.mock('@/lib/daily-dilemma.functions', () => ({ playDailyDilemma: vi.fn() }));
vi.mock('@/hooks/usePlan', () => ({ usePlan: () => ({ user: { id: 'isolated-test-user' }, ready: true }) }));
vi.mock('@/hooks/useCare', () => ({ useCare: () => ({ accept: mocks.accept }) }));
vi.mock('@/components/MonereMentor', () => ({ MonereMentor: () => null }));
vi.mock('@/lib/sound', () => ({ playChime: vi.fn() }));

const state = (canReset: boolean, completed = true) => ({ day: '2026-10-19', scenario: 0, completed, canReset, accepted: false, rewarded: false, serverNow: 0, nextAt: 86400000, care: { energy: 75, energyAwarded: 0, pointsAwarded: 0 } });
afterEach(() => { cleanup(); vi.clearAllMocks(); });
function open() { render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><DailyDilemmaModal open onOpenChange={vi.fn()} /></QueryClientProvider>); }

describe('Developer Daily Dilemma reset', () => {
  it('sends an authorized reset and immediately unlocks the completed scenario', async () => {
    mocks.play.mockResolvedValueOnce(state(true)).mockResolvedValueOnce(state(true, false));
    open();
    fireEvent.click(await screen.findByRole('button', { name: 'Dev Reset Timer' }));
    await waitFor(() => expect(mocks.play.mock.calls.some(([input]) => input.data.action === 'reset')).toBe(true));
    await waitFor(() => expect(screen.queryByRole('timer')).not.toBeInTheDocument());
    expect(screen.getByLabelText('Decision options').children).toHaveLength(3);
    expect(mocks.accept).toHaveBeenCalledWith(expect.objectContaining({ energyAwarded: 0, pointsAwarded: 0 }));
  });
  it('never offers reset when the server denies developer access', async () => {
    mocks.play.mockResolvedValue(state(false));
    open();
    await screen.findByRole('timer');
    expect(screen.queryByRole('button', { name: 'Dev Reset Timer' })).not.toBeInTheDocument();
    expect(mocks.play).toHaveBeenCalledTimes(1);
  });
});