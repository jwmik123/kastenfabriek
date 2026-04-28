# Debug panel — per-module cost rows

## What to build

Extend `useDebugPricing` to return a cost breakdown per module slot. For each slot: interior cost (single vs double pricing tier), door cost (variant + count), handle/mechanism cost (per door), and power hole cost. Render each slot as a row in the panel's scrollable body. Empty slots (no layout assigned) must be clearly labelled rather than showing zero costs. Include a top-cabinet row when one is present. Add unit tests for per-module cost allocation.

## Acceptance criteria

- [ ] Each occupied slot shows: layout name, layout ID, pricing tier (single/double), interior cost, door variant, door count, door cost, handle cost, power hole cost, slot subtotal
- [ ] Span-2 modules show pricing tier `double`, door count 2, handle cost × 2
- [ ] Colour material → `standard` door variant; texture material → `veneer` door variant
- [ ] Empty slots (layoutId = null) show a clear "Leeg" label, no cost line items
- [ ] Top-cabinet row appears when `needsTopCabinet()` is true, showing door count + `small` variant + handle cost
- [ ] Sum of all per-module slot subtotals plus global costs equals the grand total from slice 2
- [ ] Unit tests cover: colour vs texture door variant, span-2 cost doubling, power hole allocation, empty slot handling, top-cabinet row

## Blocked by

- Blocked by issue-debug-panel-02-grand-total (`useDebugPricing` base must exist)
