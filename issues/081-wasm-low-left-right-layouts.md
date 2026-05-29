# Wasmachinekast: enable low-left and low-right layouts (both sections at once)

## Parent

[prd-wasmachinekast-low-section.md](prd-wasmachinekast-low-section.md)

## What to build

Enable the `low-left` and `low-right` cards in the Layout step and ship the dual-section configuration flow.

`AfmetingenStep` shows **stacked panels**: depth at top (shared), then hoge-kast panel (width, height, moduleCount), then lage-kast panel (width, moduleCount, werkblad thickness). Both visible at once, no tabs.

`ModulesStep` shows **section tabs** ("Hoge kast" / "Lage kast") when both sections exist. Active tab determines which section's slots and which `sectionType`-filtered GLB list is shown.

`WasherStep` section toggle is now fully functional: switching between `'high'` and `'low'` moves the placement target between sections. Existing `washerModules[]` are discarded when the user switches section (with a confirm if any placements exist).

`MaterialStep`: Werkblad card visible (already supported from #080); Buitenkant and Binnenkant cards remain shared.

`WasmachinekastScene` renders **both** section groups, positioned per layout:
- `low-left`: low at `-totalW/2 + lowW/2`, high at `-totalW/2 + lowW + highW/2`
- `low-right`: high first, then low
Adjacent side walls touch back-to-back (no merging). Room walls compute from total outer width.

Layout transitions:
- Mirror swaps (`low-left ↔ low-right`) preserve both sections, only the X-order flips. No confirm.
- Adding a section (e.g. `high-only → low-left`, `low-only → low-right`) creates a default section via `wasmSectionDefaults` and the existing section is preserved. No confirm.
- Removing a section (any transition that drops a populated section) shows a confirm dialog with the appropriate message.

Doors and handles:
- Per-slot module material overrides work in each section independently.
- `doorsExtendToFloor` applies to doors in both sections.
- One handle and one handle material across the whole wardrobe (no change from today).

## Acceptance criteria

- [ ] `low-left` and `low-right` cards in the Layout step are enabled and selectable.
- [ ] Mirror swap (`low-left ↔ low-right`) preserves the configured sections; only the visual X-order flips. No confirm dialog.
- [ ] `high-only → low-left` (or low-right): creates a default lage kast mirroring the hoge kast's width; no confirm.
- [ ] `low-left → high-only` (or other section-removing transitions on populated sections): confirm dialog appears and discards on accept, preserves on cancel.
- [ ] AfmetingenStep displays the depth slider plus two stacked panels (hoge kast + lage kast) when both sections exist.
- [ ] ModulesStep displays section tabs when both sections exist; switching tabs swaps the visible slots and GLB picker.
- [ ] WasherStep section toggle is functional in both directions; placements clear (with confirm) when the active section changes after placements have been made.
- [ ] WasmachinekastScene renders two corpuses side-by-side in the correct X-order per layout, touching with no gap, each with its own side walls, plinth, and roof (the low corpus's roof being the werkblad).
- [ ] Room walls span the total outer width of both sections.
- [ ] Pricing panel total includes both sections' costs + werkblad and matches `wasmSectionPricing` output.
- [ ] Per-module material overrides work independently in each section.
- [ ] `doorsExtendToFloor` toggling affects doors in both sections.
- [ ] Round-trip save → restore for `low-left` and `low-right` configs preserves all fields including module material overrides.
- [ ] Existing `high-only` and `low-only` flows continue to work.
- [ ] Kledingkast configurator is untouched.

## Blocked by

- Blocked by #080
