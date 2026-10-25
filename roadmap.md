# Four audit logic fixes (2026-10-25)
- [ ] Remove first/second map scroll pickups, persist verified Connie wins, add prize-save retry, update Meadow clues, and allow capped Crystal practice without changing movement/physics.
- [ ] Run focused tests and isolated UI verification; preserve Carl’s account.

# Developer adventure reset (2026-10-25)
- [x] Add a confirmed, server-protected developer reset available before completion; reset quests, items, scrolls and mini-game rounds while preserving account balances, purchases and payout ledgers.
- [x] Test developer authorization and reset/save behaviour without altering Carl’s account; 17 focused checks pass and preview compiles.
- [ ] Verify live reset read-back; blocked by rule against altering Carl’s progress. Signed-in developer confirmation opened and cancelled successfully without resetting.

# Adventure logic assessment (2026-10-25)
- [x] Review active SQL and client progression; isolated simulation reaches final victory after injected barrel completion, arcade simulation wins (10 catches/1 miss), and maze reaches third scroll (32 ticks). Browser arcade loss/retry verified. Report direct first/second scroll bypass, first-time Crystal daily-cap block, missing arcade save retry, and misleading quest hints. Barrel win and live account reward read-back remain unverified; all 409 tests pass.

# Shadow Ravine crystal scroll (2026-10-25)
- [x] Remove the old Shadow Ravine scroll rock and disable its map pickup in guest rules and both live action functions; existing scrolls and movement unchanged. All 53 focused tests pass and preview compilation is clean.
- [x] Show the third scroll only in the crystal maze entered from Shadow Ravine; server replay verifies its cell before atomic, duplicate-safe settlement. All 402 tests pass; preview compiles cleanly.
- [x] Show “collect the third scroll” on entry to the qualifying crystal maze; isolated browser verifies the visible scroll, notification, movement and harvest callback.
- [ ] Verify authenticated scroll reward read-back through the adventure; blocked by Carl-only access and the rule against altering his progress.

# Connie’s arcade access (2026-10-25)
- [x] Open the fruit catcher after successful apple delivery even with the wood scroll already collected; keep replay available without requiring the handed-in apples again.

# Small hidden apples (2026-10-25)
- [x] Make Connie’s existing three Lonely Wood apples small and stationary; preserve pickups, saved collections, quest rewards and map movement.

# Barrel game scroll prize (2026-10-25)
- [x] Made the first (meadow) scroll the barrel-game prize: scroll shown above the top hopper, granted idempotently by migration 0075 and the guest fallback, completion notice updated; 18 focused tests pass, live function verified. Account gameplay not exercised (Carl-only access).

# Barrel speed and jump timing (2026-10-25)
- [x] Slowed barrels by 10% (3.6px/tick) and lengthened Monere's jump to 700ms (14 ticks); focused and full suites pass (379), build OK. Account gameplay not exercised (Carl-only access).

# Free barrel jumps (2026-10-25)
- [x] Remove the 5-Energy jump cost: shared rules, mini-game gate, guest path and server commit (migration 0074) all treat jumps as free; jump count still recorded for replay checks. Keys legend reads "Jump barrels · free". Tests updated; account gameplay not exercised (Carl-only access).

# Connie’s scattered apples
- [x] Spread the three apples across Meadow, Lonely Wood and Shadow Ravine; migration 0073 aligns authenticated pickups and preserves collected apples and Connie’s reward.
- [x] 36 focused tests pass for reachable pickups and delivery; live SQL coordinates verified and build OK. Account gameplay not exercised because access is Carl-only and his progress must not change.

# Pet dig and barrel controls (2026-10-25)
- [x] Confirm active pet digs award +10 Energy, never deduct 25; historical migrations retained.
- [x] Verified shared Space/button jumps, 5-Energy cost and 400ms airborne duration with 51 focused tests; maps and general movement untouched. Account gameplay remains untested because only Carl can enter and his progress must not change.

# Preview crash: useContext dispatcher null
- [x] Investigated: build and dev-server logs clean, headless browser load of the preview renders the home page with no page errors. Crash was a stale hot-reload state in the open tab; a page reload clears it.

# Barrel jump repair
- [x] Make jumps instant: optimistic local Energy gate, ordered background settlement, and a lag-tolerant server commit that charges any unpaid jumps at finish; Space works via key code and a slow save never freezes the loop. Regression tests cover immediate jump, non-blocking save, button parity and the low-Energy refusal.

# Barrel game startup repair
- [x] Add a ready Start action and WASD input to the silently waiting barrel scene; disable competing Phaser keyboard capture. Seventeen focused tests pass; isolated real-preview canvas verifies Start, WASD/touch movement, jump and rolling barrels. Database start function exists; Carl’s data read only, never changed. Authenticated garden entrance was not exercised because access is Carl-only; not published.

