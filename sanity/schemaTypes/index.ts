import { type SchemaTypeDefinition } from "sanity";
import { page } from "./page";
import { siteSettings } from "./siteSettings";
import { moduleLayout } from "./moduleLayout";
import { accessory } from "./accessory";
import { doorType } from "./doorType";
import { installationTier } from "./installationTier";
import { pricingConfig } from "./pricingConfig";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    // Site/CMS
    page,
    siteSettings,
    // Configurator Pricing
    moduleLayout,
    accessory,
    doorType,
    installationTier,
    pricingConfig,
  ],
};
