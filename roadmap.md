# Energy overflow conversion (2026-10-25)
- [x] Revised per Carl: bar stays capped at 100 so daily care stays claimable; Energy gained while full accumulates as overflow and pays +5 Points per 100 (remainder carries). Guests: localStorage accumulator + local points; accounts: `profiles.energy_overflow` + atomic `energy_overflow_credit` SQL (migration 0087, replacing 0086's reset approach). Wired into digs, maze harvests and garden completion. All 419 tests pass, build OK.
- [x] Refreshed stale test mocks (new server function export) and the sitemap test (adventure is public again).
- [ ] Publish when Carl says "publish".
