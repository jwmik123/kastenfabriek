'use client'

import { useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import type { FullPricingData } from '@/types/configurator-pricing'
import type { ClosetConfigSnapshot } from '@/lib/cart/types'
import { useClosetStore } from '../store'
import { ConfiguratorStoreContext } from '../../_shared/store/context'
import ConfiguratorTopBar from '../../_shared/components/ConfiguratorTopBar'
import ConfiguratorMobileHeader from '../../_shared/components/ConfiguratorMobileHeader'
import ConfiguratorTourProvider from '../../_shared/tour/ConfiguratorTourProvider'
import { kledingkastTourSteps } from '../../_shared/tour/tourSteps'
import { useCartPrice } from '../hooks/useCartPrice'
import StepWizard from './StepWizard'

const TOP_BAR_STEPS = [
  { label: 'Afmetingen', number: 1 },
  { label: 'Indeling', number: 2 },
  { label: 'Materiaal', number: 3 },
  { label: 'Handgrepen', number: 4 },
  { label: 'Accessoires', number: 5 },
]
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
  const step = useClosetStore((s) => s.step)
  const setStep = useClosetStore((s) => s.setStep)
  const { totalPrice } = useCartPrice()
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
      if (item && item.kind === 'closet') restoreConfig(item.configuration)
    } else {
      // Restore autosaved draft if available
      const draft = getDraftConfig('kledingkast')
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
            hasPowerHole: m.hasPowerHole ?? false,
          })),
          buitenkantMaterialId: state.buitenkantMaterialId,
          binnenkantMaterialId: state.binnenkantMaterialId,
          doorHandleId: state.doorHandleId,
          doorHandleName: state.doorHandleId === 'none'
            ? 'Greeploos (push-to-open)'
            : (state.pricingData?.handles.find((h) => h.id === state.doorHandleId)?.nameNl
              ?? state.pricingData?.handles.find((h) => h.id === state.doorHandleId)?.name
              ?? null),
          diagonalSide: state.diagonalSide,
          leftDiagStartHeight: state.leftDiagStartHeight,
          rightDiagStartHeight: state.rightDiagStartHeight,
          leftDiagTopWidth:  state.leftDiagTopWidth,
          rightDiagTopWidth: state.rightDiagTopWidth,
          placementType: state.placementType,
          backDiagonal: state.backDiagonal,
          backDiagKinkHeight: state.backDiagKinkHeight,
          backDiagFlatSectionDepth: state.backDiagFlatSectionDepth,
          doorHandleMaterial: state.doorHandleMaterial,
          doorsExtendToFloor: state.doorsExtendToFloor,
          sidePanelThickness: state.sidePanelThickness,
          lightStripsEnabled: state.lightStripsEnabled,
          hasTopCabinet: state.needsTopCabinet(),
          topCabinetHeightCm: state.topCabinetHeight(),
        }
        saveDraftConfig(config, 'kledingkast')
      }, 500)
    })

    return () => {
      unsub()
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    }
  }, [])

  return (
    <ConfiguratorStoreContext.Provider value={useClosetStore}>
      <ConfiguratorTourProvider steps={kledingkastTourSteps}>
        <div className="w-full h-[100dvh] md:h-[95vh] flex flex-col">
          <ConfiguratorMobileHeader price={totalPrice} productName="Kledingkast" />
          <div className="hidden md:block">
            <ConfiguratorTopBar
              steps={TOP_BAR_STEPS}
              currentStep={step}
              onStep={setStep}
              productName="Kledingkast"
            />
          </div>
          <div className="flex flex-1 min-h-0 flex-col lg:flex-row">
            <div className="w-full h-[40svh] shrink-0 md:h-[50vh] lg:h-full lg:flex-1 lg:shrink min-w-0">
              <ThreeCanvas />
            </div>
            <div className="relative w-full bg-white flex-1 min-h-0 lg:flex-none lg:w-[420px] lg:max-w-[420px] lg:h-full">
              <StepWizard />
            </div>
          </div>
        </div>
      </ConfiguratorTourProvider>
    </ConfiguratorStoreContext.Provider>
  )
}
