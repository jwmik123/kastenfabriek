import { client } from '@/sanity/lib/client'
import { pricingDataQuery } from '@/lib/configurator/queries'
import type { FullPricingData } from '@/types/configurator-pricing'
import WasmachinekastConfigurator from './components/WasmachinekastConfigurator'
import { getServerSession } from '@/lib/actions/auth'
import { getDbCartItemById } from '@/lib/actions/cart'
import type { ClosetConfigSnapshot } from '@/lib/cart/types'

export default async function WasmachinekastPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>
}) {
  const { edit } = await searchParams
  const pricingData: FullPricingData = await client.fetch(pricingDataQuery)

  let editConfig: ClosetConfigSnapshot | null = null
  if (edit) {
    const session = await getServerSession()
    if (session?.user) {
      const item = await getDbCartItemById(edit)
      if (item) editConfig = item.configuration
    }
  }

  return (
    <WasmachinekastConfigurator
      pricingData={pricingData}
      editConfig={editConfig}
      editItemId={edit ?? null}
    />
  )
}
