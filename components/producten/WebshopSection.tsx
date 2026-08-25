import Link from 'next/link'

import { CONFIGURATORS_HREF, WEBSHOP_ANCHOR } from '@/lib/configurators'
import { urlFor } from '@/sanity/lib/image'
import type { ProductListItem, ProductType } from '@/sanity/lib/products'

import WebshopGrid, { type WebshopProduct } from './WebshopGrid'

/** Category label per product type — the only grouping Sanity currently stores. */
const CATEGORY_LABELS: Record<ProductType, string> = {
  'pax-doors': 'Deuren & fronten',
  samples: 'Stalen',
  simple: 'Losse producten',
}

export function toWebshopProduct(p: ProductListItem): WebshopProduct {
  return {
    id: p._id,
    title: p.title,
    slug: p.slug,
    shortDescription: p.shortDescription,
    imageUrl: p.heroImage ? urlFor(p.heroImage).width(800).height(800).url() : null,
    category: CATEGORY_LABELS[p.productType] ?? 'Overig',
    price: p.fromPrice,
    isFree: p.productType === 'samples',
    singlePrice: p.singlePrice,
    createdAt: p._createdAt,
  }
}

/** "02 — Webshop": everything orderable without a configurator. */
export default function WebshopSection({ products }: { products: ProductListItem[] }) {
  return (
    <section id={WEBSHOP_ANCHOR} className="scroll-mt-[124px] py-16 sm:py-24">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-10">
        <div className="grid items-end gap-8 border-b border-[#1f2a20]/14 pb-6 md:grid-cols-[1fr_auto] md:gap-12">
          <div>
            <h2 className="text-[32px] font-semibold leading-[1.08] tracking-[-0.025em] sm:text-[42px]">
              Direct te bestellen
            </h2>
            <p className="mt-3.5 max-w-[58ch] text-[16.5px] leading-[1.6] text-[#555c51]">
              Kant-en-klare producten en losse onderdelen — geen configurator nodig,
              gewoon in je winkelwagen.
            </p>
          </div>
          <Link
            href={CONFIGURATORS_HREF}
            className="inline-flex items-center gap-2 self-start border-b border-[#1f2a20]/30 pb-1 text-sm font-medium hover:border-primary hover:text-primary md:self-end"
          >
            Liever helemaal op maat? <span aria-hidden="true">→</span>
          </Link>
        </div>

        {products.length === 0 ? (
          <p className="mt-8 text-[#6e7569]">Er zijn nog geen producten beschikbaar.</p>
        ) : (
          <WebshopGrid products={products.map(toWebshopProduct)} />
        )}
      </div>
    </section>
  )
}
