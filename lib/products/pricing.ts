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
  /** Zijpaneel depth in cm — its second dimension, so it is priced like a width. */
  depthCm?: number
}

/**
 * Numeric (width × height) price matrix. Only "deuren" has one: hoekdeuren are
 * keyed by a width label and a zijpaneel is priced per height alone.
 */
export function numericVariantsForType(
  cfg: NonNullable<Product['paxConfig']>,
  doorType: PaxDoorType,
) {
  return doorType === 'deuren' ? cfg.variants : []
}

/**
 * Maatwerk price: the panel's surface times the per-m² rate for its type, never
 * under the configured floor. Both dimensions are in cm, so a 60 × 240 panel is
 * 1.44 m².
 */
export function customPanelPrice(
  cfg: NonNullable<Product['paxConfig']>,
  rateEurPerM2: number,
  otherSideCm: number,
  heightCm: number,
): number {
  const areaM2 = (otherSideCm * heightCm) / 10_000
  const price = Math.max(areaM2 * rateEurPerM2, cfg.minCustomPrice ?? 0)
  return Math.round(price * 100) / 100
}

/**
 * How wide a hoekdeur set is in total. Editors may state it outright; otherwise
 * it is the numbers in the label added up, so "27cm & 51cm" is 78 cm.
 */
export function hoekTotalWidthCm(
  variants: NonNullable<Product['paxConfig']>['hoekVariants'],
  widthLabel: string | undefined,
): number {
  const stated = (variants ?? []).find(
    (v) => v.widthLabel === widthLabel && v.widthTotalCm != null,
  )?.widthTotalCm
  if (stated != null) return stated
  return (widthLabel?.match(/\d+(?:[.,]\d+)?/g) ?? []).reduce(
    (sum, n) => sum + Number(n.replace(',', '.')),
    0,
  )
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
  depthCm,
}: CalcProductPriceArgs): ProductPriceSnapshot {
  const cfg = product.paxConfig
  if (!cfg) {
    throw new Error(`Product ${product.slug} has no paxConfig`)
  }

  let unitPrice: number
  if (doorType === 'afwerkpaneel') {
    // A zijpaneel is cut to size: height × depth decide the price, always.
    if (cfg.pricePerM2Afwerk == null) {
      throw new Error(`No maatwerk m² price for zijpanelen on product ${product.slug}`)
    }
    if (!depthCm) {
      throw new Error(`A zijpaneel needs a depth on product ${product.slug}`)
    }
    unitPrice = customPanelPrice(cfg, cfg.pricePerM2Afwerk, depthCm, heightCm)
  } else if (isVerlengd) {
    if (doorType === 'hoekdeuren') {
      // Priced over both panels together; the label carries their widths.
      if (cfg.pricePerM2Hoek != null) {
        const totalWidth = hoekTotalWidthCm(cfg.hoekVariants, widthLabel)
        if (!totalWidth) {
          throw new Error(
            `No total width for hoekdeuren "${widthLabel}" on product ${product.slug}`,
          )
        }
        unitPrice = customPanelPrice(cfg, cfg.pricePerM2Hoek, totalWidth, heightCm)
      } else if (cfg.verlengdeHoekPrice != null) {
        unitPrice = cfg.verlengdeHoekPrice
      } else {
        throw new Error(`No verlengde hoek price on product ${product.slug}`)
      }
    } else if (cfg.pricePerM2Deuren != null) {
      // A verlengde deur is cut to the customer's own height, so it is priced
      // by surface like a zijpaneel. Products without a rate keep the old
      // flat price per width.
      unitPrice = customPanelPrice(cfg, cfg.pricePerM2Deuren, widthCm, heightCm)
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
