'use client'

import { useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import type { FullPricingData } from '@/types/configurator-pricing'
import type { ClosetConfigSnapshot } from '@/lib/cart/types'
import { useClosetStore } from '../store'
import StepWizard from './StepWizard'
import MobileSheet from './MobileSheet'
import { getDraftConfig, saveDraftConfig } from '@/lib/cart/draft-config'
import { getCart } from '@/lib/cart/cart-store'

const ThreeCanvas = dynamic(() => import('../scene/KledingkastCanvas'), { ssr: false })

interface Props {
  pricingData: FullPricingData
  editConfig: ClosetConfigSnapshot | null
  editItemId: string | null
}

export default function KledingkastConfigurator({ pricingData, editConfig, editItemId }: Props) {
  const hydrate = useClosetStore((s) => s.hydrate)
  const restoreConfig = useClosetStore((s) => s.restoreConfig)
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 1. Hydrate pricing data, then restore config (priority: URL cart item > localStorage draft)
  useEffect(() => {
    hydrate(pricingData)

    if (editConfig) {
      // Server-fetched config (authenticated user editing a DB cart item)
      restoreConfig(editConfig)
    } else if (editItemId) {
      // Unauthenticated: find in localStorage cart
      const item = getCart().items.find((i) => i.id === editItemId)
      if (item) restoreConfig(item.configuration)
    } else {
      // Restore autosaved draft if available
      const draft = getDraftConfig()
      if (draft) restoreConfig(draft)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally run once on mount

  // 2. Autosave: subscribe to store changes, debounce-write to localStorage draft
  useEffect(() => {
    const unsub = useClosetStore.subscribe((state) => {
      if (!state.pricingData) return // don't overwrite draft with unhydrated defaults
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
      autosaveTimer.current = setTimeout(() => {
        const config: ClosetConfigSnapshot = {
          id: crypto.randomUUID(),
          capturedAt: new Date().toISOString(),
          widthCm: state.width,
          heightCm: state.height,
          depthCm: state.depth,
          moduleCount: state.moduleCount,
          modules: state.modules.map((m) => ({
            slotIndex: m.slotIndex,
            layoutId: m.layoutId,
            layoutName: state.moduleLayouts.find((l) => l.layoutId === m.layoutId)?.name ?? null,
            hasDoor: m.hasDoor,
            span: m.span,
            buitenkantMaterialId: m.buitenkantMaterialId,
            binnenkantMaterialId: m.binnenkantMaterialId,
          })),
          buitenkantMaterialId: state.buitenkantMaterialId,
          binnenkantMaterialId: state.binnenkantMaterialId,
          doorHandleId: state.doorHandleId,
          diagonalSide: state.diagonalSide,
          leftDiagStartHeight: state.leftDiagStartHeight,
          rightDiagStartHeight: state.rightDiagStartHeight,
          leftDiagTopWidth:  state.leftDiagTopWidth,
          rightDiagTopWidth: state.rightDiagTopWidth,
          placementType: state.placementType,
          backDiagonal: state.backDiagonal,
          backDiagKinkHeight: state.backDiagKinkHeight,
          backDiagFlatSectionDepth: state.backDiagFlatSectionDepth,
          lightStripsEnabled: state.lightStripsEnabled,
          powerCableHolesEnabled: state.powerCableHolesEnabled,
          hasTopCabinet: state.needsTopCabinet(),
          topCabinetHeightCm: state.topCabinetHeight(),
        }
        saveDraftConfig(config)
      }, 500)
    })

    return () => {
      unsub()
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    }
  }, [])

  return (
    <>
      <div className="w-full h-[100dvh] md:h-[92vh] flex flex-col lg:flex-row">
        {/* Canvas — full viewport on mobile, 50vh on tablet, full-height on desktop */}
        <div className="w-full h-full md:h-[50vh] lg:h-full lg:w-2/3">
          <ThreeCanvas />
        </div>
        {/* Wizard — desktop/tablet only, hidden on mobile (sheet handles it) */}
        <div className="hidden md:block relative w-full lg:w-1/3 h-full bg-white overflow-y-auto pt-24">
          <StepWizard />
        </div>
      </div>
      {/* Mobile bottom sheet — vaul, only visible below md */}
      <MobileSheet />
    </>
  )
}
