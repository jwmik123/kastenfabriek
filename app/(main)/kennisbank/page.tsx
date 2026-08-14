import type { Metadata } from 'next'

import KennisbankGrid from '@/components/kennisbank/KennisbankGrid'
import {
  getKennisbankCategories,
  getKennisbankItems,
  type KennisbankMediaType,
} from '@/sanity/lib/kennisbank'

export const metadata: Metadata = {
  title: 'Kennisbank | Kastenfabriek',
  description:
    'Artikelen, video&apos;s en handleidingen over ontwerpen, bestellen en monteren van je kast.',
}

// Editors publish through Sanity; revalidate so new items appear without a deploy.
export const revalidate = 60

const MEDIA_TYPES: KennisbankMediaType[] = ['artikel', 'video', 'pdf']

export default async function KennisbankPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; categorie?: string; q?: string }>
}) {
  const [{ type, categorie, q }, items, categories] = await Promise.all([
    searchParams,
    getKennisbankItems(),
    getKennisbankCategories(),
  ])

  // Deep links render server-side with the filter already applied.
  const initialType = MEDIA_TYPES.includes(type as KennisbankMediaType)
    ? (type as KennisbankMediaType)
    : 'alles'
  const initialCategory = categories.some((c) => c.slug === categorie)
    ? (categorie as string)
    : 'alle'

  return (
    // pt clears the site's fixed nav (promo strip + nav row).
    <div className="min-h-screen bg-[#f2ede4] pt-[118px] font-poppins text-[#1b211c]">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <header className="mb-10 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-secondary)]">
            Kennisbank
          </p>
          <h1 className="mt-2 font-poppins text-4xl font-bold leading-tight md:text-5xl">
            Alles om zelf verder te kunnen
          </h1>
          <p className="mt-4 text-gray-600">
            Artikelen, video&apos;s en handleidingen over inmeten, bestellen, monteren
            en onderhouden. Filter op wat je zoekt.
          </p>
        </header>

        {items.length === 0 ? (
          <p className="rounded-2xl bg-white p-10 text-center text-gray-500">
            Er staat nog niets in de kennisbank. Voeg items toe in Sanity Studio onder
            &ldquo;Kennisbank&rdquo;.
          </p>
        ) : (
          <KennisbankGrid
            items={items}
            categories={categories}
            initialType={initialType}
            initialCategory={initialCategory}
            initialQuery={q ?? ''}
          />
        )}
      </div>
    </div>
  )
}
