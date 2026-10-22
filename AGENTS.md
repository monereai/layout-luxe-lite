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
- Reward unique spots on owned rounds; validate jigsaw moves against the saved initial order. Update care only after atomic success.
- Fund separate token and point ledgers only through verified payments; profile totals project ledger inserts while usePointsWallet preserves local spending.
- Refresh care on app entry, focus, and each minute through a shared account-keyed query; retain partial elapsed hours and use UTC for daily claims so device clocks cannot change payouts.

- Share identity/navigation in AppShell. Mobile QA stays in flow; habitat dialogs clear tabs.
- Use the shared AppShell menu list for desktop and drawer navigation; fullscreen adventure keeps the menu and Pet Shop header link available. Why: game layout must not orphan existing stores or dashboard views.
- Pet Shop separates scene from rarity controls; rarity never sets prices.
- Preserve the journal storage key through rebrands.
- Reuse MonereMentor portraits and welcome/loading/results states with reduced-motion support; never duplicate character layouts.
- Premium status comes only from the is_premium database function (subscriptions + pass-code redemptions); never trust client-side tier flags for access.
- Claim login before balance reads; never recursively check membership or downgrade on read errors.
- Keep the onboarding profile in a dedicated local-storage module and send only its validated enum to advice functions.
- Register the service worker only through src/lib/pwa.ts (blocked in dev, preview and iframes); vite-plugin-pwa writes sw.js into dist/client.
- Use usePointsWallet for all spendable-points displays, deducting clothing and habitat spending from game and credited points.
- Owned equips are free; eagerly load shop state, queue equip transforms, and qualify SQL catalog costs.
- Stripe payments are verified server-side (confirmCheckout, stripe-sync, payments webhook) before granting; managed build tokens route environments; usePaymentReturn validates same-origin returns after auth hydration.
- Store catalog is visible signed out; Stripe checkout requires sign-in and, for memberships, a prior confirmation that grants nothing.
- Pets, habitats and clothing are bought/equipped only via pet_action/property_action/wardrobe_action (server prices, shared points, owned checks, Club gates); the browser never writes inventories. Load equipped_pet_id on identity changes.
- Habitats share PROPERTIES scenery/shop/inventory and property_action prices. Space Station checks Club at purchase and canvas despite ownership.
- QA tier overrides are honored by account_tier/is_premium only for protected admin/tester role rows and never modify subscriptions or grant monthly credits.
- AI endpoints need sign-in except seekWisdomGuest (first questions, server-capped per hashed visitor/day); guest rewards are display-only.
- Share mentor facts and MessageResponse.

- Read nested AGENTS.md before edits (src/components: art, wardrobe, shop).

- Keep MCP reads OAuth caller-scoped in src/lib/mcp; browser tools use owning controls and static fail-open telemetry.
- Validate same-origin OAuth return paths for every sign-in method.

- Derive the sitemap from required staticData.sitemap decisions; exclude personal/protocol routes and omit dates without page-specific timestamps.
- Extend jigsaw sizes end-to-end; preserve gifts.
- Find Monere spots come from care_start_round; taps are checked against them.
- Daily Dilemma uses SQL-owned choices, protected dev resets and daily ledger keys with shared care cache.
- Story images use scene hashes, private signed cache URLs and immediate ready-made art on failure; refusals never replay.
- Guest points (local monere_guest_*) reach accounts only via claim_guest_points, once and capped.
- Managed admin emails: fixed recipients/event keys after confirmed auth/Stripe; deduplicate.
- Never alias entities root: parse5 needs its own version.

- Treasure uses lazy browser-only Phaser and account-scoped SQL step/collection validation; wardrobe_action grants fixed relic-set gifts. Guest saves never import into rewards.
- Treasure tap routes use the shared collision pathfinder; locked answer stones route to the inner-door approach and explain prerequisites. Why: visible scenery must not silently swallow navigation or bypass gate rules.
- Griffin world (treasure_v5_action/travel) keeps older treasure RPCs for the published client; v5 draws each save's riddle slots and option order from the pool server-side and validates movement gates (gear, lily phase, traps), scrolls, riddles, NPC deliveries, digs and plates per saved step, pays points only via one-time point_credits references, and alone grants the reward-only golden-griffin pet. Why: staged deployment and optimistic movement must not bypass puzzles or replay rewards.
