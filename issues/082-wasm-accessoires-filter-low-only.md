# Wasmachinekast: filter accessoires by availableForLowSection when layout=low-only

## Parent

[prd-wasmachinekast-low-section.md](prd-wasmachinekast-low-section.md)

## What to build

In `AccessoiresStep`, when `layout === 'low-only'`, hide accessories whose Sanity `availableForLowSection` field is `false`. For all other layouts (`high-only`, `low-left`, `low-right`) the full accessory list is shown — the customer is trusted to choose where things go since at least one section can accommodate full-height options.

Accessories remain wardrobe-level (one counter for the whole wasmachinekast) — no per-section split is introduced.

## Acceptance criteria

- [ ] In `low-only` layout, accessories with `availableForLowSection: false` are not visible in the accessoires picker.
- [ ] In `high-only`, `low-left`, and `low-right` layouts, the full accessory list is visible (no filtering).
- [ ] Accessory counter state remains a single wardrobe-level value.
- [ ] Switching to/from `low-only` while accessories are selected does not silently drop selections; if an already-selected accessory becomes hidden under `low-only`, its counter is reset to 0 with a one-time notice.
- [ ] Pricing reflects the filtered accessory set correctly.
- [ ] Kledingkast accessory step is untouched.

## Blocked by

- Blocked by #080 (depends on Layout step and `low-only` being shippable)
- Blocked by #079 (depends on `availableForLowSection` schema field)
