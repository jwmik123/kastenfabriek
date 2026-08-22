import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight } from 'lucide-react'

import RichText from '@/components/RichText'
import type { LegalDocumentMeta } from '@/lib/legal'
import { getLegalDocumentBody } from '@/sanity/lib/siteSettings'

/**
 * One rendering for every legal document — each route (`/algemene-voorwaarden`
 * and friends) is a three-line file that hands its entry from `lib/legal` to
 * these two helpers.
 */
export function legalMetadata(doc: LegalDocumentMeta): Metadata {
  return {
    title: `${doc.title} | Kasten Fabriek`,
    description: doc.description,
    alternates: { canonical: doc.href },
  }
}

export default async function LegalDocumentPage({
  doc,
}: {
  doc: LegalDocumentMeta
}) {
  const body = await getLegalDocumentBody(doc.key)
  // An unwritten document is a 404 rather than an empty page, which keeps it
  // out of search results until an editor fills it in.
  if (!body) notFound()

  return (
    <div className="min-h-screen bg-[#f2ede4] pt-[118px] font-poppins text-[#1b211c]">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <nav
          aria-label="Kruimelpad"
          className="mb-8 flex items-center gap-1.5 text-sm text-gray-500"
        >
          <Link href="/" className="transition-colors hover:text-gray-900">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-gray-900">{doc.title}</span>
        </nav>

        <header className="mb-8">
          <h1 className="text-3xl font-bold leading-tight md:text-4xl">
            {doc.title}
          </h1>
          <p className="mt-3 text-lg text-gray-600">{doc.description}</p>
        </header>

        <article className="rounded-2xl bg-white px-6 py-8 md:px-10 md:py-10 [&>:first-child]:mt-0">
          <RichText value={body} />
        </article>
      </div>
    </div>
  )
}
