## Parent PRD

`issues/prd-pax-doors-product.md`

## What to build

Build the `/producten` listing and `/producten/[slug]` product detail page as server components reading from Sanity, plus a "Producten" link in the site header. The PDP renders hero image, title, descriptions, and gallery — no configurator UI yet (added in the next slice).

See PRD § Implementation Decisions → "Routing & pages".

## Acceptance criteria

- [ ] `/producten` lists all `isActive` products with hero image, title, short description, and CTA → PDP
- [ ] `/producten/[slug]` renders hero, title, long description (Portable Text), and gallery for the matched product
- [ ] 404 when slug doesn't match an active product
- [ ] GROQ queries live in `sanity/lib/products.ts` (`getActiveProducts`, `getProductBySlug`); both server-only
- [ ] Site header shows a "Producten" link
- [ ] Pages live under the `(main)` route group (header + footer chrome)
- [ ] PAX product (created in slice 057) is reachable at `/producten/pax-deuren`

## Blocked by

- Blocked by `issues/057-product-sanity-schema-studio-nav.md`

## User stories addressed

- User story 1
- User story 2
- User story 25
