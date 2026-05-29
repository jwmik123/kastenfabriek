'use client'

import SharedCanvasPricePanel from '../../_shared/components/CanvasPricePanel'
import { useCartPrice } from '../hooks/useCartPrice'
import { useClosetStore } from '../store'

export default function CanvasPricePanel() {
  const { totalPrice, originalPrice } = useCartPrice()

  const step = useClosetStore((s) => s.step)
  const moduleCount = useClosetStore((s) => s.moduleCount)
  const modules = useClosetStore((s) => s.modules)
  const width = useClosetStore((s) => s.width)
  const height = useClosetStore((s) => s.height)
  const depth = useClosetStore((s) => s.depth)

  const stepSummary = (() => {
    if (step === 1) {
      return { label: 'Afmetingen', value: `${width}×${height}×${depth} cm` }
    }
    if (step === 2) {
      const doorCount = modules.filter((m) => m.hasDoor).length
      return { label: 'Indeling', value: `${moduleCount} modules · ${doorCount} deuren` }
    }
    return undefined
  })()

  return (
    <SharedCanvasPricePanel
      totalPrice={totalPrice}
      originalPrice={originalPrice}
      stepSummary={stepSummary}
    />
  )
}
