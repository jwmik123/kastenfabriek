## Parent PRD

`issues/prd-pax-doors-product.md`

## What to build

Introduce a generic `product` Sanity document type with a typed `paxConfig` subobject, register it in the schema, and surface it under Commerce → "Producten" in the Studio. Rename the existing Configurator → "Producten" submenu to "Onderdelen" so editors can distinguish webshop products from configurator pricing parts.

See PRD § Implementation Decisions → "Product domain model (Sanity)".

## Acceptance criteria

- [ ] New `product` document type registered with shared fields: `title`, `slug`, `productType` (enum, value `pax-doors`), `shortDescription`, `longDescription` (Portable Text), `heroImage`, `gallery`, `deliveryFee`, `isActive`
- [ ] `paxConfig` subobject defined with `widths`, `heights`, `variants[{widthCm,heightCm,priceEur}]`, optional `allowedMaterialIds`, optional `materialSurcharges[{materialId,surchargeEur}]`, optional `hingeSide`
- [ ] Validation: required fields enforced; `variants` covers all (width, height) pairs (warning is acceptable if not enforceable)
- [ ] Studio nav: new "Producten" entry under Commerce, alongside "Kortingscodes"
- [ ] Configurator → "Producten" submenu renamed to "Onderdelen"
- [ ] Editor can create the PAX product end-to-end in Studio with realistic data and publish it

## Blocked by

None - can start immediately

## User stories addressed

- User story 26
- User story 27
- User story 28
- User story 29
- User story 30
- User story 31
- User story 32
