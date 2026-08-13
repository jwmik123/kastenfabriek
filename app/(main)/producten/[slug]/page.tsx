import Link from "next/link";
import { notFound } from "next/navigation";
import { PortableText } from "@portabletext/react";
import { ChevronRight } from "lucide-react";

import { getProductBySlug } from "@/sanity/lib/products";
import { urlFor } from "@/sanity/lib/image";
import PaxDoorConfigurator from "@/components/products/PaxDoorConfigurator";
import SampleConfigurator from "@/components/products/SampleConfigurator";
import ProductImageGallery from "@/components/products/ProductImageGallery";
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
  searchParams: Promise<{ edit?: string; staal?: string }>;
}) {
  const { slug } = await params;
  // `staal` comes from the homepage material lightbox: one or more material ids
  // to tick straight away in the sample picker.
  const { edit, staal } = await searchParams;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const isPax = product.productType === "pax-doors";
  const isSamples = product.productType === "samples";

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

      {isSamples ? (
        <SampleConfigurator
          product={product}
          preselectedMaterialIds={staal ? staal.split(",") : []}
        />
      ) : isPax ? (
        <PaxDoorConfigurator
          product={product}
          editItemId={edit ?? null}
          editItem={editItem}
        />
      ) : (
        <div className="grid gap-10 lg:grid-cols-2">
          <ProductImageGallery
            images={[
              {
                url: urlFor(product.heroImage).width(1600).height(1600).url(),
                alt: product.title,
              },
              ...(product.gallery ?? []).map((img, i) => ({
                url: urlFor(img).width(1600).height(1600).url(),
                alt: `${product.title} — afbeelding ${i + 1}`,
              })),
            ]}
          />

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

      {product.productInfo && product.productInfo.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-serif text-gray-900 mb-6">
            Productinformatie
          </h2>
          <div className="prose prose-sm max-w-none text-gray-700">
            <PortableText value={product.productInfo} />
          </div>
        </section>
      )}
    </main>
  );
}
