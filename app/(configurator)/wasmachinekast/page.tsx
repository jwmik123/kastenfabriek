import type { Metadata } from 'next'
import { client } from '@/sanity/lib/client'
import { getConfiguratorServices } from '@/sanity/lib/configuratorServices'
import { pricingDataQuery } from '@/lib/configurator/queries'
import type { FullPricingData } from '@/types/configurator-pricing'
import WasmachinekastConfigurator from './components/WasmachinekastConfigurator'
import ColorwayPreview from './components/ColorwayPreview'
import WasmSummarySection from './components/WasmSummarySection'
import { getServerSession } from '@/lib/actions/auth'
import { getDbCartItemById } from '@/lib/actions/cart'
import type { ClosetConfigSnapshot } from '@/lib/cart/types'
import { SITE_NAME } from '@/lib/site'

const OG_WASMACHINEKAST = {
  url: '/og/wasmachinekast.jpg',
  width: 1200,
  height: 630,
  alt: 'Wasmachinekast op maat met wasmachine, droger, lades en open vakken',
}

export const metadata: Metadata = {
  title: 'Wasmachinekast op maat ontwerpen',
  description:
    'Bouw je wasmachinekast rond jouw apparaten: wasmachine, droger, lades en open vakken op maat — met de prijs direct in beeld.',
  alternates: { canonical: '/wasmachinekast' },
  openGraph: {
    type: 'website',
    locale: 'nl_NL',
    siteName: SITE_NAME,
    url: '/wasmachinekast',
    title: 'Wasmachinekast op maat ontwerpen',
    description:
      'Bouw je wasmachinekast rond jouw apparaten: wasmachine, droger, lades en open vakken op maat — met de prijs direct in beeld.',
    images: [OG_WASMACHINEKAST],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Wasmachinekast op maat ontwerpen',
    description:
      'Bouw je wasmachinekast rond jouw apparaten: wasmachine, droger, lades en open vakken op maat — met de prijs direct in beeld.',
    images: [OG_WASMACHINEKAST.url],
  },
}


export default async function WasmachinekastPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>
}) {
  const { edit } = await searchParams
  const [pricingData, services] = await Promise.all([
    client.fetch<FullPricingData>(pricingDataQuery),
    getConfiguratorServices(),
  ])

  let editConfig: ClosetConfigSnapshot | null = null
  if (edit) {
    const session = await getServerSession()
    if (session?.user) {
      const item = await getDbCartItemById(edit)
      if (item && item.kind === 'closet') editConfig = item.configuration
    }
  }

  return (
    <>
      <WasmachinekastConfigurator
        pricingData={pricingData}
        editConfig={editConfig}
        editItemId={edit ?? null}
      />
      <div className="hidden md:block">
        <ColorwayPreview />
        <WasmSummarySection services={services} />
      </div>
    </>
  )
}