# Griffin developer-only access
- [x] Close the shared maintenance gate; retain verified Carl developer exception and preserve game saves/code.
- [x] Visitor browser sees Under Construction with no gameplay or public game link; nine access/server checks pass and build OK. Carl’s existing verified developer exception preserved; his account was not used for QA.

# Vernon’s garden mini-game
- [x] Build isolated lazy Phaser ladder/barrel overlay on garden entry; world input paused and touch controls included.
- [x] Verify atomic 5-Energy jumps and one-time +50 Energy/+20 Coins via authenticated replay on separate QA; repeat settlement returns zero; completion reads back through UI after reload.
- [x] Guest preview entry/jump/exit and desktop/mobile screenshots checked; focused tests pass and build clean; Carl untouched. Full keyboard-driven hopper win was not verified (automated runs collided); authenticated replay settlement and UI readback verified separately.

# Seed pathway visibility
- [x] Move all three seeds onto clear sand/stone outside Meadow; active v6 pickup positions mirrored by migration 0068, preserving existing collected seeds. Guest preview collected and delivered all three; 32 adventure tests and build pass. Authenticated collection not retested; server coordinates verified and Carl untouched.

# New-area graphics
- [x] Match garden and bridge-extension artwork to Meadow, feather the join and reset texture dimensions on zone changes; guest delivery/entry/reload/return screenshots pass, 31 adventure tests pass and preview build OK.

# Vernon's garden portal
- [x] Extended Meadow beyond its bridge; returning three seeds unlocks Vernon's new garden land with saved, validated v6 travel.
- [x] 358 tests pass; isolated guest delivery, garden entry/reload/return pass and database definitions confirm guarded access. Authenticated end-to-end travel remains unverified; Carl's account untouched.

# Vernon's scattered seeds
- [x] Place exactly three visible seeds in Lonely Wood, Shadow Ravine and Razor's Lair, with no Vernon-talk prerequisite; migration 0066 mirrors pickups and keeps saved collections/rewards.
- [x] All 28 focused adventure checks pass; isolated guest browser collected each seed and delivered all three to Vernon with saved completion. Signed-in collection was not retested; Carl's account untouched.

# Vernon by the bridge
- [x] Vernon the Gardener stands 10% larger beside the Meadow bridge on the north bank, clear of every item, seed, dig and hunt spot; migration 0064 moves his server-verified talk/deliver spot to the same tile.
- [x] Guest and signed-in QA browsers walk to the bridge, open his seed quest with no server refusal, and the meadow build stays clean.

# Meadow gardener quest and Lair rumble
- [x] Vernon the Gardener asks Monere to find three magic seed packets in the Meadow; seeds appear only after talking to him and the reward uses the shared WOW delivery message. Migration 0063 owns placement and the one-time reward.
- [x] Solving Razor's final duel riddle rumbles the lair with a one-second camera shake and falling rock debris before the victory celebration; reduced-motion players skip the shake.
- [x] All 352 tests pass; fresh security scan shows only the two expected shop-catalogue notes and no critical issues. Published to monereai.com.

# Active player animation fix

- [x] Active WorldCanvas cycles generated standing/walking poses every 120ms, applies moving-only three-pixel bounce, and uses 1.5x Energy-gated sprint; tile collision helpers unchanged.
- [x] Guest preview verifies movement, sprint Energy drain/zero-Energy fallback, immediate position/inventory/door reload saves and direct HUD/Razor Stripe actions. All 351 tests pass; preview build OK. Authenticated Energy spending uses the unchanged atomic path; not retested this turn. Carl untouched.

# Chapter 1 finalization checks
- [x] Refine vector acceleration, release friction, buffered ten-pixel corners and safe stamina boost scheduling with bounded retries.
- [x] Save accepted progression immediately; verify guest reload, fresh daily targets, preserved equipment/gates and Razor Door completion.
- [x] All 345 tests across 57 files pass; isolated guest and signed-in QA movement/reload pass, with authenticated Energy 23→21 from sprint then 21→16 from dash and retained after reload. Carl untouched; preview build OK.

# Chapter 1 final upgrades
- [x] Add fluid validated movement, corner assistance, walking animation, sprint and dash Energy costs; guest and signed-in QA movement/reload checked, 30→23 Energy after two sprint seconds and one dash.
- [x] Save secure session-randomized key-fragment hunt locations and matching NPC clues without breaking gear dependencies; old progressed saves retain placements, daily door continuation draws from unlocked lands.
- [x] Show Chapter 1 completion at Razor's door and Continue Daily Hunts; guest browser verifies modal and maze continuation at 644×818.
- [x] External Stripe supporter link uses the supplied public payment link.
- [x] Persist hunt state and account-keyed local harvest best scores; browser verifies guest placements/position and signed-in Energy/position after reload. Carl untouched.

