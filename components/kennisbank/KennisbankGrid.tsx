'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'

import type {
  KennisbankCardItem,
  KennisbankCategory,
  KennisbankMediaType,
} from '@/sanity/lib/kennisbank'
import { cn } from '@/lib/utils'
import KennisbankCard from './KennisbankCard'
import { MEDIA_TYPES, MEDIA_TYPE_META } from './mediaType'

type TypeFilter = KennisbankMediaType | 'alles'

function FilterChip({
  active,
  onClick,
  children,
  count,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  count?: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
        active
          ? 'border-[var(--color-secondary)] bg-[var(--color-secondary)] text-white'
          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400',
      )}
    >
      {children}
      {count != null && (
        <span className={cn('text-xs', active ? 'text-white/70' : 'text-gray-400')}>
          {count}
        </span>
      )}
    </button>
  )
}

/**
 * Overview grid with type, category and text filters. Filtering happens in the
 * browser over the already-fetched list — the kennisbank is small enough that
 * one payload beats a round trip per click — and the active filters are mirrored
 * into the URL so a filtered view can be shared.
 */
export default function KennisbankGrid({
  items,
  categories,
  initialType = 'alles',
  initialCategory = 'alle',
  initialQuery = '',
}: {
  items: KennisbankCardItem[]
  categories: KennisbankCategory[]
  initialType?: TypeFilter
  initialCategory?: string
  initialQuery?: string
}) {
  const [type, setType] = useState<TypeFilter>(initialType)
  const [category, setCategory] = useState<string>(initialCategory)
  const [query, setQuery] = useState<string>(initialQuery)

  // Mirror the filters into the URL without a navigation, so refreshing or
  // sharing keeps the view.
  useEffect(() => {
    const params = new URLSearchParams()
    if (type !== 'alles') params.set('type', type)
    if (category !== 'alle') params.set('categorie', category)
    if (query.trim()) params.set('q', query.trim())
    const qs = params.toString()
    window.history.replaceState(
      null,
      '',
      qs ? `${window.location.pathname}?${qs}` : window.location.pathname,
    )
  }, [type, category, query])

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { alles: items.length }
    for (const t of MEDIA_TYPES) {
      counts[t] = items.filter((i) => i.mediaType === t).length
    }
    return counts
  }, [items])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((item) => {
      if (type !== 'alles' && item.mediaType !== type) return false
      if (
        category !== 'alle' &&
        !(item.categories ?? []).some((c) => c.slug === category)
      ) {
        return false
      }
      if (!q) return true
      return (
        item.title.toLowerCase().includes(q) ||
        item.excerpt.toLowerCase().includes(q) ||
        (item.categories ?? []).some((c) => c.title.toLowerCase().includes(q))
      )
    })
  }, [items, type, category, query])

  const hasFilters = type !== 'alles' || category !== 'alle' || query.trim() !== ''

  return (
    <div>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2" data-testid="type-filters">
          <FilterChip
            active={type === 'alles'}
            onClick={() => setType('alles')}
            count={typeCounts.alles}
          >
            Alles
          </FilterChip>
          {MEDIA_TYPES.map((t) => {
            const meta = MEDIA_TYPE_META[t]
            const Icon = meta.icon
            return (
              <FilterChip
                key={t}
                active={type === t}
                onClick={() => setType(t)}
                count={typeCounts[t]}
              >
                <Icon className="h-4 w-4" />
                {meta.plural}
              </FilterChip>
            )
          })}

          <div className="relative ml-auto w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Zoeken…"
              aria-label="Zoeken in de kennisbank"
              data-testid="kennisbank-search"
              className="h-10 w-full rounded-full border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-gray-400"
            />
          </div>
        </div>

        {categories.length > 0 && (
          <div className="flex flex-wrap items-center gap-2" data-testid="category-filters">
            <FilterChip active={category === 'alle'} onClick={() => setCategory('alle')}>
              Alle onderwerpen
            </FilterChip>
            {categories.map((c) => (
              <FilterChip
                key={c._id}
                active={category === c.slug}
                onClick={() => setCategory(c.slug)}
              >
                {c.title}
              </FilterChip>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <p className="text-sm text-gray-500" aria-live="polite">
          {visible.length} {visible.length === 1 ? 'item' : 'items'}
        </p>
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setType('alles')
              setCategory('alle')
              setQuery('')
            }}
            className="inline-flex items-center gap-1 text-sm text-gray-500 underline underline-offset-4 hover:text-gray-900"
          >
            <X className="h-3.5 w-3.5" />
            Filters wissen
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        <p className="mt-10 rounded-2xl bg-white p-10 text-center text-gray-500">
          Niets gevonden. Pas je filters aan of zoek op een andere term.
        </p>
      ) : (
        <div
          className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          data-testid="kennisbank-grid"
        >
          {visible.map((item, i) => (
            <KennisbankCard key={item._id} item={item} priority={i < 3} />
          ))}
        </div>
      )}
    </div>
  )
}
