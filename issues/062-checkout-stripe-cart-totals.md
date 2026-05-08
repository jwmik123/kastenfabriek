## Parent PRD

`issues/prd-pax-doors-product.md`

## What to build

Extend checkout to handle product items end-to-end. Introduce a pure `calcCartTotals` module (with unit tests) implementing the max-delivery dedup rule, and use it as the single source of truth in `CartView`, `CheckoutForm`, and `createCheckoutSession`. Build Stripe line items by dispatching on `kind` and add one extra Stripe "Bezorging" line for the deduped delivery fee. A mixed cart (closet + PAX) checks out with correct totals via Stripe test cards.

See PRD § Implementation Decisions → "Cart total module", "Pricing", and "Checkout & order rendering".

## Acceptance criteria

- [ ] New `lib/cart/totals.ts` exports `calcCartTotals(items) → { lineSubtotal, delivery, install, grandTotal }`
- [ ] Pure: no I/O, no Stripe calls inside the function
- [ ] Implements: subtotal = Σ(line.total − line.deliveryCost) × qty; delivery = max(line.deliveryCost) or 0; install = Σ closet line.installationCost × qty; grandTotal = subtotal + delivery + install
- [ ] Unit tests cover: empty cart, closet-only, PAX-only, mixed (closet €95 + PAX €20 → €95), multi-PAX with different deliveries (max wins once), install only counts closet
- [ ] `CartView` totals display switches to `calcCartTotals`
- [ ] `CheckoutForm` review totals switch to `calcCartTotals`
- [ ] `createCheckoutSession` builds Stripe line items by dispatching on `kind`: each line bills `(line.total − line.deliveryCost) × qty`; one extra Stripe line `Bezorging` with `unit_amount = max delivery`
- [ ] Order row stores the deduped grand total in `total_amount` (in cents)
- [ ] Order item `sanity_product_id` stores the real Sanity product `_id` for product items, `'custom-closet'` literal for closet items
- [ ] Coupon flow continues to work on a cart containing PAX items
- [ ] End-to-end: PAX-only checkout, closet-only checkout, and mixed checkout all complete via Stripe test card with correct totals

## Blocked by

- Blocked by `issues/060-cart-polymorphism-pax-add-to-cart.md`

## User stories addressed

- User story 16
- User story 17
- User story 18
- User story 19
- User story 36