# Orchard harvesting maze
- [x] Confirmed the user's requests were refused by the daily harvest ledger, not tester access. Exact authenticated Crystal daily-limit refusal now opens no-reward practice; other denials remain blocked. Twenty tests pass and isolated browser verifies real practice maze/closure at both entrances with unchanged Energy. Real signed-in replay remains unverified; Carl's account untouched.
- [x] Crystal Gate and World Map Crystal entry mount the maze directly and never render the cavern/tree screen, including entry failure and completed harvest. Seventeen tests pass; isolated browser verifies both entrances at zero Energy, real maze canvas and closure back at the gate. Carl's account untouched; signed-in settlement remains unverified.
- [x] Remove the legacy direct-harvest hook; all tree callers mount the shared maze with collected-Energy onComplete and verified settlement. Isolated desktop/phone browser checks confirm modal closure; phone harvest returns 2 Energy and test HUD rises 50→52. Fourteen rules pass. Signed-in settlement still awaits safe account access.
- [x] Remove minimum Energy for Crystal Gate/maze entry in walking, World Map and authenticated maze start; retain Leaf Gate and daily harvest rules. Fourteen tests pass; signed-in play remains blocked by the separate-QA rule.
- [x] Add tree-triggered maze, dots, Sun power, chasers and safe Energy settlement/entrance return with a shared UTC tree ledger.
- [x] Verify reward/power rules and isolated desktop/phone maze controls and expulsion; 39 focused tests pass and preview builds clean.
- [ ] Verify signed-in tree entry, account Energy read-back and saved entrance return; blocked by Carl-only testing access and the rule against changing his account. Isolated maze browser checks do not verify account settlement.

# Startup, quest completion and Lair cleanup
- [x] Safeguard invalid local Cloud configuration without editing generated files; browser verifies signed-out home mounts with missing/placeholder settings.
- [x] Stop completed-game activity and add explicit Play Again / Main Menu resets, preserving earned rewards; isolated guest browser verifies final answer, stable modal, both resets and refresh persistence. Signed-in reset not exercised because private access is Carl-only and his progress must not change.
- [x] Remove Lair warning symbols, path dashes and revealed-ledge label; screenshots and guest crossing checks pass with/without goggles. Public closure remains intact.

# Private Griffin testing access
- [ ] Allow only Carl's server-verified signed-in account through the closure, restore its game navigation, and verify allowed/denied access without changing his game progress.

# Temporary adventure closure
- [x] Hide Treasure Hunt navigation and show a localized construction modal on direct visits without mounting gameplay or changing saves.
- [x] Verified desktop/phone closure, hidden drawer navigation, loaded Monere picture, dashboard return, no gameplay/extra dilemma and unchanged guest save; 49 focused tests pass and preview build OK. Game code retained; not published.

# Razor’s Lair review
- [x] Replace floor colour blocks with stone slabs and circular trap markers; blocked stone taps guide players to the inner door without bypassing goggles or gate rules.
- [x] Guest browser verified no-goggles guidance, crossing with companion, scroll pickup, door answer, stone tap, single-answer landing and reload persistence; 23 focused tests pass and build OK. Signed-in saves unchanged and not retested; Carl untouched. Preview-only.

# Progressive Treasure Hunt
- [x] Implement 3/2/1 chests, fragments, landmark riddles, matching puzzle and stage victory portals.
- [x] Add mud, wind and simultaneous companion pressure-plate gates with secure saved progression.
- [x] Verify all six chests, Forest fragments/plates, both stage victories, Sky matching and final victory as guest and isolated signed-in QA; reload and database read confirm saved completion. All 274 tests pass; build OK. Existing wardrobe gifts and navigation retained. Preview-only.

# Pet Shop and app navigation restoration
- [x] Restore Pet Shop and Points Shop/Wardrobe in the shared menu on every page, including the full-screen adventure, with a direct Pet Shop header link.
- [x] Verify guest/signed-in navigation, all activity pages, 13 pets, saved puppy equip/unequip/reload, free owned-pet buy and rejected unaffordable purchase on isolated QA; 55 focused tests pass and build OK. No new paid purchase tested (QA has 100 points); Carl untouched. Preview-only.

# Treasure Hunt RPG
- [x] Monere map walk: CSS walk-bounce while moving, left/right flip, idle-breath when stopped.
- [x] Map Monere uses the main-page turnaround angles to face East/South/West/North, with squash-and-stretch hops.
- [x] Map shows the equipped pet trailing Monere by 0.5s with matching hops, celebrating on treasure finds.
- [x] Map Monere uses the exact main-page turnaround art with all equipped layers, turning smoothly through all 8 angles and hopping.
- [x] Make the three-zone treasure adventure the main experience, retaining mentor and existing activities.
- [x] Add exploration controls, tool gates, riddles, relic logbook, saved account/guest progression and atomic wardrobe unlocks.
- [x] Verify all 18 relics, locks, reload persistence and three wardrobe rewards on isolated QA; phone/desktop checked, invalid actions rejected, 262 tests passed. Preview-only.

