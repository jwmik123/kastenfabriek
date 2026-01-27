'use client'

import { useEffect } from 'react'
import dynamic from 'next/dynamic'
import type { FullPricingData } from '@/types/configurator-pricing'
import { useClosetStore } from '../store'
import StepWizard from './StepWizard'

const ThreeCanvas = dynamic(() => import('./ThreeCanvas'), { ssr: false })

export default function KledingkastConfigurator({ pricingData }: { pricingData: FullPricingData }) {
  const hydrate = useClosetStore((s) => s.hydrate)

  useEffect(() => {
    hydrate(pricingData)
  }, [pricingData, hydrate])

  return (
    <div className="flex w-screen h-screen">
      <div className="w-3/5 h-full">
        <ThreeCanvas />
      </div>
      <div className="w-2/5 h-full overflow-y-auto border-l border-gray-200 bg-white">
        <StepWizard />
      </div>
    </div>
  )
}
