# 071 — Default module count + extra-shelf accessory

## Parent

[prd-configurator-feedback-round](./prd-configurator-feedback-round.md)

## What to build

Two tightly-coupled customer-visible changes shipped together per the PRD's sequencing note:

1. **Auto-adjust module count** when the customer widens or narrows the wardrobe across configured thresholds (default 50 cm and 100 cm). The physical `minModules` / `maxModules` (driven by `singleCorpus` width constraints) remain authoritative; the *default* shifts. Customer can still manually reduce the count after the system bumps it up — the bump only fires when the *width* crosses a threshold.
2. **Extra shelf accessory** on the accessoires step: a counter (0..N) priced at €45 each. Not rendered in the 3D scene. Pure pricing line item.

End-to-end: customer widens the wardrobe past 50 cm → module count jumps from 1 → 2 and price visibly increases; widens past 100 cm → jumps to 3; narrows back below 50 cm → drops to 1. Separately, on the accessoires step, the customer can add N extra shelves and watch the total reflect `N × €45`.

## Acceptance criteria

### Default module count

- [ ] `pricingConfig.moduleCountDefaults` Sanity field (ordered list of `{ minWidthCm, count }`) with initial seed `[{ minWidthCm: 50, count: 2 }, { minWidthCm: 100, count: 3 }]`.
- [ ] New pure module `defaultModuleCount(widthCm, thresholds): number`. No store imports.
- [ ] Unit tests: exactly-at-threshold values, upward/downward crossings, empty thresholds list returns 1, clamping into `singleCorpus.minWidth`/`maxWidth`.
- [ ] `setWidth` in the closet store calls `defaultModuleCount` and applies it when the new width crosses a threshold *upward or downward* relative to the previous width. If the new default falls outside physical bounds, clamp.
- [ ] Manual override via `setModuleCount` is preserved until the next width-driven trigger (manual reduce after auto-bump must stick across in-step interactions).

### Extra-shelf accessory

- [ ] New Sanity `accessory` document `extra-shelf` — €45, perUnit, category `interior`.
- [ ] `ClosetConfigSnapshot.extraShelfCount: number` added; defaulted to 0 in `restoreConfig` for older snapshots.
- [ ] AccessoiresStep renders an extra-shelf counter (numeric input or +/− buttons). No 3D rendering of the shelves.
- [ ] Pricing engine multiplies `extraShelfCount × accessory price` into the total.
- [ ] Order summary and email rendering include the extra-shelf line with quantity.
- [ ] Unit / integration test for snapshot round-trip with `extraShelfCount > 0`.

### General

- [ ] Manual QA: widen from 45 → 55 cm — observe count bump and price increase; narrow back — observe count drop; manually reduce to 1; widen past next threshold — observe new bump. Independently: add 3 extra shelves on accessoires step — observe +€135 in total.

## Blocked by

None — can start immediately.
