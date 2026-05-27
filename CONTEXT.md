# Context — bouw-je-kast

Single-context repo. Wardrobe configurator. Terms below are canonical — use exactly as defined.

## Glossary

### Corpus
The **outer shell** of one wardrobe — back wall, side walls, roof, plinth. One wardrobe = one corpus. Rendered by [`ClosetCorpus.tsx`](app/(configurator)/_shared/three/ClosetCorpus.tsx). Sloped side/back walls (brief §3.3, §3.4) and side-panel thickness (brief §3.2) are corpus-level concerns.

The client brief uses "corpus" to mean what this codebase calls **module** (see below). When translating the brief, mentally substitute: client "corpus" → codebase "module".

### Module
A single interior bay inside the corpus — one vertical column of the wardrobe. The corpus is divided horizontally into `moduleCount` modules of equal width. Each module hosts one **module layout** (shelves / hanging rail / drawers) chosen via `ModuleSlot.layoutId`. Rendered by [`Module.tsx`](app/(configurator)/_shared/three/Module.tsx).

Module width is bounded by `pricingConfig.constraints.singleCorpus` (15–65 cm today). **Note the schema misnomer:** `singleCorpus` / `doubleCorpus` actually constrain a *module*, not the corpus shell. [`PricingEngine.determineCorpusType`](lib/configurator/pricing-engine.ts) is similarly mislabeled — it classifies a module's width as single or double. Treat these schema names as legacy; do not rename without a coordinated migration of Sanity documents.

More modules = more revenue. The brief's "extra corpus at 50/100 cm" maps to `setModuleCount`.

### Slot
A positional index for a module inside the corpus (`ModuleSlot.slotIndex`, 0-based, left to right). Each slot holds one module. A slot can `span: 2` — one wide door covering two adjacent modules visually — but the underlying module count is unchanged.

### Schuinte / Diagonal / Slope
Three names, one concept. Canonical English term: **slope**. Canonical Dutch: **schuinte**. Avoid "diagonal" in customer-facing copy (it is a code-internal term — `diagonalSide`, `DiagParams`).

Three slope variants exist:
- **Left slope** — sloped panel on the left side of the wardrobe.
- **Right slope** — sloped panel on the right side.
- **Back slope** — sloped back wall (`backDiagonal` in store).

"Start height" = the vertical position where the slope begins cutting into the rectangular envelope (cm from floor).

### Handle (greep / handgreep)
A physical door pull. Defined in Sanity `handle` documents. Customer picks one `handleId` per wardrobe today (global, not per-door). A handle has an `allowedMaterials` list (chrome, zwart, goud, …) that restricts which metal finish the customer can pair with it.

### Top cabinet (opzetkast)
A secondary cabinet stacked on top of the main wardrobe when total height > 275 cm. Pricing/dimension constraints live under `pricingConfig.constraints.topCabinet`. Driven by `useClosetStore.needsTopCabinet()`.

### Placement type
`'ingebouwd'` (built-in, can have slopes) or `'vrijstaand'` (free-standing, slopes forced off). Stored on `useClosetStore.placementType`.

### Accessory
Priced add-on customer toggles in step "Accessoires" (extra shelf, pull-out rail, WCD/Prado 2.0, side panels, …). Sanity `accessory` document. Two pricing modes: `perUnit=true` (priced per item) or `perUnit=false` (priced per module — note schema field is `maxPerCorpus` but the unit is actually a module, per the schema misnomer above).

Accessories are quantity-toggled at the wardrobe level (one counter for the whole wardrobe), not per module. The "extra shelf" accessory is *not* rendered in the 3D scene — pure pricing line item. Per-module placement of shelves is potential future work.

### Surcharge
Conditional price additions tied to wardrobe configuration, **not** customer-toggleable. Live in `pricingConfig` (e.g. `slopedBackWallSurcharge`, `slopedSideWallSurchargePerSide`). Pricing engine applies them when the relevant store flag is set. Side-slope surcharge is **per side** (left + right = double).

### WCD / Prado 2.0
Electrical wall socket option. Customer-facing name is **Prado 2.0** (renamed from WCD). Internally still `hasPowerHole` on a slot. When enabled, the cabinet needs mains electricity behind it (same constraint applies to LED).
