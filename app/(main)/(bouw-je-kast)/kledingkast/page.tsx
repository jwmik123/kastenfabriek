import { client } from '@/sanity/lib/client'
import { pricingDataQuery } from '@/lib/configurator/queries'
import type { FullPricingData } from '@/types/configurator-pricing'
import KledingkastConfigurator from './components/KledingkastConfigurator'
import ClosetSummarySection from './components/ClosetSummarySection'
import { getServerSession } from '@/lib/actions/auth'
import { getDbCartItemById } from '@/lib/actions/cart'
import type { ClosetConfigSnapshot } from '@/lib/cart/types'

export default async function KledingkastPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>
}) {
  const { edit } = await searchParams
  const pricingData: FullPricingData = await client.fetch(pricingDataQuery)

  // If editing a specific cart item, fetch its config server-side (authenticated users only)
  let editConfig: ClosetConfigSnapshot | null = null
  if (edit) {
    const session = await getServerSession()
    if (session?.user) {
      const item = await getDbCartItemById(edit)
      if (item) editConfig = item.configuration
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
      <ClosetSummarySection />
    </>
  )
}
