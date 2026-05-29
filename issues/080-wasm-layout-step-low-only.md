# Wasmachinekast: Layout step + low-only layout end-to-end

## Parent

[prd-wasmachinekast-low-section.md](prd-wasmachinekast-low-section.md)

## What to build

Add the new **Layout** step as step 1 of the wizard and ship the full `low-only` configuration path end-to-end: store, scene, dimensions, modules with section filtering, materials with werkblad picker, and pricing. `low-left` and `low-right` are presented in the Layout step UI but **disabled with "Coming soon"** — they ship in #081.

Final wizard order after this slice (8 steps):

1. **Layout** (new)
2. Afmetingen
3. Wasmachine
4. Modules
5. Materiaal (with conditional Werkblad card)
6. Handgrepen
7. Accessoires
8. (existing final step)

Layout step renders four cards (`high-only`, `low-only`, `low-left`, `low-right`) with simple visual previews. `low-left` and `low-right` are disabled. Selecting `high-only ↔ low-only` triggers `wasmLayoutTransitions.transition` and shows the destructive-confirm dialog when work would be discarded.

`AfmetingenStep` for `low-only`: shows a single lage-kast panel (width, moduleCount slider, werkblad thickness toggle 18 / 36mm); height is fixed at 90cm and not surfaced as a slider. Depth slider stays shared.

`ModulesStep` for `low-only`: shows lage-kast slots only; `wasmModuleLayoutFilter` filters GLBs to `'low' | 'both'`.

`WasherStep` for `low-only`: section toggle locks to `'low'`; placement against lage-kast slots; if no washer GLB qualifies, show the empty-state message ("Geen wasmachine-GLB beschikbaar voor deze sectie").

`MaterialStep` gains a **Werkblad** card that is visible only when `lowSection !== null`. The card lets the customer pick a `countertopMaterialId` from the existing buitenkant material list. Default = current `buitenkantMaterialId` until the customer picks.

`WasmachinekastScene` renders the lage kast as a single section group, centered, with the werkblad as its roof panel (thickness driven by `topPanelThicknessMm`).

Pricing panel shows the correct total via `wasmSectionPricing` for the low-only configuration including the werkblad line.

## Acceptance criteria

- [ ] Layout step is step 1, shows four cards, two disabled with tooltip.
- [ ] Selecting `low-only` from `high-only` shows a confirm dialog ("This will remove your hoge kast configuration. Continue?") when the hoge kast has any non-default content. Cancel preserves state; confirm transitions to `low-only` and creates a default lage kast.
- [ ] Selecting `high-only` from `low-only` shows the symmetric confirm.
- [ ] In `low-only`, AfmetingenStep shows only the lage-kast panel with width + moduleCount + werkblad-thickness toggle and the shared depth slider.
- [ ] Lage kast height is fixed at 90cm and cannot be changed via UI.
- [ ] In `low-only`, ModulesStep shows only `sectionType: 'low' | 'both'` layouts in the GLB picker.
- [ ] In `low-only`, WasherStep section toggle is locked to `'low'`; if no washer GLB qualifies for the lage kast, the placement UI shows the empty-state message but the step remains reachable.
- [ ] MaterialStep shows a Werkblad card when a lage kast exists; the picker draws from the buitenkant material list and writes to `lowSection.countertopMaterialId`.
- [ ] WasmachinekastScene renders a single low-section corpus, flush plinth on the floor, werkblad as the roof.
- [ ] Pricing panel total includes werkblad cost and matches `wasmSectionPricing` output for low-only configurations.
- [ ] Round-trip save → restore for a `low-only` config preserves all fields.
- [ ] All existing `high-only` flows continue to work unchanged.
- [ ] Kledingkast configurator is untouched.

## Blocked by

- Blocked by #076 (sectioned store + scene)
- Blocked by #077 (Handgrepen step in place)
- Blocked by #078 (Wasmachine step reorder + washerSection)
- Blocked by #079 (sectionType filtering in place)
- Blocked by #084 (at least one `sectionType: 'low'` module layout registered)
