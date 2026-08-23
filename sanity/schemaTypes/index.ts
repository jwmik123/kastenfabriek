import { type SchemaTypeDefinition } from "sanity";
import { page } from "./page";
import { promoText } from "./promoText";
import { richText } from "./richText";
import { siteSettings } from "./siteSettings";
import { moduleLayout } from "./moduleLayout";
import { accessory } from "./accessory";
import { doorType } from "./doorType";
import { handle } from "./handle";
import { installationTier } from "./installationTier";
import { pricingConfig } from "./pricingConfig";
import { testimonial } from "./testimonial";
import { hotspotSection } from "./hotspotSection";
import { coupon } from "./coupon";
import { productSchemaTypes } from "./product";
import { kennisbankSchemaTypes } from "./kennisbank";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    // Site/CMS
    promoText,
    richText,
    page,
    siteSettings,
    testimonial,
    hotspotSection,
    ...kennisbankSchemaTypes,
    // Configurator Pricing
    moduleLayout,
    accessory,
    doorType,
    handle,
    installationTier,
    pricingConfig,
    // Commerce
    coupon,
    ...productSchemaTypes,
  ],
};
