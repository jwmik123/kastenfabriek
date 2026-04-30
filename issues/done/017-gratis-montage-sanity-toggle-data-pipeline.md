# Gratis montage: Sanity toggle + data pipeline

## What to build

Add a `freeMontage` boolean field to the `pricingConfig` Sanity document. It should appear at the top of the document in Studio with Dutch label "Gratis Montage" and description "Wanneer actief, wordt montage gratis aangeboden aan de klant." Default value is `false`.

Wire it through the GROQ pricing data query so the flag is fetched alongside other config fields, and extend the `PricingConfig` TypeScript interface to include it.

End result: a Studio user can flip the toggle and `pricingData.config.freeMontage` is available in both configurator stores.

## Acceptance criteria

- [ ] "Gratis Montage" toggle appears at the top of Pricing Configuration in Sanity Studio
- [ ] Toggle defaults to `false`
- [ ] `pricingDataQuery` includes `freeMontage` in the config projection
- [ ] `pricingConfigQuery` includes `freeMontage` in the config projection
- [ ] `PricingConfig` TypeScript interface has `freeMontage?: boolean`
- [ ] Setting the toggle to `true` in Studio results in `pricingData.config.freeMontage === true` being available in the kledingkast and wasmachinekast stores

## Blocked by

None — can start immediately.
