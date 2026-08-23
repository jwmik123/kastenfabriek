'use client'

import { useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import type { FullPricingData } from '@/types/configurator-pricing'
import type { ClosetConfigSnapshot } from '@/lib/cart/types'
import { useWasmachinekastStore } from '../store'
import { ConfiguratorStoreContext } from '../../_shared/store/context'
import ConfiguratorTopBar from '../../_shared/components/ConfiguratorTopBar'
import ConfiguratorMobileHeader from '../../_shared/components/ConfiguratorMobileHeader'
import ConfiguratorTourProvider from '../../_shared/tour/ConfiguratorTourProvider'
import { wasmachinekastTourSteps } from '../../_shared/tour/tourSteps'
import { getWasmModuleLayouts } from '../moduleLayouts'
import { buildWasmConfigSnapshot, resolveHandleName } from '../wasmSnapshot'
import { useCartPrice } from '../hooks/useCartPrice'
import StepWizard from './StepWizard'

const TOP_BAR_STEPS = [
  { label: 'Layout', number: 1 },
  { label: 'Afmetingen', number: 2 },
  { label: 'Indeling', number: 3 },
  { label: 'Materiaal', number: 4 },
  { label: 'Handgrepen', number: 5 },
  { label: 'Accessoires', number: 6 },
]
import { getDraftConfig, saveDraftConfig } from '@/lib/cart/draft-config'
import { getCart } from '@/lib/cart/cart-store'

const ThreeCanvas = dynamic(() => import('../scene/WasmachinekastCanvas'), { ssr: false })

interface Props {
  pricingData: FullPricingData
  editConfig: ClosetConfigSnapshot | null
  editItemId: string | null
}

export default function WasmachinekastConfigurator({ pricingData, editConfig, editItemId }: Props) {
  const hydrate = useWasmachinekastStore((s) => s.hydrate)
  const restoreConfig = useWasmachinekastStore((s) => s.restoreConfig)
  const step = useWasmachinekastStore((s) => s.step)
  const setStep = useWasmachinekastStore((s) => s.setStep)
  const { grandTotal } = useCartPrice()
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleTopBarStep(target: number) {
    setStep(target)
  }

  useEffect(() => {
    hydrate(pricingData)

    // Merge washer layouts into store after hydration
    const wasmergedLayouts = getWasmModuleLayouts(pricingData.modules)
    useWasmachinekastStore.setState({ moduleLayouts: wasmergedLayouts })

    if (editConfig) {
      restoreConfig(editConfig)
    } else if (editItemId) {
      const item = getCart().items.find((i) => i.id === editItemId)
      if (item && item.kind === 'closet') restoreConfig(item.configuration)
    } else {
      const draft = getDraftConfig('wasmachinekast')
      if (draft) restoreConfig(draft)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const unsub = useWasmachinekastStore.subscribe((state) => {
      if (!state.pricingData) return
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
      autosaveTimer.current = setTimeout(() => {
        const drawerHandleId =
          state.pricingData?.handles.find((h) => h.id === state.doorHandleId)
            ?.fitsLowModule === false
            ? 'none'
            : state.doorHandleId
        const config = buildWasmConfigSnapshot({
          id: crypto.randomUUID(),
          width: state.width,
          height: state.height,
          depth: state.depth,
          moduleCount: state.moduleCount,
          modules: state.modules,
          moduleLayouts: state.moduleLayouts,
          layout: state.layout,
          lowSection: state.lowSection,
          washerModules: state.washerModules,
          topPanelThicknessMm: state.topPanelThicknessMm,
          countertopMaterialId: state.countertopMaterialId,
          buitenkantMaterialId: state.buitenkantMaterialId,
          binnenkantMaterialId: state.binnenkantMaterialId,
          doorHandleId: state.doorHandleId,
          doorHandleName: resolveHandleName(state.doorHandleId, state.pricingData?.handles),
          drawerHandleId,
          drawerHandleName: resolveHandleName(drawerHandleId, state.pricingData?.handles),
          doorHandleMaterial: state.doorHandleMaterial,
          doorsExtendToFloor: state.doorsExtendToFloor,
          lightStripsEnabled: state.lightStripsEnabled,
          sidePanelThickness: state.sidePanelThickness,
          placementType: state.placementType,
          hasTopCabinet: state.needsTopCabinet(),
          topCabinetHeightCm: state.topCabinetHeight(),
        })
        saveDraftConfig(config, 'wasmachinekast')
      }, 500)
    })

    return () => {
      unsub()
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    }
  }, [])

  return (
    <ConfiguratorStoreContext.Provider value={useWasmachinekastStore}>
      <ConfiguratorTourProvider steps={wasmachinekastTourSteps}>
        <div className="w-full h-[100dvh] md:h-[95vh] flex flex-col">
          <ConfiguratorMobileHeader
            price={grandTotal}
            productName="Wasmachinekast"
            priceNote="incl. levering & montage"
          />
          <div className="hidden md:block">
            <ConfiguratorTopBar
              steps={TOP_BAR_STEPS}
              currentStep={step}
              onStep={handleTopBarStep}
              productName="Wasmachinekast"
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