# Three additional glasses
- [x] Add Heart Specs, Aviator Shades and Rainbow Specs at 300 points each, with eight-angle wearable layers and server catalogue entries.
- [x] Verify all three QA purchases (1780→880), free re-equips, reload persistence and worn home/shop appearance; original hat and puppy preserved, Carl untouched. 43 focused tests pass; build OK. Preview-only.

# Lion’s Den habitat
- [x] Add Lion’s Den scenery and a 3,000-point server-checked purchase/equip; use atomic profile deduction like other stores instead of the credit-only ledger.
- [x] Verify isolated QA purchase (3780→780), saved ownership and active loaded home scenery after reload; 19 focused tests pass. Not published.

# Clothing equip reliability
- [x] Repair ambiguous SQL clothing costs, validate IDs, preserve server prices and free owned equips; queue selections through account loading and save completion.
- [x] Verify shop/inventory equip, reload and home appearance on separate QA; 51 focused tests pass, build OK, 780 points and puppy unchanged, original hat restored. Existing CookieYes localhost warning only. Frontend not published.

# Admin account email alerts
- [x] Add fixed-recipient registration/subscription templates: confirmed new users notify on first authenticated app visit; verified live active subscriptions notify through shared Stripe sync. Managed event keys deduplicate sends; email failures never block paid benefits. No email queues/tables or new provider key.
- [x] Verify details/auth rejection and stable managed event keys with focused tests; sign-up page renders and protected template preview returns 200 with project authorization / 401 without. No real registration/payment or email delivery tested while sender verification is pending.
- [ ] Enable delivery after notify.monereai.com verification and publishing (owner action).

# Pet Shop interior
- [x] Replace the storefront backdrop with a warm pet-store interior and preserve the interactive Monere view.
- [x] Verify loaded interior art, unobstructed Monere, rarity filters (3 Common / 2 Rare / 1 Legendary) and no horizontal overflow at 320, 454 and 1280px; nine existing pet tests pass and build OK. No purchase/account changes; preview-only. Existing CookieYes localhost warning remains unrelated.

# Story picture recovery
- [x] Show ready-made story art immediately, surface generation failures, and never retry refusals.
- [x] Return a private saved-picture URL on cache hits; controlled two-request regression confirms one generation, one stored image, then a URL-only hit.
- [x] Verify fallback in signed-in QA browser with simulated refusal: art/text/choices appear in 0.19s, art loads, one image request, no replay. Existing CookieYes localhost warning only.
- [ ] Verify real generated-image reuse after provider refusal is resolved; no cached production image exists and confirmed moderation refusal blocks further generation checks. Not published.

# Account-check monitoring fixes
- [x] Stop recursive membership reads; claim login before balances, with 15 focused regression tests passing.
- [x] Confirm authenticated execute permission; preserve verified membership on read errors. Isolated QA browser checks settle at three successful startup reads and remain unchanged five seconds later; preview build OK. Not published.

# Daily Dilemma developer reset
- [x] Add a protected Dev Reset Timer control; isolated QA verified reset, refresh, practice completion and phone button, with one daily credit and unchanged 275 points. Nine focused tests pass; preview build OK; not published.

# Mobile overlap fixes
- [x] Move Admin Sandbox into phone page flow, retaining its desktop floating position.
- [x] Bound the Space Station upgrade window above phone navigation and the safe area.
- [x] Verify collapsed/expanded Sandbox and Space Station upgrade clearance at 320×568, 390×844 and 430×740 on the separate QA account; upgrade opens memberships, screenshots confirm no overlaps, build OK. No purchases or sandbox actions; existing CookieYes localhost warning remains unrelated. Not published.

# Daily Dilemma replacement
- [x] Replace Snap modal/menu with four rotating daily three-choice stories, reflections and companion celebration.
- [x] Add atomic daily completion/rewards and server-timed next-dilemma countdown; preserve prior Snap daily completions during replacement.
- [x] Verify with isolated QA: unwise choice pays nothing, wise choice saves energy 50→75 and points 225→275, one 50-point ledger entry, replay pays zero, refresh preserves completion/pet, phone/desktop checked; all 210 tests pass and build OK. Not published; existing CookieYes localhost warning is unrelated.

# Biblical Snap (retired)
- [x] Add signed-in stage modal, server-validated first-to-3 rounds and daily +25 Energy/+50 Points reward.
- [x] Verify victory verse, companion, replay protection and phone/desktop play using isolated QA data: first victory saved 25 energy and exactly one 50-point credit; later wins were practice only; 25 tests pass, build OK. Not published. Existing CookieYes localhost warning remains unrelated.

