import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { urlFor } from '@/sanity/lib/image'
import type { KennisbankCardItem } from '@/sanity/lib/kennisbank'
import { cn } from '@/lib/utils'
import { MEDIA_TYPE_META, formatFileSize, formatPublishedAt } from './mediaType'

/**
 * One item in the kennisbank grid. Cover images go through the Sanity image
 * pipeline at card size with automatic format (AVIF/WebP), so a 4000 px upload
 * never reaches the browser.
 */
export default function KennisbankCard({
  item,
  priority = false,
}: {
  item: KennisbankCardItem
  priority?: boolean
}) {
  const meta = MEDIA_TYPE_META[item.mediaType]
  const Icon = meta.icon
  const src = urlFor(item.coverImage)
    .width(800)
    .height(600)
    .fit('crop')
    .auto('format')
    .quality(75)
    .url()
  const pdfSize = item.mediaType === 'pdf' ? formatFileSize(item.pdfFile?.size) : null

  return (
    <article className="group h-full">
      <Link
        href={`/kennisbank/${item.slug}`}
        className="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-lg"
        data-testid="kennisbank-card"
        data-media-type={item.mediaType}
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
          <Image
            src={src}
            alt={item.coverImage.alt ?? item.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={priority}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />

          <span
            className={cn(
              'absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1',
              'bg-white/90 text-xs font-medium text-gray-800 backdrop-blur-sm',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {meta.label}
          </span>

          {item.mediaType === 'video' && (
            <span
              aria-hidden
              className="absolute inset-0 flex items-center justify-center"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-transform group-hover:scale-110">
                <Icon className="h-6 w-6 translate-x-0.5 fill-current" />
              </span>
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col p-5">
          <p className="text-xs text-gray-400">
            {formatPublishedAt(item.publishedAt)}
            {pdfSize ? ` · PDF, ${pdfSize}` : ''}
          </p>
          <h3 className="mt-1 text-lg font-semibold leading-snug text-gray-900 transition-colors group-hover:text-[var(--color-secondary)]">
            {item.title}
          </h3>
          <p className="mt-2 line-clamp-3 text-sm text-gray-600">{item.excerpt}</p>

          {item.categories?.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-1.5">
              {item.categories.map((c) => (
                <li
                  key={c._id}
                  className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] text-gray-600"
                >
                  {c.title}
                </li>
              ))}
            </ul>
          )}

          <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-secondary)]">
            {item.mediaType === 'pdf'
              ? 'Bekijk handleiding'
              : item.mediaType === 'video'
                ? 'Bekijk video'
                : 'Lees artikel'}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </Link>
    </article>
  )
}
