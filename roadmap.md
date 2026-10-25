# Game economy audit (2026-10-25)
- [x] Enforce dig +10, jump cost 5, cap 100 and protected atomic overflow (+5 Points per 100); remove client-driven minting.
- [x] Separate Coins from Points; Barn awards +50 Energy/+20 Coins/first scroll and Connie +20 Coins/wood scroll/strict win flag.
- [x] Synchronize and persist Energy, Coins, Points and held Fruits counters; prohibit negative balances.
- [x] Run 426 regression tests; verify signed-in jump deductions survive reopening and Connie arcade victory reads back 20 Coins and Wood Scroll using isolated QA only.
- [ ] Complete authenticated Barn victory and pet-dig overflow browser checks: Barn was not played to completion; isolated dig click did not execute the reward and its interaction path remains unverified.
- [x] Check preview compilation (build OK); database economy changes applied live; publishing requested 2026-10-25 09:31 UTC.
