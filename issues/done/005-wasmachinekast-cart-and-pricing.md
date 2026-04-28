# 005 — Wasmachinekast cart + pricing integration

## Parent PRD

`issues/prd-wasmachinekast-configurator.md`

## What to build

Wire the Sanity-fed pricing engine and the cart (localStorage + Supabase sync) into the wasmachinekast configurator.

The wasmachinekast follows the same pricing and cart patterns as the kledingkast:
- Sanity pricing data is fetched at page load and passed to `hydrate` in the wasmachinekast store (already scaffolded in `003`).
- A price bar component displays the live total, updating as the user changes configuration.
- An "add to cart" action serialises the current configuration into a `ClosetConfigSnapshot`-equivalent snapshot and writes it to localStorage and Supabase.
- The configurator reads back any persisted snapshot on mount (`restoreConfig`) so the user can resume a previous session.

The price calculation reuses the same `calculatePrice` logic as kledingkast — no new pricing engine needed. If `calculatePrice` is currently kledingkast-specific it should be moved to `_shared/pricing/` as part of this slice.

## Acceptance criteria

- [ ] Live price displayed in the price bar as configuration changes
- [ ] Price correctly reflects width, height, depth, materials, door handles, and module layouts
- [ ] "Add to cart" button serialises and persists the configuration
- [ ] Returning to `/wasmachinekast` restores the previous configuration from localStorage
- [ ] `calculatePrice` lives in `_shared/pricing/` and is used by both kledingkast and wasmachinekast
- [ ] Kledingkast pricing behaviour is unaffected

## Blocked by

- `issues/004-wasmachinekast-scene-wizard-and-washer-module.md`

## User stories addressed

- User story 1 (order via cart)
- User story 13 (live price updates)
- User story 14 (add to cart)
- User story 15 (configuration persistence)
