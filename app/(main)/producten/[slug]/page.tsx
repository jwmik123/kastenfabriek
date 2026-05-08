import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PortableText } from "@portabletext/react";
import { ChevronRight } from "lucide-react";

import { getProductBySlug } from "@/sanity/lib/products";
import { urlFor } from "@/sanity/lib/image";
import PaxDoorConfigurator from "@/components/products/PaxDoorConfigurator";
import { getServerSession } from "@/lib/actions/auth";
import { getDbCartItemById } from "@/lib/actions/cart";
import type { ProductCartItem } from "@/lib/cart/types";

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
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { slug } = await params;
  const { edit } = await searchParams;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const isPax = product.productType === "pax-doors";

  // If editing, fetch existing line server-side for authed users.
  let editItem: ProductCartItem | null = null;
  if (edit) {
    const session = await getServerSession();
    if (session?.user) {
      const item = await getDbCartItemById(edit);
      if (item && item.kind === "product") editItem = item;
    }
    // Anon: client falls back to localStorage cart.
  }

  return (
    <main className="mx-auto max-w-6xl px-4 pt-32 pb-20">
      <nav
        aria-label="Kruimelpad"
        className="mb-8 flex items-center gap-1.5 text-sm text-muted-foreground"
      >
        <Link href="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link
          href="/producten"
          className="hover:text-foreground transition-colors"
        >
          Producten
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground">{product.title}</span>
      </nav>

      {isPax ? (
        <PaxDoorConfigurator
          product={product}
          editItemId={edit ?? null}
          editItem={editItem}
        />
      ) : (
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
      )}

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
