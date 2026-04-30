'use client'

import SharedCanvasPricePanel from '../../_shared/components/CanvasPricePanel'
import { useCartPrice } from '../hooks/useCartPrice'

export default function CanvasPricePanel() {
  const { totalPrice, pricingData, editItemId, handleAddToCart, isCapturing } = useCartPrice()

  return (
    <SharedCanvasPricePanel
      totalPrice={totalPrice}
      pricingData={pricingData}
      editItemId={editItemId}
      handleAddToCart={handleAddToCart}
      isCapturing={isCapturing}
    />
  )
}
