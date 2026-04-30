# Gratis montage: configurator strikethrough + snapshot

## What to build

When `pricingData.config.freeMontage` is `true`, both `useCartPrice` hooks (kledingkast and wasmachinekast) should zero out the installation cost in the price calculation. The original installation tier price is preserved as `freeMontageDiscount` for display and auditing. These values are baked into `PriceSnapshot` at add-to-cart time so the discount is locked in regardless of whether the toggle is later changed.

The canvas price panel gains an optional `originalPrice` prop. When provided, it renders the original grand total with a strikethrough alongside the new lower price.

Both configurator `CanvasPricePanel` wrappers pass `originalPrice` (grand total with montage) when free montage is active.

End result: toggle on in Studio → both configurators show ~~€1.815~~ €1.095 style display. Adding to cart locks in `freeMontageApplied: true` and `freeMontageDiscount: 720` (example) in the snapshot.

## Acceptance criteria

- [ ] `PriceSnapshot` type has `freeMontageApplied?: boolean` and `freeMontageDiscount?: number`
- [ ] When `freeMontage` is `false`: hook behaviour is identical to today (no regression)
- [ ] When `freeMontage` is `true`: `installationCost` in the snapshot is `0`, `total` equals `subtotal`, `freeMontageApplied` is `true`, `freeMontageDiscount` equals the original installation tier price
- [ ] When `freeMontage` is `true` but no installation tier is matched (subtotal below all thresholds): `freeMontageApplied` is `false`, `freeMontageDiscount` is `0`
- [ ] `installationTierName` is still recorded in the snapshot even when montage is free
- [ ] Both hooks expose `originalPrice` (grand total including montage) when `freeMontageDiscount > 0`, otherwise `undefined`
- [ ] Shared `CanvasPricePanel` accepts optional `originalPrice` prop and renders strikethrough when present
- [ ] Both `CanvasPricePanel` wrappers pass `originalPrice` from their respective hooks
- [ ] Unit tests cover all three calculation cases: no free montage, free montage active, free montage active but no tier matched

## Blocked by

- Blocked by #017
