import Image from "next/image";
import Link from "next/link";

import { getActiveProducts } from "@/sanity/lib/products";
import { urlFor } from "@/sanity/lib/image";

export const metadata = {
  title: "Producten | Kastenfabriek",
  description: "Bekijk de Kastenfabriek webshop producten.",
};

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
        <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <li key={p._id}>
              <Link
                href={`/producten/${p.slug}`}
                className="group block bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="relative aspect-[4/3] bg-gray-100">
                  <Image
                    src={urlFor(p.heroImage).width(800).height(600).url()}
                    alt={p.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-5">
                  <h2 className="font-semibold text-lg text-gray-900 mb-1">
                    {p.title}
                  </h2>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                    {p.shortDescription}
                  </p>
                  <span className="text-sm font-medium text-primary group-hover:underline">
                    Bekijk product →
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
