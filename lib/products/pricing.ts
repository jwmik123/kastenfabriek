import type { Product } from '@/sanity/lib/products'

export interface ProductPriceSnapshot {
  calculatedAt: string
  currency: 'EUR'
  unitPrice: number
  materialSurcharge: number
  deliveryCost: number
  total: number
}

export interface CalcProductPriceArgs {
  product: Product
  widthCm: number
  heightCm: number
  materialId: string
  qty: number
}

export function calcProductPrice({
  product,
  widthCm,
  heightCm,
  materialId,
}: CalcProductPriceArgs): ProductPriceSnapshot {
  const cfg = product.paxConfig
  if (!cfg) {
    throw new Error(`Product ${product.slug} has no paxConfig`)
  }

  const variant = cfg.variants.find(
    (v) => v.widthCm === widthCm && v.heightCm === heightCm,
  )
  if (!variant) {
    throw new Error(
      `No variant found for ${widthCm}x${heightCm} on product ${product.slug}`,
    )
  }

  const surcharge =
    cfg.materialSurcharges?.find((s) => s.materialId === materialId)
      ?.surchargeEur ?? 0

  const unitPrice = variant.priceEur
  const total = unitPrice + surcharge

  return {
    calculatedAt: new Date().toISOString(),
    currency: 'EUR',
    unitPrice,
    materialSurcharge: surcharge,
    deliveryCost: product.deliveryFee ?? 0,
    total,
  }
}
