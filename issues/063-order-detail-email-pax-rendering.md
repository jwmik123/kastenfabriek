## Parent PRD

`issues/prd-pax-doors-product.md`

## What to build

Render PAX order lines correctly on the order detail page, in account orders, and in the order confirmation email. Extract a shared `<OrderLineItem>` component (and email subtemplate) that dispatches by `kind`, rendering size/material/qty for product items and the existing closet summary for closet items.

See PRD § Implementation Decisions → "Checkout & order rendering".

## Acceptance criteria

- [ ] Shared `<OrderLineItem>` component dispatches by `kind`
- [ ] PAX order line renders: product name, size (W×H cm), material name, qty, unit price, line total
- [ ] Closet order line continues to render its existing detailed summary (no regression)
- [ ] `/order/[id]` and account orders pages both use the shared component
- [ ] Order confirmation email template dispatches by `kind` with a PAX subtemplate showing size/material/qty
- [ ] Mixed-cart order: detail page and email show both line types correctly with right totals
- [ ] Email renders correctly in at least one major client (e.g. Gmail web)

## Blocked by

- Blocked by `issues/062-checkout-stripe-cart-totals.md`

## User stories addressed

- User story 20
- User story 21
- User story 38
