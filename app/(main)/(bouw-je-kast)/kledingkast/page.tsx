import { client } from '@/sanity/lib/client'
import { pricingDataQuery } from '@/lib/configurator/queries'
import type { FullPricingData } from '@/types/configurator-pricing'
import KledingkastConfigurator from './components/KledingkastConfigurator'

export default async function KledingkastPage() {
  const pricingData: FullPricingData = await client.fetch(pricingDataQuery)

  return (
  
  <>
  <KledingkastConfigurator pricingData={pricingData} />


    </>
)
}