# Companion pet readiness
- [x] Repair six clothing looks with eight-angle art, independent slots, account wardrobe saving and equip toasts; 50 tests pass and all six equip/reload flows verified with isolated QA inventory, then restored. Carl's account untouched; not published.
- [x] Verify saved equip/unequip, account-safe loading, clothing coexistence and requested toast with separate QA data: 12 tests pass, live equip/unequip/reload and home/Pet Shop rendering checked, reduced motion respected, points unchanged at 175. Not published.

# Formidable jigsaw
- [x] Add a fifth, harder 7×7 Formidable level with unique artwork, sequential unlock and verified game rewards; preserve existing earned shop gifts.
- [x] Verify level selection, 49-piece completion and +1 energy/+5 points on the separate QA account; 25 tests pass and mobile has no horizontal overflow.

# Habitat pricing
- [x] Raise paid habitat prices by 20%: Beach Bungalow 540, Cozy Bedroom 720; verified live purchase-function prices, unchanged ownership guard, shop display and 12 passing purchase tests without altering accounts.

# Public-page sitemap
- [x] Install router-derived sitemap with explicit public/private route decisions and canonical origin.
- [x] Verify XML, exclusions and tests.
- [ ] Publish and verify the hosted sitemap (user publication action required).

# Agent integrations
- [x] Activate OAuth and add caller-scoped account status and catalog MCP tools.
- [x] Preserve sign-in/sign-up consent returns; verify missing/invalid authorization errors, real provider approval/denial and OAuth-authenticated account reads on the separate QA account. Local browser tests bridge the approved production origin; hosted end-to-end verification requires republishing.
- [x] Add browser-local header read/navigation tools; verify registrations and journal navigation with test browser support. Generate the two-tool MCP manifest; 161 regression tests pass and build OK.
- [ ] Republish and verify the hosted assistant connection (user publication action required).

# Monere conversational knowledge
- [x] Broaden initial and follow-up answers beyond dilemmas; retain Christian guidance, honest uncertainty and safety.
- [x] Render readable answer formatting and include accurate platform guidance without changing access rules or AI models.
- [x] Verify general knowledge and follow-up answers using isolated test data: Moon phases and membership/care guidance render as readable lists, 10 focused tests pass, no browser errors, build OK.

# Stripe production launch
- [x] Configure the user-supplied public live Stripe.js key for production only; keep active live API and webhook secrets managed, never use abbreviated secret placeholders.
- [ ] Complete Stripe readiness check in Payments (user action).
- [ ] Restore monereai.com domain setup and publish (domain setup currently failed; app unpublished).
- [x] Prepare same-origin home payment return; 12 focused tests pass, preview home/shop load without errors. Production token and managed live API/webhook secrets confirmed configured. Real live payment remains unverified until readiness, domain setup and publishing finish.

# Mini-game rewards and Club Space Station
- [x] Verify replay-safe +1 energy/+5 points wins and immediate header updates: two Find rounds and a solved Jigsaw checked on a dedicated QA account; duplicate completion pays zero. Verify 20/40/60 daily claims and repeated-claim rejection on that account.
- [x] Enforce Club-only Space Station, including previously owned copies; verify locked upgrade previews, Club equip, floating topics and character interactions on desktop/phone.
- [x] Keep protected floating admin/tester controls, fill energy and live Free/Plus/Club switching without touching paid subscriptions; 144 tests pass, no runtime errors, Carl's account untouched.

# Legacy UI cleanup
- [x] Remove Super Snack controls and feed bars from games and store; preserve active energy rewards and daily claims.
- [x] Remove legacy Customise Monere button/modal and unused code; preserve current store equipment and properties.
- [x] Verify cleanup with isolated browser data and 65 passing tests; owned clothing equips and persists after reload, no account changes, preview builds clean.

# Membership confirmation before payment
- [x] Add Plus and Club upgrade confirmation with selected billing price and initial points/tokens; continue to existing Stripe payment only on confirmation.
- [x] Verify cancellation makes no payment request, confirmed selection opens the correct checkout, and existing verified-payment wallet synchronization remains intact: 8 focused tests pass; isolated desktop/phone browser checks pass. No real payment made or Carl account changes.

# Equipped clothing while turning
- [x] Keep all equipped slots visible through all eight angles using one composed character picture; verified full turns and reset on home and shop with isolated clothing data, no account changes, and 26 passing tests.

# Monere centring
- [x] Centre-lock wheel and pinch zoom and remove interactive sway; verified wheel zoom, turning and reset in an isolated browser, with 11 character tests passing.

