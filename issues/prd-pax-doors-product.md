# PRD: IKEA PAX Doors Product (Webshop)

## Problem Statement

The webshop today only sells configurator-built closets. The team wants to start selling additional, simpler products — beginning with IKEA PAX doors — through the same checkout, account, and order pipeline. There is no generic "product" abstraction yet: cart items, order items, checkout, and Stripe line items are all hard-typed to a closet configuration. Adding PAX doors today would either fork the entire commerce stack or shoehorn a square peg into a round hole. We need a clean way to introduce a non-configurator product (and the next ones after it) without destabilising the closet flow.

## Solution

Introduce a generic Sanity `product` document type with a typed PAX-specific subobject, a public `/producten` listing, and a `/producten/[slug]` product detail page. Make the cart polymorphic via a discriminated `kind` field (`closet` | `product`) so existing closet items and new product items coexist. Reuse the existing materials registry, colorway photography, account/orders/email pipeline, and Stripe checkout — adapting them to dispatch on `kind`. Pricing per PAX variant is a flat matrix in Sanity; delivery is configurable per product and deduplicated across the cart by taking the maximum line-level delivery fee. The same architecture supports future products without a schema-per-product proliferation.

## User Stories

1. As a customer, I want to browse a list of available products at `/producten`, so that I can see what the shop sells beyond custom closets.
2. As a customer, I want to open a product detail page at `/producten/pax-deuren`, so that I can read about the PAX doors product before configuring.
3. As a customer, I want to choose a width (25, 37, or 50 cm) on the PAX product page, so that the door fits my IKEA PAX frame.
4. As a customer, I want to choose a height (194, 200, 229, or 235 cm) on the PAX product page, so that the door matches my frame height.
5. As a customer, I want to choose any of the materials available in the closet configurator on the PAX product page, so that I can match my existing furniture.
6. As a customer, I want to see two preview photos of the door in my chosen material, so that I can visualise the result before buying.
7. As a customer, I want the preview photos to update instantly when I change material, so that comparing options is fast.
8. As a customer, I want to set a quantity (1–10) on the product page, so that I can buy multiple doors in one click.
9. As a customer, I want to see a live total price reflecting size, material surcharge, and quantity, so that I know the cost before adding to cart.
10. As a customer, I want to add the configured PAX door to the cart, so that I can check out alongside any closet I'm buying.
11. As a customer, I want adding the same (size + material) PAX door twice to merge into one cart line with quantity 2, so that the cart stays clean.
12. As a customer, I want adding a different size or material PAX door to create a new cart line, so that I can buy mixed configurations.
13. As a customer, I want to edit a PAX cart line via the pencil icon, so that I can change size/material/quantity without removing and re-adding.
14. As a customer, I want the cart to show a thumbnail, size, material name, and quantity for each PAX line, so that I can quickly verify what I'm buying.
15. As a customer, I want to remove a PAX line from the cart, so that I can change my mind.
16. As a customer with a mixed cart (closet + PAX), I want to be charged delivery only once at the highest applicable rate, so that I'm not double-billed for one shipment.
17. As a customer with PAX doors only in the cart, I want to pay the PAX-configured delivery fee, so that the cost is transparent and matches the product page.
18. As a customer, I want to use coupon codes on a cart containing PAX doors, so that promotions work consistently across products.
19. As a customer, I want to complete Stripe checkout with PAX doors in the cart, so that paying works the same way as for closets.
20. As a customer, I want to see my PAX purchase clearly itemised on the order confirmation page, with size/material/quantity, so that I can verify what I bought.
21. As a customer, I want my order confirmation email to itemise PAX doors with size/material/quantity, so that I have a record off-platform.
22. As a customer with a saved cart from before this feature shipped, I want any in-progress closet draft to be cleared cleanly when I return, so that I don't see corrupted data.
23. As a logged-in customer, I want my PAX cart items to sync to the database, so that they persist across devices.
24. As a logged-out customer, I want my PAX cart items to persist in localStorage and sync after I log in, so that I don't lose them by signing in.
25. As a customer, I want a "Producten" link in the site header, so that I can find products from any page.
26. As a Sanity editor, I want a "Producten" section under Commerce in the Studio, so that I manage webshop products separately from configurator pricing parts.
27. As a Sanity editor, I want to create a new product with title, slug, descriptions, hero image, gallery, delivery fee, and active flag, so that I can manage the catalogue.
28. As a Sanity editor, I want to set widths, heights, and a price matrix on the PAX subobject, so that pricing is editable without code changes.
29. As a Sanity editor, I want to optionally restrict allowed materials on a product, so that not every material has to apply to every product.
30. As a Sanity editor, I want to optionally set a per-material surcharge, so that premium veneers can cost more.
31. As a Sanity editor, I want to deactivate a product via `isActive=false`, so that it disappears from the listing without deletion.
32. As a Sanity editor, I want the existing Configurator → Producten submenu renamed to "Onderdelen", so that webshop products and configurator parts aren't confused.
33. As an operator, I want PAX orders to land in the same `order` and `order_item` tables as closet orders, so that I have one queryable source of truth.
34. As an operator, I want a `kind` column on `cart_item` and `order_item`, so that I can report on product mix without parsing JSON.
35. As a developer, I want PAX pricing logic isolated in a pure function, so that I can test edge cases without rendering UI.
36. As a developer, I want cart total computation (including the max-delivery rule) isolated in a pure function, so that the rule is enforced consistently across cart, checkout, and Stripe line generation.
37. As a developer, I want cart-merge logic isolated, so that the identity rule (productId + width + height + material) is testable in isolation.
38. As a developer, I want the order detail and email templates to dispatch on `kind`, so that adding a third product type later doesn't require touching closet code paths.

