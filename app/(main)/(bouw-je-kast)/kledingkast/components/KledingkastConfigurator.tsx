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
    <div className="relative w-screen h-[calc(100vh-100px)] mt-[100px]">
      {/* Canvas fills entire background */}
      <div className="absolute inset-0">
        <ThreeCanvas />
      </div>
      {/* Floating wizard panel */}
      <div className="absolute top-8 right-8 w-1/3 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl overflow-y-auto">
        <StepWizard />
      </div>
    </div>
  )
}
