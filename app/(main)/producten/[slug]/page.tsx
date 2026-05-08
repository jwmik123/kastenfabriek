import Image from "next/image";
import { notFound } from "next/navigation";
import { PortableText } from "@portabletext/react";

import { getProductBySlug } from "@/sanity/lib/products";
import { urlFor } from "@/sanity/lib/image";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product niet gevonden | Kastenfabriek" };
  return {
    title: `${product.title} | Kastenfabriek`,
    description: product.shortDescription,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  return (
    <main className="mx-auto max-w-6xl px-4 pt-32 pb-20">
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden">
          <Image
            src={urlFor(product.heroImage).width(1200).height(1200).url()}
            alt={product.title}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
            className="object-cover"
          />
        </div>

        <div>
          <h1 className="text-4xl font-serif text-gray-900 mb-3">
            {product.title}
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            {product.shortDescription}
          </p>

          <div className="prose prose-sm max-w-none text-gray-700">
            <PortableText value={product.longDescription} />
          </div>
        </div>
      </div>

      {product.gallery && product.gallery.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-serif text-gray-900 mb-6">Galerij</h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {product.gallery.map((img, i) => (
              <li
                key={i}
                className="relative aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden"
              >
                <Image
                  src={urlFor(img).width(800).height(600).url()}
                  alt={`${product.title} — afbeelding ${i + 1}`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover"
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
