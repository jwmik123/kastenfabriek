'use client'

import { useWasmachinekastStore } from '../store'
import { computeWasmPricing } from '../pricing/computeWasmPricing'
import type { WasmPricingResult } from '../pricing/computeWasmPricing'

/**
 * The full price breakdown of the current configuration — the single source the
 * cart price and the debug panel both read.
 */
export function useWasmPricing(): WasmPricingResult {
  const pricingData = useWasmachinekastStore((s) => s.pricingData)
  const layout = useWasmachinekastStore((s) => s.layout)
  const modules = useWasmachinekastStore((s) => s.modules)
  const lowSection = useWasmachinekastStore((s) => s.lowSection)
  const moduleCount = useWasmachinekastStore((s) => s.moduleCount)
  const buitenkantMaterialId = useWasmachinekastStore((s) => s.buitenkantMaterialId)
  const doorHandleId = useWasmachinekastStore((s) => s.doorHandleId)
  const lightStripsEnabled = useWasmachinekastStore((s) => s.lightStripsEnabled)
  const needsTopCabinet = useWasmachinekastStore((s) => s.needsTopCabinet)
  const sidePanelThickness = useWasmachinekastStore((s) => s.sidePanelThickness)

  return computeWasmPricing({
    pricingData,
    layout,
    modules,
    lowSection,
    moduleCount,
    buitenkantMaterialId,
    doorHandleId,
    lightStripsEnabled,
    hasTopCabinet: needsTopCabinet(),
    sidePanelThickness,
  })
}
