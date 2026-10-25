# Game economy audit (2026-10-25)
- [ ] Audit every Energy gain/spend; enforce dig +10, jump cost 5, cap 100 and atomic replay-safe overflow (+5 Points per 100).
- [ ] Separate Coins from Points; Barn awards +50 Energy/+20 Coins/first scroll and Connie +20 Coins/wood scroll/strict win flag.
- [ ] Synchronize and persist Energy, Coins, Points and Fruits counters; prohibit negative balances.
- [ ] Run economy regression tests and isolated end-to-end checks without modifying Carl's account or map movement/tiles/physics.
- [ ] Check preview compilation; do not publish without a new request.