# Uploaded economy brief
- [ ] Add protected canonical account wallet fields and server-maintained tier, preserving existing credits and spending.
- [ ] Replace automatic full-energy payouts with manual daily claims and +1 energy rewards.
- [ ] Verify membership grants, immediate wallet refresh, and authenticated reward replay protection.

# Pet care economy
- [x] Award a one-time free Points Shop item after all four jigsaw levels; verified all puzzles, inventory persistence, unchanged spending/outfit, and replay protection.
- [x] Save replay-safe +1 Energy per Mini-Monere find and verify the home energy bar updates (50→51, persisted after reload).
- [x] Store account energy, passive drain, daily claims, separate tokens, and replay-safe game rewards.
- [x] Show home energy/mood bar and daily reward action; add token-priced Super Snack in shop.
- [x] Replace Find/Jigsaw payouts with 15 energy and 5 points per win.
- [x] Test exact rules and verify signed-in care/game/shop flows.
- [x] Tokens funded by verified Plus and Club membership grants.

# MonereAI branding
- [x] Add a wide tablet/desktop workspace with collapsible navigation and quick actions, preserving the phone layout.
- [x] Verify navigation, sidebar collapse, and scrolling on phone, tablet, and desktop.
- [x] Update shared header, emblem, tagline, and footer link.
- [x] Update color tokens, page metadata, favicon, and advice/share branding.
- [x] Verify branding on every app page.

# Monere digital mentor
- [x] Add and verify main-character drag rotation, wheel/touch pinch zoom, and reset controls.
- [x] Add animated CGI-style lion artwork to Home, loading, and results.
- [x] Reframe intros, actions, advice cards, and mentor voice.
- [x] Add subtle themed motifs and verify advice and journal flow.

# Monere Plus
- [x] Add monthly £2.99 and annual £24.99 products with checkout.
- [x] Apply cancellation, renewal plan-switch, and 7-day trial rules.

# Wardrobe expansion
- [x] Create and optimize all 80 outfit combinations.
- [x] Add category tabs, live preview, equipped states, and saved item selections.
- [x] Verify wardrobe behavior on a phone-sized screen.

# Profile-tailored guidance
- [x] Add Young Man / Young Woman selection to onboarding and persist it.
- [x] Tailor Monere's advice prompt and response framing to the selected profile.
- [x] Add warm, respectful boundary guidance for questions outside the male/female framework.
- [x] Verify onboarding and personalized advice behavior.

# Where's Monere? game
- [x] Show and verify a +1 Energy notification for each new Mini-Monere found (round payouts unchanged).
- [x] Add hidden-object scenes, zoom/pan search, hint, celebration, Wisdom Points, and badge.
- [x] Remove the on-screen timer and rename the tab to "Find Monere" in all five languages.
- [ ] Translate the game screen copy (currently English only).
- [ ] Confirm the victory chime on a real phone with sound on.

# Payment window scrolling
- [x] Cap the upgrade window at 90% viewport height with smooth vertical touch scrolling.
- [x] Keep the trial button sticky and add bottom safe-area spacing.
- [x] Verify plan selection and footer access on a short phone screen.
- [x] Confirm checkout redirects to Stripe's hosted page; no embedded iframe needs resizing.

# Safety bar on payment screens
- [x] Hide the "In crisis or feeling unsafe?" floating bar on /payment-success and while the upgrade window is open.
- [x] Verify the bar still shows everywhere else and returns after closing the upgrade window.

# Points Shop
- [x] Keep shop purchases visible to signed-out visitors with sign-in links; verify Stripe monthly/yearly rendering and retry regression tests.
- [x] Verify the Stripe checkout window in the signed-in shop and that all shop wording says Stripe, not PayPal.
- [x] Unify personal and shop balances including habitat spending; verify the 1030-point case and habitat purchase.
- [x] Keep habitat Buy Now buttons active and verify Cozy Bedroom/Space Station purchase and point-shortfall feedback.
- [x] Match clothing combination purchase buttons to inventory buttons and verify active purchases and insufficient-points feedback.
- [x] Verify clean base artwork, slot swapping, and saved equipment migration.
- [x] Keep equipped clothing mounted with the character across rotation and zoom; verify with equipped items.
- [x] Apply and verify the shared Monere spin, zoom, and reset controls in the shop.
- [x] Link Where's Monere? points to one wallet and sell hats, glasses and costumes.
- [x] Expand the hat library to 10 hats with fresh artwork and tiered prices.
- [x] Verify buying, equipping and Monere wearing items on default and alternate outfits.
- [ ] Translate the shop copy (currently English only).
- [ ] Sync points and purchases to the account so they follow a user between devices.

