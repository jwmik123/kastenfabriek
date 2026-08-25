import type { Metadata } from 'next'
import { client } from '@/sanity/lib/client'
import { getConfiguratorServices } from '@/sanity/lib/configuratorServices'
import { pricingDataQuery } from '@/lib/configurator/queries'
import type { FullPricingData } from '@/types/configurator-pricing'
import KledingkastConfigurator from './components/KledingkastConfigurator'
import ClosetSummarySection from './components/ClosetSummarySection'
import ColorwayPreview from './components/ColorwayPreview'
import { getServerSession } from '@/lib/actions/auth'
import { getDbCartItemById } from '@/lib/actions/cart'
import type { ClosetConfigSnapshot } from '@/lib/cart/types'
import { OG_IMAGE, SITE_NAME } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Kledingkast op maat ontwerpen',
  description:
    'Stel je kledingkast tot de millimeter samen: afmetingen, indeling, kleur of houtlook en deuren — met de prijs direct in beeld.',
  alternates: { canonical: '/kledingkast' },
  openGraph: {
    type: 'website',
    locale: 'nl_NL',
    siteName: SITE_NAME,
    url: '/kledingkast',
    title: 'Kledingkast op maat ontwerpen',
    description:
      'Stel je kledingkast tot de millimeter samen: afmetingen, indeling, kleur of houtlook en deuren — met de prijs direct in beeld.',
    images: [OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kledingkast op maat ontwerpen',
    description:
      'Stel je kledingkast tot de millimeter samen: afmetingen, indeling, kleur of houtlook en deuren — met de prijs direct in beeld.',
    images: [OG_IMAGE.url],
  },
}


export default async function KledingkastPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>
}) {
  const { edit } = await searchParams
  const [pricingData, services] = await Promise.all([
    client.fetch<FullPricingData>(pricingDataQuery),
    getConfiguratorServices(),
  ])

  // If editing a specific cart item, fetch its config server-side (authenticated users only)
  let editConfig: ClosetConfigSnapshot | null = null
  if (edit) {
    const session = await getServerSession()
    if (session?.user) {
      const item = await getDbCartItemById(edit)
      if (item && item.kind === 'closet') editConfig = item.configuration
    }
    // Unauthenticated: client reads from localStorage cart (editItemId prop passed below)
  }

  return (
    <>
      <KledingkastConfigurator
        pricingData={pricingData}
        editConfig={editConfig}
        editItemId={edit ?? null}
      />
      <div className="hidden md:block">
        <ColorwayPreview />
        <ClosetSummarySection services={services} />
      </div>
    </>
  )
}
