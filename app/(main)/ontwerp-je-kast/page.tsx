import ConfiguratorsSection from "@/components/producten/ConfiguratorsSection";
import SamplesBanner from "@/components/producten/SamplesBanner";
import { pricingConfigQuery } from "@/lib/configurator/queries";
import {
  configuratorsWithSpecs,
  type DimensionConstraints,
} from "@/lib/configurators";
import { client } from "@/sanity/lib/client";
import { getActiveProducts } from "@/sanity/lib/products";

export const metadata = {
  title: "Ontwerp je kast",
  description:
    "Stel je kledingkast of wasmachinekast zelf samen in de configurator — direct zichtbaar wat hij kost.",
};

export default async function OntwerpJeKastPage() {
  const [products, pricingConfig] = await Promise.all([
    getActiveProducts(),
    client.fetch<{ constraints?: DimensionConstraints } | null>(pricingConfigQuery),
  ]);

  // Dimension ranges on the cards come from the same Sanity document the
  // configurators read, so the two can't drift apart.
  const configurators = configuratorsWithSpecs(pricingConfig?.constraints);
  const samplesProduct = products.find((p) => p.productType === "samples");

  return (
    // pt clears the site's fixed nav (promo strip + nav row).
    <div className="min-h-screen bg-[#f1ede4] font-poppins text-[#1b211c] pt-[118px]">
      <h1 className="sr-only">Ontwerp je kast</h1>

      <ConfiguratorsSection configurators={configurators} />
      {samplesProduct && <SamplesBanner product={samplesProduct} />}
    </div>
  );
}
