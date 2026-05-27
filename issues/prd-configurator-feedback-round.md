# PRD — Configurator Feedback Round

Implements the client feedback brief in [`issues/client-brief.md`](./client-brief.md). Scope covers slope behaviour, default-module pricing/proposal, accessory expansion, surcharge model, and shelf-placement bugfix. Terminology follows [`CONTEXT.md`](../CONTEXT.md).

> **Terminology note.** The client brief uses "corpus" to mean what this codebase calls **module** (a single interior bay). Wherever the brief says "extra corpus", the implementation operates on `moduleCount` / module-level state. See [`CONTEXT.md`](../CONTEXT.md) for the canonical glossary and the legacy schema misnomer (`singleCorpus` / `doubleCorpus` actually constrain a module).

## Problem Statement

Customers configuring a wardrobe in `bouw-je-kast` today hit a series of friction points:

- They cannot bring a slope start-height low enough for low-eave situations (today's floor is 100 cm).
- Sloped doors keep the handle at a fixed Y, so it floats above the door or clips the slope edge.
- Handles that physically cannot mount under a slope are still selectable.
- Widening the wardrobe past 50 cm leaves the price flat across a wide range — there is no signal that more wardrobe = more cost.
- After entering dimensions, customers see an empty wardrobe and must do setup work before they get a price or a sense of "this is mine".
- Several physically-real accessories cannot be added (extra shelves, side panels) and others have stale names/prices (WCD → Prado 2.0).
- Slope construction work is not reflected in price (sloped side and back walls).
- In tall sections (high-eave installations), the topmost shelf is silently dropped and a 60 cm void appears against the ceiling.

## Solution

A coordinated update to the configurator that:

- Lowers the slope start-height floor and guarantees a structural shelf at the slope plane for each sloped module.
- Adds a single Sanity-driven property to handles (`heightCm`) that drives both automatic handle repositioning on sloped doors and selectability gating.
- Introduces a Sanity-driven default module count that bumps the count at configured width thresholds (50 cm, 100 cm) while leaving the physical minimum and maximum unchanged.
- Generates a deterministic pre-filled wardrobe proposal as soon as the customer leaves the dimensions step.
- Extends the accessory catalogue with extra shelf, side panels at two thicknesses, and renames WCD to Prado 2.0 with the new price.
- Introduces a "surcharge" concept in pricing config that adds money for sloped construction (per side, plus back).
- Surfaces a "mains electricity required" notice whenever LED or Prado 2.0 is selected.
- Fixes the shelf-placement bug so tall straight modules fill shelves to the top, with a small fixed clearance to the roof.

## User Stories

1. As a customer with a low-eave attic, I want the slope start-height to drop as low as 30 cm, so that I can build a wardrobe that follows my actual roofline.
2. As a customer, I want a real shelf to appear at the start of the slope in every sloped module, so that the space under the slope is usable even when no normal module layout fits.
3. As a customer placing a door under a slope, I want the handle to sit at a height where it stays on the door and is reachable, so that the door looks correct and works in real life.
4. As a customer, I want handles that physically cannot mount on my sloped doors to be visually disabled in the picker, so that I cannot accidentally pick a handle that will not fit my wardrobe.
5. As a customer entering my dimensions for the first time, I want a pre-filled wardrobe to appear immediately, so that I see a working starting point and an instant price.
6. As a customer who increases the wardrobe width, I want the system to add an extra module automatically when I cross the threshold, so that the configuration feels logical and the price visibly grows.
7. As a customer who reduces the wardrobe width, I want the system to remove the extra module when I drop back below the threshold, so that the configuration stays sensible in both directions.
8. As a customer, I want to manually reduce the module count after the system bumped it up, so that I can still override the default when I have a specific layout in mind.
9. As a customer, I want to add extra shelves as a paid line item on the accessoires step, so that I get more storage without redesigning my module layouts.
10. As a customer, I want to add side panels (18 mm or 36 mm), so that my wardrobe is fully enclosed.
11. As a customer, I want to add a Prado 2.0 power socket (formerly WCD) at the corrected price, so that I can power devices inside the wardrobe.
12. As a customer selecting LED lighting or Prado 2.0, I want a clear notice that mains electricity must be available behind the cabinet, so that I do not order an option I cannot install.
13. As a customer with a sloped side wall, I want the extra construction work reflected in the price, so that the quote is realistic.
14. As a customer with a sloped back wall, I want the extra construction work reflected in the price, so that the quote is realistic.
15. As a customer with both left and right side slopes, I want the side-slope surcharge applied per side, so that the price reflects the real construction effort.
16. As a customer with a tall wardrobe, I want the topmost shelf to fill close to the ceiling, so that I do not have a large empty void above the highest shelf.
17. As a content editor, I want to edit the auto-default module thresholds in Sanity, so that I can tune pricing pressure without a code change.
18. As a content editor, I want to edit handle names, prices, and the new height field in Sanity, so that I can keep the catalogue current.
19. As a content editor, I want to add accessories with prices in Sanity, so that the configurator picks them up without a deploy.
20. As a content editor, I want to set the sloped-wall surcharges in Sanity, so that I can adjust them as supplier costs change.
21. As a developer, I want default-module-count, default-layout-proposal, and handle-fit logic isolated as pure functions, so that I can unit-test the rules without booting R3F or Three.

## Implementation Decisions

### Glossary alignment

- The codebase uses **module** for what the client calls "corpus". This is captured in [`CONTEXT.md`](../CONTEXT.md). All copy and identifiers added by this PRD use the codebase term **module**. Existing Sanity field names `singleCorpus` / `doubleCorpus` / `maxPerCorpus` are kept as legacy to avoid a Sanity migration; new code reads them but does not propagate the term.

### New deep modules (pure, isolated from R3F / Three / Zustand)

- **`defaultModuleCount`** — given a closet width in cm and an ordered list of thresholds from Sanity, returns the proposed module count. Plain function. Used in `setWidth` to bump module count when the width crosses an upward threshold, and as the initial count on first load. Manual reductions via `setModuleCount` are not clobbered: bumping fires only when widening into a higher threshold band. The physical `minModules()` / `maxModules()` derived from `singleCorpus.minWidth` / `maxWidth` remain authoritative — the default is clamped into that range.
- **`defaultLayoutFor`** — given `(slotIndex, slotWidthCm, effectiveHeightCm, totalModules)` returns a `layoutId`. Deterministic; same inputs always produce the same proposal. Fires once on transition from wizard step 1 to step 2, only when every existing module has `layoutId === null`. The rule prefers hanging-rail layouts for outer slots, drawer-stacks for middle slots, and falls back to a shelves-only layout when `effectiveHeightCm` is below the candidate layout's `minSlotHeight`.
- **`handleFit`** — exposes `canMountHandle(handle, doorCtx)` and `computeHandleY(doorCtx, handle)`. `doorCtx` carries `doorHeightAtHandle` (computed by the caller as `mirror ? leftH : rightH`) and a `SAFETY_MARGIN` constant. Pure; no R3F or Three imports. Wraps the math: `handleY = min(0.9, doorHeightAtHandle − handle.heightCm/200 − SAFETY)`; `canMount = doorHeightAtHandle ≥ handle.heightCm/100 + 2 · SAFETY`.

### Sanity schema changes

- `handle.heightCm` — number, cm. Vertical extent of the handle in real units. Required for all new handles; existing handles get a one-time backfill (Indy / Prodinter spec sheet).
- `pricingConfig.slopedBackWallSurcharge` — number, EUR. Default 1100.
- `pricingConfig.slopedSideWallSurchargePerSide` — number, EUR. Default 1100. Applied **per active side** (`diagonalSide === 'both'` yields 2 × surcharge).
- `pricingConfig.moduleCountDefaults` — ordered list of width thresholds (cm) keyed by minimum closet width. Initial seed: `[{minWidthCm: 50, count: 2}, {minWidthCm: 100, count: 3}]`. Client can edit thresholds later.
- New `accessory` documents:
  - `extra-shelf` — €45, perUnit, category interior.
  - `side-panels-18mm` — €(TBD by client), perUnit, category upgrade.
  - `side-panels-36mm` — €(TBD by client), perUnit, category upgrade.
- Existing `accessory` `power-outlet`: rename `name` to "Prado 2.0" and `nameNl` to "Prado 2.0"; price 75 → 145. No identifier change.
- `siteSettings.mainsElectricityNotice` — string. Source of truth for the §3.6 notice copy. NL + EN if site is bilingual.

### Slope geometry

- `getStartHeightRange` lower bound changes from 100 cm to 30 cm. Upper bound (`mainHeight − 20`) unchanged.
- Existing `StructuralSideKinkShelf` (module-local, stair-step shelf at slope height) is the §1.2 mechanism. Audit and fix its gating so the shelf renders for every sloped module — particularly for modules whose far edge already reaches `mainHeight` but whose wall edge is well under the slope. The brief describes shelves "not always appearing"; investigate whether the early-return at the `farEdgeX ≥ mainHeight` check is correct given §1.1's lower start heights, and adjust if needed.

### Door handle wiring

- `Door.tsx` replaces the hardcoded `handleY = 0.9` with a call to `handleFit.computeHandleY`. Door computes `doorHeightAtHandle = mirror ? leftH : rightH` and passes it in along with the selected `handle`.
- Handle picker in the materials/handle step filters or visually disables handles where `canMountHandle` returns false for any door in the current configuration (global handle, picker-level gating — there is no per-door handle override).

### Wizard flow

- On the step 1 → 2 transition (`nextStep` from step 1): if `modules.every(m => m.layoutId === null)`, call `defaultLayoutFor` for each slot and write the result into the store. Subsequent step transitions are no-ops with respect to layout proposal.
- On `setWidth`: if the new width crosses an upward threshold relative to the previous width, set module count to `defaultModuleCount(newWidth)` clamped to the physical min/max. On downward width changes, mirror the same logic so the count drops when crossing a threshold downward. Customer manual overrides via `setModuleCount` are preserved until the next *width-driven* trigger.

### Pricing engine

- Sloped-wall surcharges are added to the cart total in `pricing-engine.ts`: `+ slopedBackWallSurcharge` when `backDiagonal` is true; `+ slopedSideWallSurchargePerSide × (number of active side slopes)` otherwise. Existing accessory loop picks up the new extra-shelf, side-panel, and updated Prado 2.0 lines for free once the Sanity documents exist.

### Cart / snapshot

- `ClosetConfigSnapshot` gains `extraShelfCount: number` and `sidePanelThickness: 'none' | '18mm' | '36mm'`. Defaulted to `0` / `'none'` for old snapshots in `restoreConfig`.

### Step UI

- `AccessoiresStep`: a counter for extra shelves (0..N, no 3D rendering), a thickness selector for side panels (none / 18 mm / 36 mm), and the Prado 2.0 toggle renamed and re-priced. The mains-electricity notice renders inline when Prado 2.0 is toggled on.
- `MaterialStep` (or wherever LED is toggled): the same mains-electricity notice renders inline when LED is toggled on. Both notices read the string from `siteSettings.mainsElectricityNotice`.

### Shelf placement fix

- In `computeShelfPositions`, the "drop last shelf" condition changes from `gapAbove < spacing` to `gapAbove < MIN_TOP_CLEARANCE`, with `MIN_TOP_CLEARANCE ≈ 0.05` m. `SHELF_SPACING = 0.368` m is unchanged. This eliminates the void at the top of tall modules while keeping the original "do not kiss the ceiling" intent. The change is contained to a single pure function.

### Bug fixes covered separately

- Hinge orientation (§5.1) and bottom-hinge geometry at 80 cm (§5.2) are local geometric corrections in the hinge mesh / placement code. No data or interface changes.
- Handle colour / option corrections (§4.1 – §4.3) are pure Sanity data hygiene; the schema already supports `allowedMaterials` and `bodyColor`.

## Testing Decisions

A good test here exercises observable external behaviour through the smallest possible surface, never reaches into Zustand internals or three.js scene graphs, and survives refactors of how a value is plumbed. Prior art: [`app/(configurator)/kledingkast/__tests__/resolveElementPositions.test.ts`](../app/(configurator)/kledingkast/__tests__/resolveElementPositions.test.ts) is the model — pure-function tests over `computeShelfPositions` and `resolveElementPositions`.

The three new deep modules are unit-tested:

- **`defaultModuleCount`** — table-driven cases across width thresholds, including edge values (exactly at threshold), upward and downward crossings, and clamping into `singleCorpus.minWidth`/`maxWidth`.
- **`defaultLayoutFor`** — determinism across repeated calls; outer-vs-middle slot differentiation; fallback to shelves-only when `effectiveHeightCm` is below all candidate `minSlotHeight` values; same proposal for identical inputs across runs.
- **`handleFit`** — `canMountHandle` true/false around the boundary `doorHeightAtHandle = heightCm/100 + 2·SAFETY`; `computeHandleY` returns 0.9 on a full-height door and the lowered value on a sloped door; behaviour symmetric across `mirror`.

Regression test for §7.1 in the existing `resolveElementPositions.test.ts` (or its companion): assert that a tall straight module (e.g. `endY = 2.7`, `startY = 0`) produces a shelf within `MIN_TOP_CLEARANCE` of `endY`. The current behaviour drops it; the new behaviour keeps it.

Existing tests around `setWidth`, `setModuleCount`, `restoreConfig`, and snapshot round-trips are extended to cover the new fields (`extraShelfCount`, `sidePanelThickness`) and the new auto-bump behaviour on width change.

## Out of Scope

- Per-module handle override (one handle per door). Brief §1.4 was resolved with global-handle + picker gating.
- Per-module placement of the extra-shelf accessory in the 3D scene. The accessory is a pricing line item only in this PRD; a future PRD may add per-module 3D rendering.
- Undo / return button inside the 3D view (brief §6.1). Deferred.
- Handle pricing (brief §4.6). Awaiting client input; the Sanity field is already present.
- Final accessory list beyond extra-shelf, side-panels-18mm, side-panels-36mm. Awaiting client confirmation.
- Schema renames to fix the legacy `singleCorpus` / `doubleCorpus` / `maxPerCorpus` misnomers. Captured as known debt in `CONTEXT.md`; not addressed here to avoid a Sanity migration.
- Handle name / colour / Prodinter catalogue corrections (§4.1 – §4.3). These are data hygiene tracked separately once Indy's reference list is in.
- Hinge orientation fix (§5.1) and 80 cm bottom-hinge fix (§5.2). Geometric, will be handled in dedicated bugfix slices.

## Further Notes

- The auto-module-count work in §2.1 / §2.2 is delivered together with the extra-shelf accessory in §3.1 (same slice), per the client's preferred sequencing.
- The `handle.heightCm` field is the single source of truth for both §1.3 (handle Y on sloped doors) and §1.4 (handle disable when it cannot fit). Avoid adding a parallel `minDoorHeight` field — it would be a derived value and would bake the safety margin into Sanity content rather than code.
- The side-slope surcharge is **per side**. Customers configuring `diagonalSide === 'both'` see double the per-side surcharge in the order summary. The back-slope surcharge is a single flat addition.
- `MIN_TOP_CLEARANCE` for §7.1 is intentionally a code constant, not a Sanity field, until the client signals they want to tune it. Moving to Sanity is trivial later — the value flows through one pure function.
