import WebshopSection from "@/components/producten/WebshopSection";
import { getActiveProducts } from "@/sanity/lib/products";

export const metadata = {
  title: "Producten",
  description: "Kant-en-klare producten en onderdelen, direct te bestellen.",
};

export default async function ProductenPage() {
  const products = await getActiveProducts();

  return (
    // pt clears the site's fixed nav (promo strip + nav row).
    <div className="min-h-screen bg-white font-poppins text-[#1b211c] pt-[118px]">
      <h1 className="sr-only">Producten</h1>

      <WebshopSection products={products} />
    </div>
  );
}