## Implementation Decisions

### Product domain model (Sanity)

- New generic `product` document type. Shared fields: `title`, `slug`, `productType` (enum, initially `pax-doors`), `shortDescription`, `longDescription` (Portable Text), `heroImage`, `gallery[]`, `deliveryFee` (number, EUR), `isActive` (boolean, default true).
- Per-product-type config lives in a typed subobject keyed by `productType`. PAX subobject (`paxConfig`):
  - `widths`: `number[]` (e.g. 25, 37, 50)
  - `heights`: `number[]` (e.g. 194, 200, 229, 235)
  - `variants`: array of `{ widthCm, heightCm, priceEur }` covering every (width, height) pair
  - `allowedMaterialIds`: optional `string[]`; when omitted, all materials allowed
  - `materialSurcharges`: optional array of `{ materialId, surchargeEur }`
  - `hingeSide`: optional, reserved for future left/right variants — not surfaced in v1 UI
- The materials registry remains in code (`MATERIALS`). Sanity references material IDs as strings; no Sanity material doc type is introduced.
- Studio nav: new "Producten" entry under Commerce. The existing Configurator → Producten submenu is renamed "Onderdelen" to disambiguate webshop products from configurator parts.

### Pricing

- A pure module (`calcProductPrice`) computes a `ProductPriceSnapshot` from `(productDoc, widthCm, heightCm, materialId, qty)`:
  - Looks up the matching variant; throws if no variant matches the requested size.
  - Adds the matching `materialSurcharges` entry (zero if absent).
  - Captures `unitPrice`, `deliveryCost` (from `product.deliveryFee`), `total` (= unitPrice; delivery stays separate from `total` so the existing closet semantics aren't changed for closet items, but PAX `total` excludes delivery — see below).
- To avoid touching closet `priceSnapshot` shape: closet `priceSnapshot.total` keeps including its delivery; product `priceSnapshot.total` excludes delivery. The cart-totals module deducts the closet line's `deliveryCost` and re-adds `max(line.deliveryCost)` once across all lines, producing identical behaviour without migrating existing snapshots.

### Cart total module

- New pure module (`calcCartTotals`) returns `{ lineSubtotal, delivery, install, grandTotal }` from a `CartItem[]`:
  - `lineSubtotal = Σ (line.total − line.deliveryCost) × qty` for both kinds.
  - `delivery = max(line.deliveryCost)` across all lines (or 0 if empty).
  - `install = Σ closet line.installationCost × qty` (PAX has none).
  - `grandTotal = lineSubtotal + delivery + install`.
- Used by `CartView`, `CheckoutForm`, and `createCheckoutSession` so the rule is single-sourced.
- Stripe line items: per-line bills `(line.total − line.deliveryCost) × qty`; one extra Stripe line for "Bezorging" with `unit_amount = max delivery`.

### Cart types & storage

- `CartItem` becomes a discriminated union on `kind: 'closet' | 'product'`.
  - Closet item: `{ kind: 'closet', configuration: ClosetConfigSnapshot, priceSnapshot: ClosetPriceSnapshot, … }` (current shape, with the `kind` discriminator added).
  - Product item: `{ kind: 'product', configuration: ProductConfigSnapshot, priceSnapshot: ProductPriceSnapshot, … }`.
- `ProductConfigSnapshot` includes: `id`, `capturedAt`, `sanityProductId`, `productType`, `productSlug`, `productName`, `widthCm`, `heightCm`, `materialId`, `materialName`.
- `ProductPriceSnapshot` includes: `calculatedAt`, `currency`, `unitPrice`, `materialSurcharge`, `deliveryCost`, `total`, optional `discountCode`/`discountAmount`/`discountType`.
- `CART_VERSION` bumped to 2. Localstorage carts on the old version are discarded by the existing `getCart()` guard; this wipes any in-progress anonymous closet drafts (acceptable: closets are typically authored within a single session).

### Cart-merge logic

- New helper `mergeOrAddProduct(cart, item)`: when adding a product item, find an existing line where `kind === 'product'` and `(sanityProductId, widthCm, heightCm, materialId)` match; if found, increase quantity; otherwise append. Closet items always append (no merge — each closet is unique).

### Database

- Add `kind text not null default 'closet'` to `cart_item` and `order_item`. Existing rows backfill to `'closet'` via the default.
- Reuse `order_item.sanity_product_id` (currently stores `'custom-closet'` literal for closet rows) — for product rows it stores the real Sanity `_id`.
- `configuration_snapshot jsonb` already accommodates the new shape.

### Routing & pages

- `/producten` (server component): GROQ-fetches all `isActive` products, renders cards with hero image and CTA → PDP.
- `/producten/[slug]` (server component): GROQ-fetches one product by slug, renders title/description/gallery, and mounts a client `PaxDoorConfigurator` (dispatched by `productType`).
- The PDP supports `?edit=<cartItemId>` to pre-fill state from an existing cart line and update that line on save (mirrors the closet flow).
- Site header gets a "Producten" link.

### PaxDoorConfigurator (client component)

- Reads product doc + materials. State: `widthCm`, `heightCm`, `materialId`, `qty`.
- Renders width buttons, height buttons, material swatch grid (filtered by `allowedMaterialIds` if set), quantity stepper.
- Mounts an embedded preview that reuses the existing `ColorwayPreview` swatch + image pattern. Image source uses the same `/colorways/{slug}-{1|2}.webp` files; the existing `COLORWAY_SLUGS` map handles the five outliers (other material IDs already match their on-disk slugs).
- Live price computed via `calcProductPrice`.
- Add-to-cart button serialises a `ProductConfigSnapshot` + `ProductPriceSnapshot`, calls `mergeOrAddProduct`, persists to localStorage (anon) or DB via the existing cart server action.

### Checkout & order rendering

- `createCheckoutSession` dispatches Stripe line-item construction by `kind` and uses `calcCartTotals` for delivery dedup.
- Order detail page and account orders extract a shared `<OrderLineItem>` component that switches on `kind` to render closet vs PAX summaries.
- Confirmation email templates dispatch by `kind` with a PAX subtemplate showing size/material/qty.

## Testing Decisions

Tests focus on external behaviour of pure modules — given inputs, assert outputs. No mocking of internal collaborators. UI components and server actions are not unit-tested in this PRD; integration coverage stays as today (manual in-browser verification per the project's UI-change guidance).

Unit tests (Vitest, matching existing tests under `lib/cart/__tests__/` and `lib/__tests__/` as prior art):

- **`calcProductPrice`**:
  - Returns the correct unitPrice for each (width, height) variant.
  - Adds `materialSurcharge` when the material has one configured.
  - Returns zero surcharge when material is not in the surcharge list.
  - Throws on missing variant.
  - Result is independent of quantity (qty is applied at cart level).
- **`calcCartTotals`**:
  - Empty cart returns all zeros.
  - Single closet line: subtotal/delivery/install match the line snapshot.
  - Single PAX line: subtotal = unitPrice × qty; delivery = product deliveryFee.
  - Mixed cart with closet €95 delivery + PAX €20 delivery: total delivery = €95.
  - Multiple PAX lines with different deliveryFees: takes the max once.
  - Install only counts closet items.
- **`mergeOrAddProduct`**:
  - Same productId + width + height + material → quantity increments.
  - Different width → new line.
  - Different material → new line.
  - Different productId → new line.
  - Adding a product item to a cart that already contains a closet line never merges with it.

The PaxDoorConfigurator UI is verified manually in the browser (golden path: pick size → pick material → preview updates → add to cart → cart shows correct line; edge cases: edit-from-cart pre-fill, qty stepper bounds, disallowed material hidden when `allowedMaterialIds` set).

## Out of Scope

- Migrating the materials registry from code into Sanity.
- Per-product installation tiers on non-closet products.
- Stock or inventory tracking.
- Producing new colorway photography (existing 22 × 2 set is reused).
- Left/right hinge variants on PAX doors (`hingeSide` field exists in schema but not surfaced in v1 UI).
- Product reviews on the new product page.
- SEO metadata fields (metaTitle, metaDescription, ogImage) on the product schema.
- Refactoring closet `priceSnapshot.total` to exclude delivery (sidestepped by the dedup rule in `calcCartTotals`).

## Further Notes

- Existing convention in `issues/` is `prd-<slug>.md`; this PRD follows that pattern (the skill's default `issues/prd.md` would clash with future PRDs).
- The `productType` discriminator in Sanity is the extension seam for product #2: add a new enum value, a new `<type>Config` subobject, a new client configurator component, and a new GROQ projection — no commerce-stack changes needed.
- Bumping `CART_VERSION` to 2 wipes anonymous localStorage carts. Authenticated users' DB carts are unaffected. Worth a one-line release note for the team but no user-facing announcement is needed.
- The max-delivery rule is intentionally simple. If real shipping costs diverge significantly between SKUs in future, revisit (per-line shipping zones, weight/volume rules). For two product types both shipping by the same flat-rate truck, max is fair and obvious.
- `sanity_product_id` on `order_item` is repurposed (it currently holds the literal `'custom-closet'` for closet orders). No backfill needed; closet orders keep their literal value, product orders store the real Sanity `_id`.