# Costume library
- [x] Add complete clothing combination pictures and preserve selections by category, turn-around, zoom, purchases and points.
- [x] Verify combination selection and persistence in the shop and home.
- [x] Create complete character variants for every inventory item, with matching turn-around views and no accessory overlays.
- [x] Equip one complete look at a time, preserving purchases and the existing viewer; test swapping, zoom, spin, and persistence.
- [x] Expand the costume library to 12 costumes with fresh artwork and tiered prices.
- [x] Verify buying, equipping and Monere wearing a cape on default and alternate outfits.

# Story Mode
- [x] Add a Story Mode tab with four theme cards: Space Adventure, Mystery Detective, Magical Kingdom, Time Traveler.
- [x] Build the interactive narrator engine: short 2-3 sentence turns with 2-3 choices, Monere as companion in the story.
- [x] Present choices as large, easy-to-tap buttons and verify a full story turn on a phone-sized screen.
- [x] Replace the four-story menu with one Weekly Interactive Adventure banner and a Monday episode rotation.
- [x] Show each chapter's illustration at the same time as its text, capping the wait at 10 seconds before using the matching backup picture.
- [x] Play a short chime when a new chapter is chosen, sharing one chime helper with the game.
- [x] Play a fuller finish fanfare when this week's adventure reaches its Chapter Complete screen.
- [ ] Translate the weekly banner and finale copy (currently English only).

# The Treehouse
- [x] Keep a single Monere on the home screen with the faded treehouse behind him.
- [x] Make the treehouse picture larger behind Monere.
- [ ] Translate The Treehouse greeting (currently English only).

# Points Shop sign picture
- [x] Create a gold "Points Shop" signboard picture and use it in place of the shop title text.
- [x] Show the sign in the side quick-actions panel instead of the "Points Shop" text link.
- [x] Make the sign banner larger on the shop page and in the side panel.

- [x] Stripe: Monere Club £4.99/mo subscription (250 pts + 75 tokens/month), server-verified.
- [x] Stripe: Point Packs — Pocket 250/£1.99, Popular 600/£3.99, Mega 1,000/£7.99; server-verified capture.
- [x] Payment containers marked data-no-one-link, click hijack guard
- [x] Two-tier membership screen: Plus £2.99/mo|£24.99/yr + Club £4.99/mo|£44.99/yr via Stripe; status plus|club.
- [ ] Club exclusive subscriber-only outfits (needs outfit designs)
- [x] Stripe price keys live in src/lib/store-config.ts (plus_monthly/yearly, club_monthly/yearly, pack ids); paypal-config.ts removed.

## Batch updates (done 2026-10-16)
- [x] Draw and display the four missing combination card pictures: Storm Viking, Party Star, Galaxy Voyager, Dapper Pirate; verified in the signed-in shop.
- [x] Home canvas: welcome banner "Welcome to MonereAI! Choose an option to begin."
- [x] Image backgrounds: verified all character/item art is transparent cutouts; MonereFigure falls back to default look if art missing
- [x] "Get Monere Plus" on home now links straight to the Points Shop Stripe memberships (no passcode popup)
- [x] Story Mode tab removed from navigation (route file kept)
- [x] Shop expanded: +8 items (party hat, viking helmet, star shades, pirate coat, astro suit, rain boots, rocket boots, shell necklace) — 44 total
- [x] Where's Monere: +2 scenes (Seaside Cove, Castle Courtyard) — 6 maps
- [x] Jigsaw: Crazy Hard 6x6 (36 pieces) added, unlocks after Hard
- [x] Combinations: +4 families (Storm Viking, Party Star, Galaxy Voyager, Dapper Pirate) — 8 total

# Small shop graphic
- [x] Replace the side-panel Points Shop banner with a small shop storefront graphic under the left navigation.
- [x] Fix page crash: the header language selector referenced a variable removed while swapping the banner.
- [x] Verify the graphic, collapsed nav, localized label, shop page heading, and that the page loads without crashing.
- [x] Move the shop graphic to the right-hand panel and enlarge it 5x (36px to 180px); verified size, alignment, and no clipping.

# Compact point packs & memberships
- [x] Shrink the point pack and membership cards (tighter padding, smaller headings/prices/perks, smaller badges and billing toggle) while keeping every line readable.
- [x] (Superseded — PayPal removed, its button-clipping CSS deleted with it.) Slim the old PayPal checkout buttons from 40px to 34px tall, clipping only the "Powered by PayPal" attribution row.
- [x] Verify in the preview: panel 598px to 450px signed out (550 to 502 signed in), pack cards 178 to 122 (199 to 175), membership cards 294 to 223 (246 to 222), no cut-off or overlapping text, build clean, all 132 tests pass.

# Combinations by value
- [x] List clothing combinations cheapest set first, by the combined cost of their three pieces.
- [x] Verify in the preview: 800, 860, 940, 970, 1040, 1240, 1250, 1470 pts in order; all 8 combinations still listed once, build clean.
- [x] Raise every combination price by 25% (rounded up to the nearest 5 points): 1000, 1075, 1175, 1215, 1300, 1550, 1565, 1840 pts; verified in the preview and by tests.

