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
- Anything purchased stays wearable forever with no further charge: combinations of owned items are free (no combo unlock fee), and shop.ts loads saved state eagerly at module init so a fast click can never overwrite purchases with the empty state. Why: paying twice or losing purchases breaks trust.
- Stripe purchases are verified server-side (payments.functions.ts confirmCheckout + stripe-sync.server.ts + /api/public/payments/webhook) before writing point_credits / subscriptions; the browser never grants points or tiers. Why: client completion callbacks can be faked.
- Use build-specific managed Stripe tokens for environment routing and the configured public production key for Stripe.js; keep server secrets gateway-managed. Validate same-origin payment returns through usePaymentReturn after auth hydration. Why: live payments must preserve account sessions and never grant benefits from URL flags.
- Store catalog is visible signed out; Stripe checkout requires sign-in and, for memberships, a prior confirmation that grants nothing. Why: purchases tie to accounts and benefits depend on verified payment.
- Pets, habitats and clothing are bought/equipped only via pet_action/property_action/wardrobe_action (server prices, shared points, owned checks, Club gates); the browser never writes inventories. Load equipped_pet_id on identity changes. Why: prevent free grants and stale pets.
- Space Station admission is checked both by property_action and at the character canvas, regardless of stored ownership. Why: expired Club access and old purchases cannot bypass the exclusive habitat gate.
- QA tier overrides are honored by account_tier/is_premium only for protected admin/tester role rows and never modify subscriptions or grant monthly credits. Why: test tiers remain stable during care refresh without granting public privileges.
- AI advice, follow-up, story and story-image endpoints require sign-in. Why: unauthenticated calls spend AI credits.
- Share mentor-persona facts and MessageResponse formatting. Why: accurate readable guidance.

- Subdirectories have their own AGENTS.md (src/components covers character art, wardrobe and shop) — read it before changing files there.

- Keep MCP reads OAuth caller-scoped in src/lib/mcp; browser tools use owning controls and static fail-open telemetry. Why: agents must preserve permissions, never grant purchases/rewards.
- Validate same-origin OAuth return paths for every sign-in method. Why: preserve consent requests without unsafe redirects.

- Derive the sitemap from required staticData.sitemap decisions; exclude personal/protocol routes and omit dates without page-specific timestamps. Why: discover public pages without leaking private destinations.
- Extend jigsaw sizes end-to-end; preserve gifts. Why: all levels must play/pay.
- Find Monere spots come from care_start_round; taps are checked against them. Why: fabricated finds must not pay.
- Daily Dilemma uses SQL-owned choices, protected dev resets and daily ledger keys with shared care cache. Why: resets/retries cannot pay twice.
