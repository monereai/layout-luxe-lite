<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Persist care in protected profiles; atomic authenticated SQL handles drain, claims and replay-safe rewards. Local game storage tracks progression only.
- Reward unique spots on owned rounds; validate jigsaw moves against the saved initial order. Update care only after atomic success. Why: retries and fabricated placement must not pay.
- Fund separate token and point ledgers only through verified payments; profile totals project ledger inserts while usePointsWallet preserves local spending. Why: retries cannot duplicate paid grants.
- Refresh care on app entry, focus, and each minute through a shared account-keyed query; retain partial elapsed hours and use UTC for daily claims so device clocks cannot change payouts.

- Share identity/navigation in AppShell. Mobile QA stays in flow; habitat dialogs clear tabs. Why: consistent, unobstructed controls.
- Preserve the journal storage key through rebrands. Why: saved reflections must remain accessible.
- Reuse MonereMentor portraits and welcome/loading/results states with reduced-motion support; never duplicate character layouts.
- Premium status comes only from the is_premium database function (subscriptions + pass-code redemptions); never trust client-side tier flags for access. Why: one source of truth across devices.
- Claim login before balance reads; never recursively check membership or downgrade on read errors. Why: avoid request storms and false Free status.
- Keep the onboarding profile in a dedicated local-storage module and send only its validated enum to advice functions. Why: one profile choice consistently tailors initial and follow-up guidance.
- Register the service worker only through src/lib/pwa.ts (blocked in dev, preview and iframes); vite-plugin-pwa writes sw.js into dist/client. Why: stale caches must never break previews.
- Use usePointsWallet for all spendable-points displays, deducting clothing and habitat spending from game and credited points. Why: displayed points must match purchasing power everywhere.
- Purchases stay owned free forever (owned combos cost nothing); shop.ts loads saved state eagerly so fast clicks can't overwrite purchases. Why: trust.
- Stripe payments are verified server-side (confirmCheckout, stripe-sync, payments webhook) before granting; managed build tokens route environments; usePaymentReturn validates same-origin returns after auth hydration. Why: client callbacks/URL flags can be faked.
- Store catalog is visible signed out; Stripe checkout requires sign-in and, for memberships, a prior confirmation that grants nothing. Why: purchases tie to accounts and benefits depend on verified payment.
- Pets, habitats and clothing are bought/equipped only via pet_action/property_action/wardrobe_action (server prices, shared points, owned checks, Club gates); the browser never writes inventories. Load equipped_pet_id on identity changes. Why: prevent free grants and stale pets.
- Space Station admission is checked both by property_action and at the character canvas, regardless of stored ownership. Why: expired Club access and old purchases cannot bypass the exclusive habitat gate.
- QA tier overrides are honored by account_tier/is_premium only for protected admin/tester role rows and never modify subscriptions or grant monthly credits. Why: test tiers remain stable during care refresh without granting public privileges.
- AI endpoints need sign-in except seekWisdomGuest (first questions, server-capped per hashed visitor/day); guest rewards are display-only. Why: guests spend credits, own nothing.
- Share mentor-persona facts and MessageResponse formatting.

- Subdirectories have their own AGENTS.md (src/components covers character art, wardrobe and shop) — read it before changing files there.

- Keep MCP reads OAuth caller-scoped in src/lib/mcp; browser tools use owning controls and static fail-open telemetry. Why: agents must preserve permissions, never grant purchases/rewards.
- Validate same-origin OAuth return paths for every sign-in method. Why: preserve consent requests without unsafe redirects.

- Derive the sitemap from required staticData.sitemap decisions; exclude personal/protocol routes and omit dates without page-specific timestamps. Why: discover public pages without leaking private destinations.
- Extend jigsaw sizes end-to-end; preserve gifts. Why: all levels must play/pay.
- Find Monere spots come from care_start_round; taps are checked against them. Why: fabricated finds must not pay.
- Daily Dilemma uses SQL-owned choices, protected dev resets and daily ledger keys with shared care cache. Why: resets/retries cannot pay twice.
- Story pictures are reused by scene-text hash (server-only story_images cache). Guest points (local monere_guest_*) reach accounts only via claim_guest_points, once and capped. Why: cut AI cost; browser totals untrusted.
