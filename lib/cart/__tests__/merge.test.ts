import { describe, it, expect } from 'vitest'
import { mergeOrAddProduct } from '../merge'
import type {
  CartItem,
  ClosetCartItem,
  ProductCartItem,
  ProductConfigSnapshot,
  ProductPriceSnapshot,
} from '../types'

const baseConfig: ProductConfigSnapshot = {
  id: 'cfg-1',
  capturedAt: '2026-05-08T00:00:00.000Z',
  sanityProductId: 'prod-pax',
  productType: 'pax-doors',
  productSlug: 'pax-deuren',
  productName: 'PAX deuren',
  widthCm: 50,
  heightCm: 229,
  materialId: 'h1199-thermo-eik',
  materialName: 'Thermo eik',
}

const basePrice: ProductPriceSnapshot = {
  calculatedAt: '2026-05-08T00:00:00.000Z',
  currency: 'EUR',
  unitPrice: 200,
  materialSurcharge: 0,
  deliveryCost: 20,
  total: 200,
}

const productItem = (
  id: string,
  override: Partial<ProductConfigSnapshot> = {},
  qty = 1,
): ProductCartItem => ({
  id,
  addedAt: '2026-05-08T00:00:00.000Z',
  kind: 'product',
  configuration: { ...baseConfig, id: `${id}-cfg`, ...override },
  priceSnapshot: basePrice,
  quantity: qty,
})

const closetItem = (id: string): ClosetCartItem => ({
  id,
  addedAt: '2026-05-08T00:00:00.000Z',
  kind: 'closet',
  // Minimal stub — merge logic must never inspect closet items
  configuration: { id: `${id}-cfg` } as unknown as ClosetCartItem['configuration'],
  priceSnapshot: {} as unknown as ClosetCartItem['priceSnapshot'],
  quantity: 1,
})

describe('mergeOrAddProduct', () => {
  it('appends when cart is empty', () => {
    const next = mergeOrAddProduct([], productItem('a'))
    expect(next).toHaveLength(1)
    expect(next[0].quantity).toBe(1)
  })

  it('merges when sanityProductId + width + height + material all match', () => {
    const initial: CartItem[] = [productItem('a', {}, 2)]
    const next = mergeOrAddProduct(initial, productItem('b', {}, 1))
    expect(next).toHaveLength(1)
    expect(next[0].quantity).toBe(3)
    expect(next[0].id).toBe('a') // existing line preserved
  })

  it('appends when widthCm differs', () => {
    const initial: CartItem[] = [productItem('a', { widthCm: 25 })]
    const next = mergeOrAddProduct(initial, productItem('b', { widthCm: 50 }))
    expect(next).toHaveLength(2)
  })

  it('appends when heightCm differs', () => {
    const initial: CartItem[] = [productItem('a', { heightCm: 200 })]
    const next = mergeOrAddProduct(initial, productItem('b', { heightCm: 229 }))
    expect(next).toHaveLength(2)
  })

  it('appends when materialId differs', () => {
    const initial: CartItem[] = [productItem('a', { materialId: 'm1' })]
    const next = mergeOrAddProduct(initial, productItem('b', { materialId: 'm2' }))
    expect(next).toHaveLength(2)
  })

  it('appends when sanityProductId differs', () => {
    const initial: CartItem[] = [productItem('a', { sanityProductId: 'p1' })]
    const next = mergeOrAddProduct(initial, productItem('b', { sanityProductId: 'p2' }))
    expect(next).toHaveLength(2)
  })

  it('appends when doorType differs', () => {
    const initial: CartItem[] = [productItem('a', { doorType: 'deuren' })]
    const next = mergeOrAddProduct(initial, productItem('b', { doorType: 'afwerkpaneel' }))
    expect(next).toHaveLength(2)
  })

  it('appends when the hinge side differs', () => {
    const initial: CartItem[] = [productItem('a', { doorSide: 'left' })]
    const next = mergeOrAddProduct(initial, productItem('b', { doorSide: 'right' }))
    expect(next).toHaveLength(2)
  })

  it('appends when the zijpaneel depth differs', () => {
    const initial: CartItem[] = [
      productItem('a', { doorType: 'afwerkpaneel', depthCm: 35 }),
    ]
    const next = mergeOrAddProduct(
      initial,
      productItem('b', { doorType: 'afwerkpaneel', depthCm: 58 }),
    )
    expect(next).toHaveLength(2)
  })

  it('appends when one line is verlengd and the other is not', () => {
    const initial: CartItem[] = [productItem('a', { isVerlengd: true })]
    const next = mergeOrAddProduct(initial, productItem('b'))
    expect(next).toHaveLength(2)
  })

  it('appends when the hoekdeuren width label differs', () => {
    const initial: CartItem[] = [
      productItem('a', { doorType: 'hoekdeuren', widthLabel: '27cm & 51cm' }),
    ]
    const next = mergeOrAddProduct(
      initial,
      productItem('b', { doorType: 'hoekdeuren', widthLabel: '37cm & 51cm' }),
    )
    expect(next).toHaveLength(2)
  })

  it('merges identical lines that both carry the same side and depth', () => {
    const opts = { doorType: 'afwerkpaneel' as const, depthCm: 58 }
    const initial: CartItem[] = [productItem('a', opts, 2)]
    const next = mergeOrAddProduct(initial, productItem('b', opts, 1))
    expect(next).toHaveLength(1)
    expect(next[0].quantity).toBe(3)
  })

  it('never merges with closet items', () => {
    const initial: CartItem[] = [closetItem('closet-1')]
    const next = mergeOrAddProduct(initial, productItem('a'))
    expect(next).toHaveLength(2)
    expect(next[0].kind).toBe('closet')
    expect(next[1].kind).toBe('product')
  })

  it('preserves position of merged line', () => {
    const initial: CartItem[] = [
      closetItem('c1'),
      productItem('p1'),
      closetItem('c2'),
    ]
    const next = mergeOrAddProduct(initial, productItem('p2'))
    expect(next).toHaveLength(3)
    expect(next[1].kind).toBe('product')
    expect(next[1].quantity).toBe(2)
  })
})
