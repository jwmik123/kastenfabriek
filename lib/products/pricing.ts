import type { PaxDoorType, Product } from '@/sanity/lib/products'

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
  /** Defaults to 'deuren' for back-compat with callers/cart entries that omit it. */
  doorType?: PaxDoorType
  /** Free-text width label — required for hoekdeuren (ignored for other types). */
  widthLabel?: string
  /** When true, heightCm is a custom height and price comes from the verlengde config. */
  isVerlengd?: boolean
  /** Hinge side; 'pair' is one left + one right door and therefore costs double. */
  doorSide?: 'left' | 'right' | 'pair'
}

/** Numeric price matrix for deuren/afwerkpaneel. Hoekdeuren use a separate label-keyed matrix. */
export function numericVariantsForType(
  cfg: NonNullable<Product['paxConfig']>,
  doorType: PaxDoorType,
) {
  return doorType === 'afwerkpaneel' ? cfg.afwerkVariants ?? [] : cfg.variants
}

export function calcProductPrice({
  product,
  widthCm,
  heightCm,
  materialId,
  doorType = 'deuren',
  widthLabel,
  isVerlengd = false,
  doorSide,
}: CalcProductPriceArgs): ProductPriceSnapshot {
  const cfg = product.paxConfig
  if (!cfg) {
    throw new Error(`Product ${product.slug} has no paxConfig`)
  }

  let unitPrice: number
  if (isVerlengd) {
    if (doorType === 'hoekdeuren') {
      if (cfg.verlengdeHoekPrice == null) {
        throw new Error(`No verlengde hoek price on product ${product.slug}`)
      }
      unitPrice = cfg.verlengdeHoekPrice
    } else {
      const vp = cfg.verlengdePrices?.find((p) => p.widthCm === widthCm)
      if (!vp) {
        throw new Error(
          `No verlengde price for width ${widthCm} on product ${product.slug}`,
        )
      }
      unitPrice = vp.priceEur
    }
  } else if (doorType === 'hoekdeuren') {
    const variant = (cfg.hoekVariants ?? []).find(
      (v) => v.widthLabel === widthLabel && v.heightCm === heightCm,
    )
    if (!variant) {
      throw new Error(
        `No hoekdeuren variant found for "${widthLabel}"x${heightCm} on product ${product.slug}`,
      )
    }
    unitPrice = variant.priceEur
  } else {
    const variant = numericVariantsForType(cfg, doorType).find(
      (v) => v.widthCm === widthCm && v.heightCm === heightCm,
    )
    if (!variant) {
      throw new Error(
        `No ${doorType} variant found for ${widthCm}x${heightCm} on product ${product.slug}`,
      )
    }
    unitPrice = variant.priceEur
  }

  const surcharge =
    cfg.materialSurcharges?.find((s) => s.materialId === materialId)
      ?.surchargeEur ?? 0

  // A 'pair' is one left plus one right door in a single line, so both the
  // panel price and the material surcharge count twice.
  const panels = doorSide === 'pair' ? 2 : 1
  const linePrice = unitPrice * panels
  const lineSurcharge = surcharge * panels
  const total = linePrice + lineSurcharge

  return {
    calculatedAt: new Date().toISOString(),
    currency: 'EUR',
    unitPrice: linePrice,
    materialSurcharge: lineSurcharge,
    deliveryCost: product.deliveryFee ?? 0,
    total,
  }
}
