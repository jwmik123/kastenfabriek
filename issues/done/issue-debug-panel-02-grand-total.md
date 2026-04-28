# Debug panel — grand total footer with global cost breakdown

## What to build

Add a `useDebugPricing` hook that computes global costs: LED strips (base + per-module), delivery, installation tier lookup, subtotal (excluding installation), and grand total. Render these in a pinned footer section of the debug panel. Add unit tests for the global cost calculations. The hook's grand total must agree with `useCartPrice`'s `grandTotal` — a divergence is itself a bug.

## Acceptance criteria

- [ ] Panel footer shows: LED cost (with module count), delivery cost, installation tier name + cost, subtotal, grand total
- [ ] LED cost shows as zero when light strips are disabled
- [ ] Installation tier name matches the tier returned by `PricingEngine.getInstallationTier`
- [ ] Grand total in debug panel matches the value shown in `CanvasPricePanel` at all times
- [ ] `useDebugPricing` is a separate hook — `useCartPrice` is not modified
- [ ] Unit tests cover: LED disabled/enabled, installation tier boundary values, delivery flat fee

## Blocked by

- Blocked by issue-debug-panel-01-shell (panel must exist to render into)
