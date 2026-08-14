import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { PortableText, type PortableTextComponents } from '@portabletext/react'

import KennisbankCard from '@/components/kennisbank/KennisbankCard'
import PdfPanel from '@/components/kennisbank/PdfPanel'
import VideoPlayer from '@/components/kennisbank/VideoPlayer'
import {
  MEDIA_TYPE_META,
  formatPublishedAt,
} from '@/components/kennisbank/mediaType'
import { urlFor } from '@/sanity/lib/image'
import {
  getKennisbankItem,
  getKennisbankSlugs,
  getRelatedKennisbankItems,
} from '@/sanity/lib/kennisbank'

export const revalidate = 60

export async function generateStaticParams() {
  const slugs = await getKennisbankSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const item = await getKennisbankItem(slug)
  if (!item) return { title: 'Niet gevonden | Kastenfabriek' }
  return {
    title: `${item.title} | Kennisbank | Kastenfabriek`,
    description: item.seoDescription ?? item.excerpt,
    openGraph: {
      title: item.title,
      description: item.seoDescription ?? item.excerpt,
      images: [urlFor(item.coverImage).width(1200).height(630).fit('crop').url()],
    },
  }
}

/**
 * Article rendering. The project has no typography plugin, so every block and
 * mark gets its own styling here rather than relying on `prose`.
 */
const portableTextComponents: PortableTextComponents = {
  block: {
    normal: ({ children }) => (
      <p className="mb-5 leading-relaxed text-gray-700">{children}</p>
    ),
    h2: ({ children }) => (
      <h2 className="mb-3 mt-10 text-2xl font-semibold text-gray-900">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="mb-2 mt-8 text-xl font-semibold text-gray-900">{children}</h3>
    ),
    h4: ({ children }) => (
      <h4 className="mb-2 mt-6 text-lg font-semibold text-gray-900">{children}</h4>
    ),
    blockquote: ({ children }) => (
      <blockquote className="my-6 border-l-4 border-[var(--color-secondary)] pl-5 text-lg italic text-gray-700">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="mb-5 list-disc space-y-2 pl-6 text-gray-700">{children}</ul>
    ),
    number: ({ children }) => (
      <ol className="mb-5 list-decimal space-y-2 pl-6 text-gray-700">{children}</ol>
    ),
  },
  listItem: {
    bullet: ({ children }) => <li className="leading-relaxed">{children}</li>,
    number: ({ children }) => <li className="leading-relaxed">{children}</li>,
  },
  marks: {
    strong: ({ children }) => (
      <strong className="font-semibold text-gray-900">{children}</strong>
    ),
    em: ({ children }) => <em className="italic">{children}</em>,
    link: ({ value, children }) => {
      const href = (value?.href ?? '') as string
      const external = /^https?:\/\//.test(href)
      return (
        <a
          href={href}
          target={external ? '_blank' : undefined}
          rel={external ? 'noopener noreferrer' : undefined}
          className="text-[var(--color-secondary)] underline underline-offset-4"
        >
          {children}
        </a>
      )
    },
  },
  types: {
    image: ({ value }) => {
      const src = urlFor(value).width(1600).auto('format').quality(80).url()
      return (
        <figure className="my-8">
          <Image
            src={src}
            alt={value.alt ?? ''}
            width={1600}
            height={1067}
            sizes="(max-width: 768px) 100vw, 768px"
            className="h-auto w-full rounded-2xl"
          />
          {value.caption && (
            <figcaption className="mt-2 text-center text-sm text-gray-500">
              {value.caption}
            </figcaption>
          )}
        </figure>
      )
    },
  },
}

export default async function KennisbankItemPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const item = await getKennisbankItem(slug)
  if (!item) notFound()

  const related = await getRelatedKennisbankItems(item)
  const meta = MEDIA_TYPE_META[item.mediaType]
  const Icon = meta.icon
  const posterUrl = urlFor(item.coverImage)
    .width(1600)
    .height(900)
    .fit('crop')
    .auto('format')
    .quality(75)
    .url()

  return (
    <div className="min-h-screen bg-[#f2ede4] pt-[118px] font-poppins text-[#1b211c]">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <nav
          aria-label="Kruimelpad"
          className="mb-8 flex items-center gap-1.5 text-sm text-gray-500"
        >
          <Link href="/" className="transition-colors hover:text-gray-900">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/kennisbank" className="transition-colors hover:text-gray-900">
            Kennisbank
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-gray-900">{item.title}</span>
        </nav>

        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-800">
              <Icon className="h-3.5 w-3.5" />
              {meta.label}
            </span>
            <time dateTime={item.publishedAt}>{formatPublishedAt(item.publishedAt)}</time>
          </div>
          <h1 className="mt-4 text-3xl font-bold leading-tight md:text-4xl">
            {item.title}
          </h1>
          <p className="mt-3 text-lg text-gray-600">{item.excerpt}</p>
          {item.categories?.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {item.categories.map((c) => (
                <li key={c._id}>
                  <Link
                    href={`/kennisbank?categorie=${c.slug}`}
                    className="rounded-full bg-white px-3 py-1 text-xs text-gray-600 transition-colors hover:text-gray-900"
                  >
                    {c.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </header>

        {item.mediaType === 'video' ? (
          <VideoPlayer
            fileUrl={item.videoFile?.url}
            externalUrl={item.videoUrl}
            posterUrl={posterUrl}
            title={item.title}
          />
        ) : item.mediaType === 'pdf' && item.pdfFile ? (
          <PdfPanel file={item.pdfFile} title={item.title} />
        ) : (
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-gray-100">
            <Image
              src={posterUrl}
              alt={item.coverImage.alt ?? item.title}
              fill
              sizes="(max-width: 1024px) 100vw, 896px"
              priority
              className="object-cover"
            />
          </div>
        )}

        {item.body && item.body.length > 0 && (
          <article className="mt-10 text-base">
            <PortableText value={item.body} components={portableTextComponents} />
          </article>
        )}

        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="mb-6 text-xl font-semibold">Meer uit de kennisbank</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <KennisbankCard key={r._id} item={r} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
