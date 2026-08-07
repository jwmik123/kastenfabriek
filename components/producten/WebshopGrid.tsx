'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

import { MONO_FONT } from './Eyebrow'

/** Serialisable view of a Sanity product — image URL resolved on the server. */
export interface WebshopProduct {
  id: string
  title: string
  slug: string
  shortDescription: string
  imageUrl: string | null
  /** Category label, derived from the product's type in Sanity. */
  category: string
  price: number | null
  /** Free products (samples) show "Gratis" instead of an amount. */
  isFree: boolean
  singlePrice: boolean
  createdAt: string
}

type SortKey = 'populair' | 'prijs' | 'nieuwste'

const SORT_LABELS: Record<SortKey, string> = {
  populair: 'Populair',
  prijs: 'Prijs — laag naar hoog',
  nieuwste: 'Nieuwste',
}

const euro = new Intl.NumberFormat('nl-NL', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

/** Sort value: free counts as 0, "prijs op aanvraag" sorts last. */
function priceKey(p: WebshopProduct) {
  if (p.isFree) return 0
  return p.price ?? Number.POSITIVE_INFINITY
}

function ProductCard({ product }: { product: WebshopProduct }) {
  const href = `/producten/${product.slug}`
  return (
    <article className="group flex flex-col overflow-hidden rounded-[14px] border border-[#1f2a20]/10 bg-white transition-shadow hover:shadow-[0_18px_40px_-24px_rgba(31,42,32,0.35)]">
      <Link
        href={href}
        className="relative block aspect-square overflow-hidden border-b border-[#1f2a20]/8 bg-white"
      >
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <span style={MONO_FONT}
            className="grid h-full w-full place-items-center px-4 text-center text-[11.5px] uppercase tracking-[0.08em] text-[#7c8477]">
            {product.title}
          </span>
        )}
        <span
          className={`absolute left-3 top-3 rounded-[7px] px-2.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.04em] ${
            product.isFree
              ? 'bg-amber-500 text-[#1f2a20]'
              : 'border border-[#1f2a20]/12 bg-white text-[#1b211c]'
          }`}
        >
          {product.isFree ? 'Gratis' : 'Op voorraad'}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div style={MONO_FONT} className="text-[11px] uppercase tracking-[0.1em] text-[#9aa095]">
          {product.category}
        </div>
        <h3 className="mt-[7px] text-[16.5px] font-semibold tracking-[-0.01em]">
          {product.title}
        </h3>
        <p className="mt-1.5 text-[13.5px] leading-[1.5] text-[#6e7569] line-clamp-2">
          {product.shortDescription}
        </p>

        <div className="mt-auto flex items-center justify-between gap-3 pt-3.5">
          {product.isFree ? (
            <span className="text-lg font-semibold text-primary">Gratis</span>
          ) : product.price == null ? (
            <span className="text-[13.5px] text-[#6e7569]">Prijs op aanvraag</span>
          ) : (
            <span className="flex items-baseline gap-1.5">
              {!product.singlePrice && (
                <span className="text-[11.5px] text-[#9aa095]">vanaf</span>
              )}
              <span className="text-lg font-semibold">{euro.format(product.price)}</span>
            </span>
          )}
          <Link
            href={href}
            className="inline-flex h-[38px] items-center rounded-[10px] bg-[#f1ede4] px-3.5 text-[13.5px] font-medium text-[#1b211c] transition-colors group-hover:bg-primary group-hover:text-[#f1ede4]"
          >
            {product.isFree ? 'Bestel' : 'Bekijk'}
          </Link>
        </div>
      </div>
    </article>
  )
}

/** Filter + sort controls over the real product list. */
export default function WebshopGrid({ products }: { products: WebshopProduct[] }) {
  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category))],
    [products],
  )
  const [category, setCategory] = useState<string | null>(null)
  const [sort, setSort] = useState<SortKey>('populair')

  const visible = useMemo(() => {
    const filtered = category ? products.filter((p) => p.category === category) : products
    if (sort === 'populair') return filtered
    const copy = [...filtered]
    if (sort === 'prijs') copy.sort((a, b) => priceKey(a) - priceKey(b))
    else copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return copy
  }, [products, category, sort])

  // A single category is no choice at all — only offer filters when they filter.
  const showFilters = categories.length > 1

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center gap-4 sm:justify-between">
        {showFilters ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategory(null)}
              className={`h-[38px] rounded-full border px-4 text-[13.5px] transition-colors ${
                category === null
                  ? 'border-primary bg-primary font-medium text-[#f1ede4]'
                  : 'border-[#1f2a20]/16 bg-white text-[#1b211c] hover:border-primary'
              }`}
            >
              Alles <span className="opacity-60">{products.length}</span>
            </button>
            {categories.map((c) => {
              const count = products.filter((p) => p.category === c).length
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`h-[38px] rounded-full border px-4 text-[13.5px] transition-colors ${
                    category === c
                      ? 'border-primary bg-primary font-medium text-[#f1ede4]'
                      : 'border-[#1f2a20]/16 bg-white text-[#1b211c] hover:border-primary'
                  }`}
                >
                  {c} <span className="opacity-60">{count}</span>
                </button>
              )
            })}
          </div>
        ) : (
          <span />
        )}

        {products.length > 1 && (
          <label className="flex items-center gap-2 text-[13.5px] text-[#6e7569]">
            Sorteer op
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-10 rounded-[10px] border border-[#1f2a20]/16 bg-white px-3 text-[13.5px] text-[#1b211c]"
            >
              {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                <option key={k} value={k}>
                  {SORT_LABELS[k]}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visible.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </>
  )
}
