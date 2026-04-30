'use client'

import SharedCanvasPricePanel from '../../_shared/components/CanvasPricePanel'
import { useCartPrice } from '../hooks/useCartPrice'

export default function CanvasPricePanel() {
  const { totalPrice, originalPrice, pricingData, editItemId, handleAddToCart, isCapturing } = useCartPrice()

  return (
    <SharedCanvasPricePanel
      totalPrice={totalPrice}
      originalPrice={originalPrice}
      pricingData={pricingData}
      editItemId={editItemId}
      handleAddToCart={handleAddToCart}
      isCapturing={isCapturing}
    />
  )
}
