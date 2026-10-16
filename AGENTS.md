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

- Keep app-wide header, emblem, tagline, and footer in AppShell so every content page shares the same identity.
- Keep breakpoint-based workspace navigation and companion actions in AppShell; content routes remain independent of device layout so phone and desktop share the same flows.
- Keep the existing journal storage key stable through rebrands so previously saved reflections remain accessible.
- Keep the reusable mentor portrait and welcome/loading/results states in MonereMentor; animate the CGI-style asset with reduced-motion support rather than duplicating character layouts.
- Premium status comes only from the is_premium database function (subscriptions + pass-code redemptions); never trust client-side tier flags for access. Why: one source of truth across devices.
- Keep the wardrobe selection as one local-storage object with top, headwear, and footwear IDs while exposing a compatible outfit image object to character consumers. Why: combinations persist without duplicating character rendering logic.
- Serve the combo outfit art from public/wardrobe as plain URLs, never as eager module imports. Why: one failed image module blanked the whole app on load.
- Keep the onboarding profile in a dedicated local-storage module and send only its validated enum to advice functions. Why: one profile choice consistently tailors initial and follow-up guidance.
- Register the service worker only through src/lib/pwa.ts (blocked in dev, preview and iframes); vite-plugin-pwa writes sw.js into dist/client. Why: stale caches must never break previews.
- Keep complete shop-look frames under public/monere/looks and render one image in MonereFigure, with no accessory layers. Why: each selected item forms one cohesive character at every angle.
- Keep single-view combination card artwork separate from turnaround-frame availability. Why: a new thumbnail must not replace the working spin viewer with missing angles.
- Share clothing-button sizing between combination cards and individual inventory cards in the shop. Why: purchase and equip controls must stay consistent and fit their cards.
- Keep home and Points Shop rotation/zoom on the existing MonereCharacterView parent. Why: complete images share the same turn-around interaction without flattening.
- Keep every equipped slot when items are combined; combinationLook always returns a look (exact combo picture, else closest single-item look, else default). Migrate legacy costume into outfit and preserve owned items and spend in the existing storage key. Why: no selection is ever rejected or silently discarded.
- Anything purchased stays wearable forever with no further charge: combinations of owned items are free (no combo unlock fee), and shop.ts loads saved state eagerly at module init so a fast click can never overwrite purchases with the empty state. Why: paying twice or losing purchases breaks trust in the shop.
- PayPal purchases are verified server-side (paypal.functions.ts) before writing point_credits / subscriptions; the browser never grants points or tiers. Why: client approval callbacks can be faked.
- Never apply mix-blend-mode multiply to Monere's character or item cutouts; reserve the .blend-white utility for opaque pictures that actually have a white background. Why: the app canvas is dark, so multiply turns the transparent character art into a near-black silhouette.