# Header token chip removed
- [x] Take the tokens counter out of the header panel; the points balance, language picker, membership badge and sign-in controls stay.
- [x] Verify signed in (carlhillyard@icloud.com): header shows 1635 pts, no token chip or lightning icon; snack tokens still work in the shop.

# Header energy chip
- [x] Put Monere's current energy level in the header where the token counter was, reading the same account energy as the care bar.
- [x] Verify signed in: chip matches the care bar (0% at energy 0, then 50% after feeding a Super Snack), shows on every page, hidden when signed out, build clean.
- [x] Enlarge the energy chip (16px text, 20px symbol, 34px tall vs the 12px points chip) and replace the heart with a lightning bolt; verified in the preview.
- [x] Animate the marker whenever energy is added: the chip pops (scale 1.12) with an amber glow and floats the amount gained ("+50", "+10" — the real difference) for 1.8s; nothing fires on page load, the hourly drain, or a refresh that changes nothing. Verified in the preview after Super Snacks; reduced-motion users get a still badge that fades out.
- [x] Widen the spacing between header markers (4px to 12px on wide screens) so the popped chip keeps clear space from the points chip and language picker; measured 5.8px clear on both sides mid-animation, no text obscured.

# Find Monere panel size
- [x] Enlarge the Where's Monere? picture panel by 5% (105% width, centred) while keeping the rest of the page at its normal width.
- [x] Verify in the preview at 1280, 820 and 390 px: panel exactly 1.05x its column, all 10 Mini-Moneres still inside the picture, no side-to-side page scrolling, no clipping, build clean.

# Mobile hamburger menu
- [x] Add a menu button to the phone header that opens a side panel listing every page, keeping the bottom tab bar.
- [x] Remove Story Mode from that panel's page list; the panel now reads Seek, Daily, Journal, Find Monere, Jigsaw, Points Shop, then sign in/out.
- [x] Verify in the preview at 393x818: panel opens, lists the six pages with no Story Mode entry, closes on pick, build clean.

# Treehouse illustration visibility
- [x] Raise the treehouse picture behind Monere on the main page from 20% to 50% (60% and a touch bigger on phones) so the house, lanterns, window and ladder read clearly.
- [x] Keep the topic buttons and the "Tap up to 3 topics" pill readable over the brighter picture (firmer button fill, stronger blur, solid pill background).
- [x] Verify in the preview at 1284 and 393 px wide: illustration clearly more visible, all labels legible, no page errors, build clean.

# Crisis bar off phones
- [x] Remove the floating "In crisis or feeling unsafe?" bar from phone and tablet layouts so it no longer covers the chat box; keep it in the desktop side navigation and move the entry into the phone menu panel.
- [x] Verify at 390x844: no crisis bar anywhere on the page, the chat text box is the topmost element at its centre and fully clear of the bottom tabs, and the menu panel still opens the Safety & Support helplines.


# Biblical Snap in the main menu
- [x] Add a Biblical Snap entry to the side navigation and the phone menu panel, opening the game from the home page; closing it clears the address.
- [x] Verify in the preview at 1280 and 390 px: the link appears with the other menu items, opens the game window, and the address returns to normal after closing; 210 tests pass, build clean.

# Legendary pets: Thunderbird & Phoenix
- [x] Add Thunderbird and Phoenix to the Pet Shop Legendary section at 3,000 pts each, with matching artwork and a server-side price entry.
- [x] Verify the Legendary tab shows exactly Baby Dragon, Unicorn, Thunderbird, Phoenix at 1280px; 237 tests pass, build clean, live purchase check confirmed at 3,000. Not published.

# Connie's 80's arcade mini-game (second scroll prize)
- [x] After all 3 apples are delivered to Connie, open a NEW 80's-style arcade mini-game (fruit catcher — NOT the barrel game); prize is the second (wood) scroll.
- [x] Pure deterministic rules module + Phaser dialog, server-verified rounds/commit mirroring garden_barrel_*, guest display-only path.
- [x] Migration for connie_arcade_rounds + start/commit RPCs granting "wood" scroll idempotently; tests; update AGENTS.md + memory.

# Seeds in Meadow, apples in Lonely Wood
- [x] Hide Vernon's 3 magic seeds around the Meadow starting area (4,14 / 18,8 / 12,26); update his ask text.
- [x] Hide Connie's 3 rosy apples around Lonely Wood (13,11 / 5,8 / 19,16); update her ask text.
- [x] Keep per-land scroll+riddle gates unchanged; patch both treasure_v5_action and treasure_v6_action item coordinates live.
