# Character art, wardrobe & shop rules

- Keep current equipment in the existing shop state and render it through MonereFigure; CategoryPicker's interactive flag controls only the character viewer. Why: retiring the old customization drawer must not remove purchases or rotation.
- Keep complete shop-look frames under public/monere/looks and render one image in MonereFigure; compose unmatched equipped slots into that image from angle-matched art. Why: clothing must not vanish when turning or become front-facing DOM overlays.
- Register full-canvas accessory turnaround layers in character-art and store all eight frames under public/monere/layers; rear glasses frames hide lenses behind the mane. Why: new eyewear fits each angle while preserving other clothing.
- Keep single-view combination card artwork separate from turnaround-frame availability. Why: a new thumbnail must not replace the working spin viewer with missing angles.
- Share clothing-button sizing between combination cards and individual inventory cards in the shop. Why: purchase and equip controls must stay consistent and fit their cards.
- Keep home and Points Shop rotation/zoom on the existing MonereCharacterView parent. Why: complete images share the same turn-around interaction without flattening.
- Anchor character zoom to the viewer centre and do not translate on pinch gestures. Why: scrolling and turning must not drift Monere off-centre.
- Keep every equipped slot when items are combined; combinationLook always returns a look (exact combo picture, else closest single-item look, else default). Migrate legacy costume into outfit and preserve owned items and spend in the existing storage key. Why: no selection is ever rejected or silently discarded.
- Persist jigsaw item ownership and its one-time claim marker together in the existing shop state; keep equipment and spending unchanged. Why: retries cannot grant extra items or overwrite the player's outfit.
- Never apply mix-blend-mode multiply to Monere's character or item cutouts; reserve the .blend-white utility for opaque pictures that actually have a white background. Why: the app canvas is dark, so multiply turns the transparent character art into a near-black silhouette.
