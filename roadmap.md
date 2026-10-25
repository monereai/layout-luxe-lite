# Energy overflow conversion (2026-10-25)
- [x] Full Energy bar (100+) converts each 100 into +5 Points and resets, carrying the remainder; toast "+5 Points! Energy Reset!". Guests: local bar + local points; accounts: atomic `energy_overflow_convert` SQL (migration 0086) crediting the points ledger. All 420 tests pass, build OK.
- [x] Refreshed stale test mocks (new server function export) and the sitemap test (adventure is public again).
