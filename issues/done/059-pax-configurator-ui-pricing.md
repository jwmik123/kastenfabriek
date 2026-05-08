## Parent PRD

`issues/prd-pax-doors-product.md`

## What to build

Add the PAX door configurator UI to the PDP: width buttons, height buttons, material swatch grid, quantity stepper, live total price, and the existing colorway preview reused with the chosen material. Pricing is computed by a new pure module `calcProductPrice` that is unit-tested in isolation. No add-to-cart wiring in this slice.

See PRD § Implementation Decisions → "PaxDoorConfigurator (client component)" and "Pricing".

## Acceptance criteria

- [ ] New `lib/products/pricing.ts` exports `calcProductPrice({ product, widthCm, heightCm, materialId, qty }) → ProductPriceSnapshot`
- [ ] Pure: no side effects, no Sanity client calls inside the function
- [ ] Throws on missing variant for the requested (width, height)
- [ ] Adds `materialSurcharge` when present in `paxConfig.materialSurcharges`; zero otherwise
- [ ] Unit tests cover: each variant lookup, surcharge applied, surcharge absent, missing variant throws, qty independence
- [ ] PDP mounts a client `PaxDoorConfigurator` component dispatched by `productType`
- [ ] Width buttons show the values from `paxConfig.widths`; height buttons from `paxConfig.heights`
- [ ] Material swatch grid shows materials filtered by `allowedMaterialIds` (all materials when omitted)
- [ ] Quantity stepper allows 1–10
- [ ] Live total updates instantly on any input change
- [ ] Preview shows two colorway photos for the chosen material via the existing `/colorways/{slug}-{1|2}.webp` mapping (reusing or extracting the `slugFor` mapping from `ColorwayPreview`)
- [ ] Add-to-cart button is rendered but disabled / no-op (wired in next slice)

## Blocked by

- Blocked by `issues/058-producten-listing-pdp-scaffold.md`

## User stories addressed

- User story 3
- User story 4
- User story 5
- User story 6
- User story 7
- User story 8
- User story 9
- User story 35
