import { describe, it, expect } from 'vitest'
import { calcCartTotals, lineNetOfDelivery } from '../totals'
import type {
  CartItem,
  ClosetCartItem,
  ProductCartItem,
  PriceSnapshot,
  ProductPriceSnapshot,
  ClosetConfigSnapshot,
  ProductConfigSnapshot,
} from '../types'

const closetPrice = (
  override: Partial<PriceSnapshot> = {},
): PriceSnapshot => ({
  calculatedAt: '2026-05-08T00:00:00.000Z',
  currency: 'EUR',
  moduleCost: 1000,
  doorCost: 500,
  mechanismCost: 100,
  ledCost: 0,
  deliveryCost: 95,
  subtotal: 1695,
  installationTierName: null,
  installationCost: 0,
  total: 1695,
  ...override,
})

const productPrice = (
  override: Partial<ProductPriceSnapshot> = {},
): ProductPriceSnapshot => ({
  calculatedAt: '2026-05-08T00:00:00.000Z',
  currency: 'EUR',
  unitPrice: 200,
  materialSurcharge: 0,
  deliveryCost: 20,
  total: 200,
  ...override,
})

const closet = (
  id: string,
  ps: PriceSnapshot = closetPrice(),
  qty = 1,
): ClosetCartItem => ({
  id,
  addedAt: '2026-05-08T00:00:00.000Z',
  kind: 'closet',
  configuration: {} as unknown as ClosetConfigSnapshot,
  priceSnapshot: ps,
  quantity: qty,
})

const product = (
  id: string,
  ps: ProductPriceSnapshot = productPrice(),
  qty = 1,
): ProductCartItem => ({
  id,
  addedAt: '2026-05-08T00:00:00.000Z',
  kind: 'product',
  configuration: {} as unknown as ProductConfigSnapshot,
  priceSnapshot: ps,
  quantity: qty,
})

describe('calcCartTotals', () => {
  it('returns all zeros for an empty cart', () => {
    expect(calcCartTotals([])).toEqual({
      lineSubtotal: 0,
      delivery: 0,
      install: 0,
      grandTotal: 0,
    })
  })

  it('handles a single closet line with no installation', () => {
    const items: CartItem[] = [closet('a')]
    const t = calcCartTotals(items)
    expect(t).toEqual({
      lineSubtotal: 1600, // 1695 − 95 delivery − 0 install
      delivery: 95,
      install: 0,
      grandTotal: 1695,
    })
  })

  it('separates installation from closet line subtotal', () => {
    const items: CartItem[] = [
      closet('a', closetPrice({ installationCost: 720, total: 2415 })),
    ]
    const t = calcCartTotals(items)
    expect(t).toEqual({
      lineSubtotal: 1600,
      delivery: 95,
      install: 720,
      grandTotal: 2415,
    })
  })

  it('handles a single PAX line', () => {
    const items: CartItem[] = [product('p1')]
    const t = calcCartTotals(items)
    expect(t).toEqual({
      lineSubtotal: 200,
      delivery: 20,
      install: 0,
      grandTotal: 220,
    })
  })

  it('mixed cart: max delivery wins (closet €95 + PAX €20 → €95)', () => {
    const items: CartItem[] = [closet('a'), product('p1')]
    const t = calcCartTotals(items)
    expect(t.delivery).toBe(95)
    expect(t.lineSubtotal).toBe(1600 + 200)
    expect(t.install).toBe(0)
    expect(t.grandTotal).toBe(1600 + 200 + 95)
  })

  it('multi-PAX with different deliveries: max wins once', () => {
    const items: CartItem[] = [
      product('p1', productPrice({ deliveryCost: 20, total: 100 })),
      product('p2', productPrice({ deliveryCost: 40, total: 100 })),
      product('p3', productPrice({ deliveryCost: 30, total: 100 })),
    ]
    const t = calcCartTotals(items)
    expect(t.delivery).toBe(40)
    expect(t.lineSubtotal).toBe(300)
    expect(t.grandTotal).toBe(340)
  })

  it('install only counts closet lines', () => {
    const items: CartItem[] = [
      closet('a', closetPrice({ installationCost: 720, total: 2415 })),
      product('p1'),
    ]
    const t = calcCartTotals(items)
    expect(t.install).toBe(720)
  })

  it('multiplies line subtotal and install by quantity', () => {
    const items: CartItem[] = [product('p1', productPrice(), 3)]
    const t = calcCartTotals(items)
    expect(t.lineSubtotal).toBe(600)
    expect(t.delivery).toBe(20)
    expect(t.grandTotal).toBe(620)
  })
})

describe('lineNetOfDelivery', () => {
  it('subtracts deliveryCost from closet total', () => {
    expect(lineNetOfDelivery(closet('a'))).toBe(1600)
  })

  it('returns product total unchanged (already excludes delivery)', () => {
    expect(lineNetOfDelivery(product('p1'))).toBe(200)
  })
})
