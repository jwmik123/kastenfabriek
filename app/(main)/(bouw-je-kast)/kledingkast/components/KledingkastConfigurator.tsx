'use client'

import { useEffect } from 'react'
import dynamic from 'next/dynamic'
import type { FullPricingData } from '@/types/configurator-pricing'
import { useClosetStore } from '../store'
import StepWizard from './StepWizard'

const ThreeCanvas = dynamic(() => import('../scene/KledingkastCanvas'), { ssr: false })

export default function KledingkastConfigurator({ pricingData }: { pricingData: FullPricingData }) {
  const hydrate = useClosetStore((s) => s.hydrate)

  useEffect(() => {
    hydrate(pricingData)

    console.log('Hydrated store with pricing data:', pricingData)
  }, [pricingData, hydrate])

  return (
    <>
      <div className="relative configurator-container w-full flex flex-col lg:flex-row pt-[80px]">
      {/* Canvas — left panel */}
        <div className="w-full lg:h-full lg:w-2/3">
        <ThreeCanvas />

      </div>
      {/* Wizard — right panel */}
      <div className="relative w-full lg:w-1/3 min-h-full max-h-full bg-white overflow-y-auto">
        <StepWizard />
      </div>
    </div>

    </>
  )
}
