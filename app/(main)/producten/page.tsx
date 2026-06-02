import Image from "next/image";
import Link from "next/link";

import { getActiveProducts } from "@/sanity/lib/products";
import type { ProductListItem } from "@/sanity/lib/products";
import { urlFor } from "@/sanity/lib/image";

export const metadata = {
  title: "Producten | Kastenfabriek",
  description: "Bekijk de Kastenfabriek webshop producten.",
};

const euro = new Intl.NumberFormat("nl-NL", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function PriceTag({ product }: { product: ProductListItem }) {
  if (product.productType === "samples") {
    return <span className="text-base font-semibold text-emerald-700">Gratis</span>;
  }
  if (product.fromPrice == null) {
    return <span className="text-sm text-gray-500">Prijs op aanvraag</span>;
  }
  return (
    <span className="flex items-baseline gap-1">
      {!product.singlePrice && (
        <span className="text-xs text-gray-500">vanaf</span>
      )}
      <span className="text-lg font-semibold text-gray-900">
        {euro.format(product.fromPrice)}
      </span>
    </span>
  );
}

export default async function ProductenPage() {
  const products = await getActiveProducts();

  return (
    <main className="mx-auto max-w-6xl px-4 pt-32 pb-20">
      <h1 className="text-4xl font-serif text-gray-900 mb-2">Producten</h1>
      <p className="text-gray-600 mb-10">
        Onze webshop producten — kant-en-klaar te bestellen.
      </p>

      {products.length === 0 ? (
        <p className="text-gray-500">Er zijn nog geen producten beschikbaar.</p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <li key={p._id}>
              <Link
                href={`/producten/${p.slug}`}
                className="group flex h-full flex-col bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md hover:border-gray-200 transition-all"
              >
                <div className="relative aspect-[4/3] bg-gray-100">
                  {p.heroImage ? (
                    <Image
                      src={urlFor(p.heroImage).width(800).height(600).url()}
                      alt={p.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#f2ede4] text-2xl font-semibold text-[var(--color-secondary)]">
                      {p.title}
                    </div>
                  )}
                  {p.productType === "samples" && (
                    <span className="absolute left-3 top-3 rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white">
                      Stalen
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h2 className="font-semibold text-lg text-gray-900 mb-1">
                    {p.title}
                  </h2>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                    {p.shortDescription}
                  </p>
                  <div className="mt-auto flex items-center justify-between">
                    <PriceTag product={p} />
                    <span className="text-sm font-medium text-primary group-hover:underline">
                      Bekijk →
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
