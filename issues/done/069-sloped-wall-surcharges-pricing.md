# 069 — Sloped-wall surcharges: Sanity fields + pricing engine

## Parent

[prd-configurator-feedback-round](./prd-configurator-feedback-round.md)

## What to build

Reflect the extra construction work for sloped walls in the price. Add two new fields to `pricingConfig` and apply them in the pricing engine based on the wardrobe's slope configuration. Side-slope surcharge is **per side** (both = double).

End-to-end: customer enables a back slope → order summary shows a "Sloped back wall +€1,100" line; customer enables `diagonalSide = 'both'` → order summary shows "Sloped side wall (×2) +€2,200"; the cart total reflects both.

## Acceptance criteria

- [ ] `pricingConfig.slopedBackWallSurcharge` field (number, EUR, default 1100) added to schema and migration / seed updated.
- [ ] `pricingConfig.slopedSideWallSurchargePerSide` field (number, EUR, default 1100) added similarly.
- [ ] `PricingEngine` exposes the surcharge values and `calculateSurchargesFromSnapshot(snapshot)` adds `slopedBackWallSurcharge` when `backDiagonal` is true and `slopedSideWallSurchargePerSide × n` where `n` is the count of active side slopes (`'left'` or `'right'` → 1, `'both'` → 2, `'none'` → 0).
- [ ] Order total and order summary UI include the surcharges as line items, with the same NL labels Indy expects.
- [ ] Order email rendering includes the surcharge lines.
- [ ] Unit tests for `calculateSurchargesFromSnapshot`: `'none'` → 0, `'left'` → 1100, `'right'` → 1100, `'both'` → 2200; with `backDiagonal` flag added on top.
- [ ] Manual QA: configure each slope variant; confirm pricing in the cart UI matches expected sums.

## Blocked by

None — can start immediately.
