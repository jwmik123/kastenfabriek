# PRD: Debug Pricing Panel

## Problem Statement

When investigating pricing bugs or validating the configurator's cost calculations, developers have no way to inspect what the pricing engine is actually computing. The only visible pricing UI is the total price in `CanvasPricePanel`. There is no breakdown of how that number was assembled — no per-module costs, no visibility into which door variant was selected, no confirmation that material overrides are being applied, and no way to verify that module dimensions are correct. Debugging requires either reading source code or adding temporary `console.log` statements.

## Solution

A floating, draggable debug panel rendered over the configurator canvas, visible only when `?debug=1` is present in the URL. The panel shows the complete pricing breakdown at maximum detail: per-module interior costs, door costs and variants, handle/mechanism costs, power hole costs, material IDs and override status, nominal and inner-clear dimensions per slot, plus a global section covering LED, delivery, installation tier, and grand total.

## User Stories

1. As a developer, I want to open the configurator with `?debug=1` so that I can activate the debug panel without shipping any debug UI to production users.
2. As a developer, I want to see a line-item cost for every module slot so that I can verify the pricing engine is applying the correct layout price.
3. As a developer, I want to see whether a module uses the `single` or `double` pricing tier so that I can confirm span-2 modules are priced correctly.
4. As a developer, I want to see the door variant (`standard`, `veneer`, `small`) per module so that I can verify that material type drives the correct door price.
5. As a developer, I want to see the door count per module so that I can confirm span-2 modules produce 2 doors.
6. As a developer, I want to see the handle/mechanism cost per module so that I can verify `push-to-open` vs. handle pricing is applied per door.
7. As a developer, I want to see whether a power hole is present per module and what it costs so that I can audit the accessories pricing.
8. As a developer, I want to see the nominal dimensions (W × H × D) per module so that I can confirm the slot width formula and span multiplier are correct.
9. As a developer, I want to see the inner-clear dimensions per module so that I can verify usable interior space accounting for wall thickness on all sides.
10. As a developer, I want span-2 modules to show a combined inner-clear width (without the intermediate divider) so that the measurement accurately reflects the double-wide opening.
11. As a developer, I want to see the buitenkant material name and ID per module so that I can confirm which material is being used for door variant selection.
12. As a developer, I want to see whether a material is a per-module override or inherited from the global setting so that I can tell at a glance when a slot has a custom material.
13. As a developer, I want overridden materials to be visually distinguished from inherited ones so that I do not need to cross-reference the store manually.
14. As a developer, I want to see the binnenkant material name and ID per module so that I can confirm interior material assignments.
15. As a developer, I want a top-cabinet row when one is present so that I can see its door count, door variant, and mechanism cost in isolation.
16. As a developer, I want to see the LED cost with the module count used to compute it so that I can verify the base + per-module formula.
17. As a developer, I want to see the delivery cost so that I can confirm the flat fee is applied.
18. As a developer, I want to see the installation tier name and cost so that I can verify the subtotal-based tier lookup.
19. As a developer, I want a subtotal (excluding installation) and a grand total in a pinned footer so that I can read the final numbers without scrolling.
20. As a developer, I want the panel to start at the top-left of the canvas so that it does not overlap existing UI elements on first open.
21. As a developer, I want to drag the panel anywhere on screen so that I can reposition it when inspecting different parts of the configurator.
22. As a developer, I want the panel to have a fixed maximum height with internal scrolling so that it never overflows the viewport regardless of module count.
23. As a developer, I want the panel to show the closet's total dimensions (W × H × D) and module count in the header so that I have full context without scrolling.
24. As a developer, I want each module row to show the slot index so that I can cross-reference with the 3D scene and store state.
25. As a developer, I want each module row to show its layout name and layout ID so that I can look up the corresponding Sanity pricing record.
26. As a developer, I want an empty slot (layoutId = null) to be clearly indicated rather than showing zero costs as if it were priced so that I do not misinterpret missing configuration as free modules.

## Implementation Decisions

### Modules

**`moduleDebugDimensions` utility (new, deep module)**
Pure function. Inputs: total closet width, height, depth, module count, slot index, span. Outputs: nominal dimensions (gross slot size) and inner-clear dimensions (subtracting outer side walls, module divider walls, top panel, and leg assembly height). The inner-clear width for a span-2 slot omits the intermediate divider since it is physically absent. This function can be tested entirely in isolation with no React or store dependencies.

