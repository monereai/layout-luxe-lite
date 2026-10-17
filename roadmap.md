# Legacy UI cleanup
- [x] Remove Super Snack controls and feed bars from games and store; preserve active energy rewards and daily claims.
- [x] Remove legacy Customise Monere button/modal and unused code; preserve current store equipment and properties.
- [x] Verify cleanup with isolated browser data and 65 passing tests; owned clothing equips and persists after reload, no account changes, preview builds clean.

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
- [x] Restore visible PayPal purchase options; verify signed-out sign-in links, actual SDK monthly/yearly rendering, and retry regression tests.
- [ ] Verify PayPal checkout in the signed-in shop — blocked pending an authorized preview session.
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

- [ ] PayPal: MonereAI Club £4.99/mo subscription (1,000 pts/month + monthly outfit), server-verified (blocked: PayPal client ID + plan ID)
- [x] PayPal: Point Packs — Pocket 250/£1.99, Popular 600/£3.99, Mega 1,500/£7.99; server-verified capture (blocked: PayPal credentials)
- [x] Payment containers marked data-no-one-link, click hijack guard
- [ ] Two-tier membership screen: Plus £2.99/mo|£24.99/yr (250 pts/mo, unlimited Story) + Club £4.99/mo|£44.99/yr (1,000 pts/mo, exclusive outfits, BEST VALUE); status plus|club (blocked: PayPal plan IDs)
- [ ] Club exclusive subscriber-only outfits (needs outfit designs)
- [ ] Paste 4 PayPal plan IDs into src/lib/paypal-config.ts (blocked: user)

## Batch updates (done 2026-10-16)
- [x] Draw and display the four missing combination card pictures: Storm Viking, Party Star, Galaxy Voyager, Dapper Pirate; verified in the signed-in shop.
- [x] Home canvas: welcome banner "Welcome to MonereAI! Choose an option to begin."
- [x] Image backgrounds: verified all character/item art is transparent cutouts; MonereFigure falls back to default look if art missing
- [x] "Get Monere Plus" on home now links straight to the Points Shop PayPal memberships (no passcode popup)
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
- [x] Slim the PayPal checkout buttons from 40px to 34px tall, clip only the "Powered by PayPal" attribution row (both the PayPal and Debit or Credit Card buttons stay), and match the sign-in prompt.
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
