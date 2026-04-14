import { type SchemaTypeDefinition } from "sanity";
import { page } from "./page";
import { siteSettings } from "./siteSettings";
import { moduleLayout } from "./moduleLayout";
import { accessory } from "./accessory";
import { doorType } from "./doorType";
import { installationTier } from "./installationTier";
import { pricingConfig } from "./pricingConfig";
import { testimonial } from "./testimonial";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    // Site/CMS
    page,
    siteSettings,
    testimonial,
    // Configurator Pricing
    moduleLayout,
    accessory,
    doorType,
    installationTier,
    pricingConfig,
  ],
};