**`useDebugPricing` hook (new, deep module)**
Reads from the Zustand closet store and instantiates `PricingEngine` from the stored `pricingData`. Returns a structured object: an array of per-module rows (each containing all cost line items, material info, and dimensions) plus global cost rows (LED, delivery, installation tier). Mirrors the logic of `useCartPrice` but with per-slot granularity — allocating door cost, handle cost, and power hole cost directly to each module rather than as aggregate totals. This hook has no UI concerns and can be tested by injecting store state directly (same pattern as the existing store unit tests).

**`DebugPricePanel` component (new)**
Client component. Reads `useSearchParams` to gate on `?debug=1`. Calls `useDebugPricing` for all data. Implements drag behaviour using pointer capture on the header element — `onPointerDown` records start offset, `onPointerMove` updates position state, `onPointerUp` releases capture. No external drag library. Renders module rows in a scrollable body and a pinned totals footer.

**`KledingkastCanvas` (modified)**
Mount `DebugPricePanel` inside the existing `relative`-positioned canvas wrapper alongside `CanvasPricePanel`. No structural changes required.

### Dimension Constants
Wall thickness and leg assembly dimensions must be kept in sync with the existing scene rendering constants (`WALL`, `MODULE_WALL`, `ONDERSTEL_HEIGHT`, `ONDERSTEL_GAP`). These should be imported from a single shared constants file rather than duplicated across `moduleDebugDimensions` and `Measurements`.

### Gate Behaviour
`?debug=1` is the only gate. No `NODE_ENV` check. The panel is invisible in production unless a developer manually adds the param. No toggle button, no feature flag.

### Material Override Indicator
`↑` prefix = per-module override (differs from global setting). `↓` prefix = inherited from global. Both show `Name (id)` format.

## Testing Decisions

A good test exercises the public interface of a module — its inputs and outputs — without asserting on internal variable names, intermediate values, or implementation structure. Tests should remain valid after refactoring internals.

**`moduleDebugDimensions`** — highest priority. Pure function with no side effects. Test cases:
- Single slot at various closet widths produces correct nominal width (total width ÷ module count)
- Span-2 slot produces double the single nominal width
- Inner-clear width for span-1 subtracts two module wall thicknesses
- Inner-clear width for span-2 subtracts two outer module wall thicknesses only (no intermediate divider)
- Inner-clear height subtracts top panel and leg assembly height from main height
- Inner-clear depth subtracts two outer wall thicknesses

**`useDebugPricing`** — second priority. Test using Vitest + Zustand state injection (same pattern as `store.test.ts` and `discount.test.ts`). Seed store with known `pricingData` and module configuration, assert that per-module cost rows and global totals match hand-calculated expected values. Key cases:
- Module with door using a colour material → `standard` door variant
- Module with door using a texture material → `veneer` door variant
- Span-2 module → `double` interior price, 2 doors, 2 × handle cost
- Module with power hole → power hole cost allocated to that slot
- LED disabled → LED cost is zero
- Top cabinet present → separate door/handle row appears

Prior art: `lib/cart/__tests__/discount.test.ts` (pure function pattern), `kledingkast/__tests__/store.test.ts` (Zustand injection pattern).

**`DebugPricePanel`** — not tested. Pure UI composition with no logic of its own; all logic lives in `useDebugPricing` and `moduleDebugDimensions`.

## Out of Scope

- Mobile layout — the panel is desktop-only, consistent with `CanvasPricePanel`
- Persisting panel position across page reloads
- Collapsible sections or per-module fold/unfold
- Real-time diff highlighting when values change
- Exporting the breakdown to clipboard or file
- Any changes to `useCartPrice` or `CanvasPricePanel`
- Surfacing this panel to end customers in any form

## Further Notes

The `Measurements` component in the canvas computes per-slot inner-clear widths using the same wall-thickness constants but does not account for `span`. The `moduleDebugDimensions` utility should fix this for the debug panel and may serve as the reference implementation if `Measurements` is corrected later.

The `useCartPrice` hook computes `doorCost` and `mechanismCost` as aggregates across all modules. `useDebugPricing` will re-implement this per-slot, which means the two hooks' totals must agree. A divergence would itself be a pricing bug worth surfacing.
