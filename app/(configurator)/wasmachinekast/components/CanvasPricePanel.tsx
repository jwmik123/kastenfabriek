'use client'

import SharedCanvasPricePanel from '../../_shared/components/CanvasPricePanel'
import { useCartPrice } from '../hooks/useCartPrice'
import { useWasmachinekastStore } from '../store'

export default function CanvasPricePanel() {
  const { totalPrice, originalPrice, pricingData, editItemId, handleAddToCart, isCapturing } = useCartPrice()

  const step = useWasmachinekastStore((s) => s.step)
  const moduleCount = useWasmachinekastStore((s) => s.moduleCount)
  const modules = useWasmachinekastStore((s) => s.modules)
  const washerModules = useWasmachinekastStore((s) => s.washerModules)
  const width = useWasmachinekastStore((s) => s.width)
  const height = useWasmachinekastStore((s) => s.height)
  const depth = useWasmachinekastStore((s) => s.depth)

  const stepSummary = (() => {
    if (step === 1) {
      return { label: 'Afmetingen', value: `${width}×${height}×${depth} cm` }
    }
    if (step === 2) {
      const count = washerModules.length
      return { label: 'Wasmachine', value: count === 0 ? 'Nog niet gekozen' : `${count} wasmachine${count === 1 ? '' : 's'}` }
    }
    if (step === 3) {
      const doorCount = modules.filter((m) => m.hasDoor).length
      return { label: 'Indeling', value: `${moduleCount} modules · ${doorCount} deuren` }
    }
    return undefined
  })()

  return (
    <SharedCanvasPricePanel
      totalPrice={totalPrice}
      originalPrice={originalPrice}
      pricingData={pricingData}
      editItemId={editItemId}
      handleAddToCart={handleAddToCart}
      isCapturing={isCapturing}
      stepSummary={stepSummary}
    />
  )
}
