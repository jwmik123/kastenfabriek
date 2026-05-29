# PRD — Wasmachinekast lage kast & layout picker

## Problem Statement

Customers configuring a **wasmachinekast** today can only build a single full-height closet. In real laundry rooms the typical install is a mix: a tall closet section housing the washer/dryer next to a low cabinet whose top doubles as a **werkblad** for folding, sorting, and ironing. Without this, the configurator forces customers into one shape that doesn't match how they actually use the space, and the sales team can't sell the hybrid layouts they already build in showroom photos.

## Solution

Extend the wasmachinekast configurator with **sections**. A wasmachinekast becomes one of four **layouts** chosen up front: `high-only` (today's behavior), `low-only`, `low-left`, or `low-right`. Each layout assembles between one and two sections side-by-side on the floor:

- **Hoge kast** — full-height corpus (200–275cm + optional opzetkast), same as today.
- **Lage kast** — fixed 90cm corpus whose roof IS the customer-pickable **werkblad** (18mm or 36mm, independently colored, drawn from the same material catalogue as buitenkant).

Each section has its own width, moduleCount, and interior module layouts; depth, handle, accessories, and the buitenkant/binnenkant material remain shared at the wardrobe level. The wizard grows from 6 steps to 7 (new Layout step at position 1) and handles are split out of Materials into their own step. **Kledingkast is untouched.**

## User Stories

1. As a wasmachinekast customer, I want to pick a layout in step 1 (high-only / low-only / low-left / low-right), so that I can express my real laundry-room shape before I start sizing.
2. As a customer, I want the four layout options shown with visual previews, so that I can recognize the shape I want without reading text.
3. As a returning customer, I want `high-only` to be the default for a fresh config, so that the existing single-closet flow is unchanged for me.
4. As a customer building a hybrid layout, I want to set the hoge kast and lage kast widths independently in the Afmetingen step, so that I can match an asymmetric wall.
5. As a customer building a hybrid layout, I want depth to be shared across both sections, so that they line up against the wall.
6. As a customer, I want a wasmachinekast to enforce a minimum depth of 85cm regardless of layout, so that a washer or dryer always fits.
7. As a customer adding a lage kast, I want its height fixed at 90cm, so that the werkblad lands at a usable counter height.
8. As a customer, I want a lage kast to always include a werkblad as its roof, so that I get a usable counter surface by default.
9. As a customer, I want to choose between 18mm and 36mm werkblad thickness, so that I can match my budget and stylistic preference (no price difference).
10. As a customer, I want to pick the werkblad material independently from the cabinet exterior, so that the counter can contrast or match as I wish.
11. As a customer, I want the werkblad material card to appear in the Materiaal step only when my layout has a lage kast, so that the UI doesn't show options that don't apply.
12. As a customer, I want to choose whether the washer/dryer GLBs go in the hoge kast or the lage kast (not both), so that I can mock up under-counter washer setups.
13. As a customer, I want the Wasmachine step to come before the Modules step, so that I place the appliance first and then arrange the rest of the indeling around it.
14. As a customer, I want the Modules step to show a section toggle (Hoge / Lage) when both sections exist, so that I can fill in each section without confusion.
15. As a customer, I want each section's module picker to only show GLBs that physically fit that section, so that I can't accidentally place a hanging rail in a 90cm box.
16. As a customer, I want per-slot module material overrides to work inside each section independently, so that I can highlight specific bays in either section.
17. As a customer, I want handles to be picked in a dedicated step (Handgrepen) after Materiaal, so that handle and grip choices feel like a distinct decision rather than buried in materials.
18. As a customer, I want one handle pick to apply across both sections, so that the wardrobe reads as one piece of furniture.
19. As a customer, I want `doorsExtendToFloor` to apply to doors in both sections, so that the look is consistent.
20. As a customer, I want accessories to be picked once at the wardrobe level (not per section), so that I'm not double-counting.
21. As a customer with a `low-only` layout, I want accessories that don't fit a 90cm cabinet to be hidden, so that I'm not offered impossible options.
22. As a customer switching between `low-left` and `low-right`, I want my configured sections preserved (mirrored), so that I don't lose work.
23. As a customer switching from `high-only` to a layout that adds a lage kast, I want the new section auto-populated with sensible defaults, so that I'm not stuck filling in everything from scratch.
24. As a customer switching from a multi-section layout to `high-only` or `low-only`, I want a confirm dialog warning me that the removed section's config will be discarded, so that I don't accidentally throw away work.
25. As a customer, I want each section to render as its own physical shell (own side walls, own roof, own plinth) in the 3D scene, so that the preview matches what the carpenter will actually build.
26. As a customer, I want adjacent sections to touch (no gap), so that the wardrobe reads as one continuous installation.
27. As a customer, I want the room scene and camera to remain centered on the whole wardrobe regardless of layout, so that the preview doesn't jump when I switch layouts.
28. As a customer with a saved cart from before this feature shipped, I want my old wasmachinekast config to load correctly, so that I don't have to start over.
29. As a customer, I want the pricing panel to show a single total that correctly sums both sections plus the werkblad, so that I trust the price.
30. As a customer, I want the WasherStep to remain reachable even when no washer GLB fits my current section choice, but with a clear empty state, so that the wizard navigation stays predictable.
31. As a sales/admin user, I want existing wasmachinekast carts (saved before this release) to map to `high-only` automatically on restore, so that no manual migration is needed.
32. As a Sanity editor, I want a `sectionType` field on `moduleLayout` documents so I can mark a GLB as high-only, low-only, or both, so that the configurator filters correctly.
33. As a Sanity editor, I want an `availableForLowSection` boolean on `accessory` documents, so that I can hide accessories that don't apply to 90cm cabinets.
34. As a developer maintaining kledingkast, I want zero changes to the kledingkast configurator from this feature, so that an unrelated configurator is not destabilized.

## Implementation Decisions

### Domain model

- A wasmachinekast carries `layout: 'high-only' | 'low-only' | 'low-left' | 'low-right'`, `highSection: Section | null`, `lowSection: Section | null`, and `washerSection: 'high' | 'low' | null`. Default `layout` for a fresh config is `'high-only'`.
- `Section` carries its own `width`, `height`, `moduleCount`, `modules[]`, and (low-section only) `topPanelThicknessMm: 18 | 36` and `countertopMaterialId`.
- Lage kast height is fixed at 90cm. Hoge kast height range is unchanged (200cm to maxHeight, plus opzetkast).
- Depth is shared across sections. Wasmachinekast minimum depth bumps from 65cm to **85cm** globally; existing carts with depth < 85cm clamp up on restore.
- Slope (schuinte) is formally out of scope for wasmachinekast — no UI, no surcharge, no state. Codified in `CONTEXT.md`.
- The werkblad **IS the roof** of the lage kast (single physical panel, no separate slab). Flush with the corpus on all sides — no overhang. Always present.
- 18mm vs 36mm werkblad has no price difference.
- Werkblad material is picked from the existing buitenkant material list (no new Sanity document type).

### Layout transitions

- Mirror swap (`low-left ↔ low-right`) preserves both sections unchanged — only the X-order flips.
- Adding a section (e.g. `high-only → low-left`) creates a fresh lage kast with default values via `wasmSectionDefaults`: width mirrors the existing hoge kast width (or 120cm if there is no hoge kast), moduleCount 2, height 90cm, `topPanelThicknessMm: 18`, `countertopMaterialId` copied from `buitenkantMaterialId`, empty modules with `hasDoor: true`. No prompt.
- Removing a section (any transition to `high-only` or `low-only` that drops a populated section) shows a confirm dialog and discards the dropped section on accept.

### Pricing

- Existing `PricingEngine` is reused unchanged. The new `wasmSectionPricing` module computes `priceSection(highSection) + priceSection(lowSection) + werkbladPrice + sharedCosts + accessoryCosts`. A `null` section contributes 0.
- Werkblad price = lowSection width × depth × per-cm² rate from the chosen buitenkant material. Thickness does not affect price.
- `PricingEngine.determineCorpusType` (single/double width) is applied independently per section.
- Accessories remain wardrobe-level (one counter for the whole wasmachinekast). When `layout === 'low-only'`, accessories with `availableForLowSection: false` are filtered out of the picker.

### Wizard step order (7 steps)

1. **Layout** (new) — four cards with visual previews.
2. **Afmetingen** — stacked panels: depth at top (shared), then hoge-kast panel (width, height, moduleCount) and lage-kast panel (width, moduleCount, werkblad thickness toggle) where applicable.
3. **Wasmachine** — new top-level toggle "Wasmachine in hoge of lage kast?" (exclusive), then per-slot placement within the chosen section.
4. **Modules (indeling)** — section toggle tabs (Hoge / Lage) when both exist; each tab shows that section's slots and the GLBs filtered by `sectionType`.
5. **Materiaal** — Buitenkant card (shared), Binnenkant card (shared), Werkblad card (only when lage kast exists). Handles removed from this step.
6. **Handgrepen** (new — extracted from Materials) — Door handle picker, handle material picker. Shared across sections.
7. **Accessoires** — wardrobe-level counters, filtered by `availableForLowSection` when applicable.

### State / snapshot

- `useWasmachinekastStore` is refactored to nested sections. Setters that touch a section's properties take a section discriminator (e.g. `setSectionWidth('high' | 'low', cm)`).
- `ClosetConfigSnapshot` (shared with kledingkast) gains optional fields: `layout`, `lowSection` (with its own width, moduleCount, modules, topPanelThicknessMm, countertopMaterialId), and `washerSection`. Top-level legacy fields (`widthCm`, `heightCm`, `moduleCount`, `modules[]`) are reinterpreted as the high section when `layout` is absent. Kledingkast ignores all new fields.
- Going forward, every wasmachinekast snapshot writes `layout` explicitly.

### Schema changes

- Sanity `moduleLayout`: add `sectionType: 'high' | 'low' | 'both'` (default `'both'`). Existing WASHER_PLANK (washer-with-shelf-above) becomes `'high'` because it needs > 90cm. Bare washer GLBs become `'both'` because an under-counter washer fits a 90cm lage kast.
- Sanity `accessory`: add `availableForLowSection: boolean` (default `true`).
- No new Sanity document types.

### 3D scene

- World origin remains floor-centered on the whole wardrobe's outer width. Layout determines X-offsets of each section group.
- Each section renders as its own `<group>` containing its own `ClosetCorpus` + `Module` instances. Adjacent side walls touch back-to-back (no merge attempt).
- Room walls (`WasmRoomWalls`) compute from total outer width, not per-section.

### Module sketch

Five new pure modules, each independently testable:

- **`wasmLayoutTransitions`** — `transition(state, nextLayout) → { nextState, requiresConfirm: boolean }`. Encodes mirror/create/destroy rules.
- **`wasmSectionDefaults`** — `defaultLowSection(highSection | null, sharedMaterials) → Section`.
- **`wasmSectionPricing`** — `priceWasmachinekast(state) → { high, low, werkblad, shared, total }`.
- **`wasmSnapshotMigration`** — `restore(snapshot) → state` (handles legacy + new) and `serialize(state) → snapshot`.
- **`wasmModuleLayoutFilter`** — `filterForSection(layouts, section) → layouts` using `sectionType`.

Modified surfaces (not deep modules): `useWasmachinekastStore`, `WasmachinekastScene`, `WasmachinekastCanvas`, `StepWizard`, all step components (one new `LayoutStep`, one new `HandgrepenStep`, four reworked).

## Testing Decisions

Tests target **external behavior** (inputs → outputs and observable state changes), never internal implementation. Each of the five deep modules above is unit-tested in isolation:

- **`wasmLayoutTransitions`** — table-driven cases covering all 16 layout-pair transitions. Assert correct preserve/create/destroy outcomes and `requiresConfirm` flag. Prior art: [app/(configurator)/kledingkast/__tests__/store.test.ts](app/(configurator)/kledingkast/__tests__/store.test.ts) for store-level behavior testing.
- **`wasmSectionDefaults`** — given various existing high-section widths, assert the produced low-section width mirrors correctly and field defaults match spec. Trivial but pinned.
- **`wasmSectionPricing`** — frozen-snapshot tests for representative configurations (high-only, low-only, low-left with mixed widths, both with washers). Compare against expected totals. Prior art: existing pricing test files under [lib/configurator/](lib/configurator/) (if any) or first-of-its-kind here.
- **`wasmSnapshotMigration`** — fixture-based tests with hand-rolled legacy snapshots (pre-feature) and new-format snapshots. Assert `restore(serialize(state)) === state` round-trip for new format, and that legacy snapshots map to `high-only` state correctly with depth clamped to 85.
- **`wasmModuleLayoutFilter`** — small fixture of layouts with mixed `sectionType` values; assert filter produces the right subset for each section. Trivial but pinned.

UI step components, scene rendering, and store setters are verified manually against the dev server. Existing tests for shared infrastructure ([app/(configurator)/wasmachinekast/__tests__/store.test.ts](app/(configurator)/wasmachinekast/__tests__/store.test.ts), `validateHandleMaterial`, etc.) must continue to pass.

## Out of Scope

- Kledingkast changes of any kind. Kledingkast remains a single-corpus configurator.
- Slope (schuinte) on wasmachinekast — explicitly removed even as a future option.
- Sections beyond two. No "high + low + high" three-section arrangements.
- Per-section depth. Depth stays shared.
- Per-section buitenkant/binnenkant material picks. Each is one global pick.
- Per-section handle picks. One handle for the whole wardrobe.
- Separate countertop material catalogue. Werkblad reuses the buitenkant material list.
- Werkblad overhang. Flush only.
- Pricing differences between 18mm and 36mm werkblad.
- Per-module accessory placement.
- Sanity migration scripts for existing `moduleLayout` documents (manual one-off editorial assignment of `sectionType` values is acceptable; default `'both'` keeps unchanged docs valid).
- DB migration of stored carts. M1 (extend snapshot with optional fields, interpret legacy top-level as high section) means no DB write is needed.
- A separate `lage-kast-only` SKU or product page. Layout is picked inside the existing wasmachinekast flow.

## Further Notes

- Glossary terms (`Section`, `Layout`, `Werkblad`, `Washer section`, module-layout `sectionType`) are recorded in [CONTEXT.md](CONTEXT.md).
- The two-corpus-per-wardrobe decision and its rejected alternatives are recorded in [docs/adr/0001-wasmachinekast-sections.md](docs/adr/0001-wasmachinekast-sections.md).
- Default washer-GLB `sectionType` assignments in [moduleLayouts.ts](app/(configurator)/wasmachinekast/moduleLayouts.ts): WASHER_SINGLE and WASHER_DOUBLE_GLB become `'both'`; WASHER_PLANK becomes `'high'` (needs > 90cm clearance).
- The next step is splitting this PRD into independently-grabbable vertical-slice issues via `/prd-to-issues`.
