import type { CartItem } from './types'

export interface CartTotals {
  lineSubtotal: number
  delivery: number
  install: number
  grandTotal: number
}

/**
 * Pure: deduplicates delivery across mixed cart lines (closet + product) and
 * separates installation (closet-only) from line-level subtotals so Stripe and
 * UI can render the breakdown consistently.
 *
 * - closet line.total includes delivery + installation; we strip both so
 *   `lineSubtotal` is "stuff" only.
 * - product line.total already excludes delivery and never has installation.
 * - delivery = max(line.deliveryCost) across all lines (one shipment).
 */
export function calcCartTotals(items: CartItem[]): CartTotals {
  let lineSubtotal = 0
  let install = 0
  let maxDelivery = 0

  for (const item of items) {
    const qty = item.quantity
    if (item.kind === 'closet') {
      const ps = item.priceSnapshot
      lineSubtotal += (ps.total - ps.deliveryCost - ps.installationCost) * qty
      install += ps.installationCost * qty
      if (ps.deliveryCost > maxDelivery) maxDelivery = ps.deliveryCost
    } else {
      const ps = item.priceSnapshot
      lineSubtotal += ps.total * qty
      if (ps.deliveryCost > maxDelivery) maxDelivery = ps.deliveryCost
    }
  }

  const delivery = items.length === 0 ? 0 : maxDelivery
  return {
    lineSubtotal,
    delivery,
    install,
    grandTotal: lineSubtotal + delivery + install,
  }
}

/**
 * Per-line "net of delivery" amount used to build a Stripe line item.
 *
 * - closet: total − deliveryCost (still includes installation; Stripe charges it
 *   on the closet line).
 * - product: total (already excludes delivery).
 */
export function lineNetOfDelivery(item: CartItem): number {
  if (item.kind === 'product') return item.priceSnapshot.total
  return item.priceSnapshot.total - item.priceSnapshot.deliveryCost
}
