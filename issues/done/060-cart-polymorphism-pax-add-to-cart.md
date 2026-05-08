## Parent PRD

`issues/prd-pax-doors-product.md`

## What to build

Make the cart polymorphic so PAX product items live alongside closet items end-to-end. Refactor `CartItem` into a discriminated union on `kind`, bump `CART_VERSION`, add a `kind` column to `cart_item` and `order_item` (default `'closet'` for existing rows), implement `mergeOrAddProduct` with unit tests, wire the PDP add-to-cart button, and render PAX lines in `CartView` (thumbnail, size, material name, qty stepper, remove). The existing closet flow must continue to work without regression.

See PRD § Implementation Decisions → "Cart types & storage", "Cart-merge logic", "Database".

## Acceptance criteria

- [ ] `CartItem` is a discriminated union on `kind: 'closet' | 'product'`; `ProductConfigSnapshot` and `ProductPriceSnapshot` types added per PRD spec
- [ ] `CART_VERSION` bumped to 2; old localStorage carts are discarded cleanly via existing version guard
- [ ] Drizzle migration adds `kind text not null default 'closet'` to `cart_item` and `order_item`; existing rows backfill via the default
- [ ] `mergeOrAddProduct(cart, item)` helper merges identical product lines (same `sanityProductId + widthCm + heightCm + materialId`) by incrementing qty; otherwise appends
- [ ] Unit tests cover: same-config merges, different width/material/productId append, never merges with closet items
- [ ] PDP add-to-cart button serialises a product item, persists to localStorage (anon) or DB (authed) via existing cart sync action
- [ ] `CartView` renders PAX lines with hero/colorway thumbnail, size, material name, qty stepper, remove button — dispatched by `kind`
- [ ] Cart sync server action accepts product items and stores `kind` correctly
- [ ] Closet flow regresses cleanly: configure a closet, add to cart, see correct line — no regressions
- [ ] Adding the same PAX configuration twice produces one line with qty 2; adding different size or material produces a new line

## Blocked by

- Blocked by `issues/059-pax-configurator-ui-pricing.md`

## User stories addressed

- User story 10
- User story 11
- User story 12
- User story 14
- User story 15
- User story 22
- User story 23
- User story 24
- User story 33
- User story 34
- User story 37
- User story 38
