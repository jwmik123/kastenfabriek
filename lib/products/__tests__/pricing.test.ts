import { describe, it, expect } from 'vitest'
import { calcProductPrice } from '../pricing'
import type { Product } from '@/sanity/lib/products'

const baseProduct: Product = {
  _id: 'p1',
  title: 'PAX deuren',
  slug: 'pax-deuren',
  productType: 'pax-doors',
  isActive: true,
  shortDescription: '',
  longDescription: [],
  heroImage: { asset: { _ref: 'image-x', _type: 'reference' } },
  deliveryFee: 20,
  paxConfig: {
    widths: [25, 37, 50],
    heights: [194, 200, 229, 235],
    variants: [
      { widthCm: 25, heightCm: 194, priceEur: 100 },
      { widthCm: 25, heightCm: 200, priceEur: 110 },
      { widthCm: 37, heightCm: 229, priceEur: 150 },
      { widthCm: 50, heightCm: 235, priceEur: 200 },
    ],
    materialSurcharges: [
      { materialId: 'h1714-lincoln-notelaar', surchargeEur: 25 },
    ],
  },
}

describe('calcProductPrice', () => {
  it('returns variant priceEur as unitPrice for matching size', () => {
    const snap = calcProductPrice({
      product: baseProduct,
      widthCm: 25,
      heightCm: 194,
      materialId: 'zwart',
      qty: 1,
    })
    expect(snap.unitPrice).toBe(100)
    expect(snap.materialSurcharge).toBe(0)
    expect(snap.total).toBe(100)
    expect(snap.deliveryCost).toBe(20)
  })

  it('adds material surcharge when configured', () => {
    const snap = calcProductPrice({
      product: baseProduct,
      widthCm: 37,
      heightCm: 229,
      materialId: 'h1714-lincoln-notelaar',
      qty: 1,
    })
    expect(snap.unitPrice).toBe(150)
    expect(snap.materialSurcharge).toBe(25)
    expect(snap.total).toBe(175)
  })

  it('zero surcharge when material has no entry', () => {
    const snap = calcProductPrice({
      product: baseProduct,
      widthCm: 50,
      heightCm: 235,
      materialId: 'premium-wit',
      qty: 1,
    })
    expect(snap.materialSurcharge).toBe(0)
    expect(snap.total).toBe(200)
  })

  it('throws on missing variant', () => {
    expect(() =>
      calcProductPrice({
        product: baseProduct,
        widthCm: 99,
        heightCm: 200,
        materialId: 'zwart',
        qty: 1,
      }),
    ).toThrow()
  })

  it('result is independent of qty', () => {
    const a = calcProductPrice({
      product: baseProduct,
      widthCm: 25,
      heightCm: 200,
      materialId: 'zwart',
      qty: 1,
    })
    const b = calcProductPrice({
      product: baseProduct,
      widthCm: 25,
      heightCm: 200,
      materialId: 'zwart',
      qty: 7,
    })
    expect(a.unitPrice).toBe(b.unitPrice)
    expect(a.total).toBe(b.total)
    expect(a.deliveryCost).toBe(b.deliveryCost)
  })

  const typedProduct: Product = {
    ...baseProduct,
    paxConfig: {
      ...baseProduct.paxConfig!,
      hoekVariants: [
        { widthLabel: '27cm & 50cm', heightCm: 194, priceEur: 300 },
        { widthLabel: '27cm & 50cm', heightCm: 200, priceEur: 320 },
      ],
      afwerkVariants: [{ widthCm: 25, heightCm: 194, priceEur: 80 }],
      verlengdePrices: [
        { widthCm: 25, priceEur: 475.2 },
        { widthCm: 37, priceEur: 600 },
      ],
      verlengdeHoekPrice: 700,
    },
  }

  it('uses hoekdeuren matrix matched by widthLabel', () => {
    const snap = calcProductPrice({
      product: typedProduct,
      widthCm: 0,
      widthLabel: '27cm & 50cm',
      heightCm: 194,
      materialId: 'zwart',
      qty: 1,
      doorType: 'hoekdeuren',
    })
    expect(snap.unitPrice).toBe(300)
  })

  it('throws on unknown hoekdeuren widthLabel', () => {
    expect(() =>
      calcProductPrice({
        product: typedProduct,
        widthCm: 0,
        widthLabel: 'nonexistent',
        heightCm: 194,
        materialId: 'zwart',
        qty: 1,
        doorType: 'hoekdeuren',
      }),
    ).toThrow()
  })

  it('uses afwerkpaneel matrix for doorType afwerkpaneel', () => {
    const snap = calcProductPrice({
      product: typedProduct,
      widthCm: 25,
      heightCm: 194,
      materialId: 'zwart',
      qty: 1,
      doorType: 'afwerkpaneel',
    })
    expect(snap.unitPrice).toBe(80)
  })

  it('uses verlengde per-width price and ignores height when isVerlengd', () => {
    const snap = calcProductPrice({
      product: typedProduct,
      widthCm: 25,
      heightCm: 262, // custom, not in any matrix
      materialId: 'zwart',
      qty: 1,
      doorType: 'deuren',
      isVerlengd: true,
    })
    expect(snap.unitPrice).toBe(475.2)
  })

  it('uses flat verlengde hoek price for hoekdeuren', () => {
    const snap = calcProductPrice({
      product: typedProduct,
      widthCm: 0,
      widthLabel: '27cm & 50cm',
      heightCm: 280,
      materialId: 'zwart',
      qty: 1,
      doorType: 'hoekdeuren',
      isVerlengd: true,
    })
    expect(snap.unitPrice).toBe(700)
  })

  it('throws when verlengde width has no price', () => {
    expect(() =>
      calcProductPrice({
        product: typedProduct,
        widthCm: 50,
        heightCm: 280,
        materialId: 'zwart',
        qty: 1,
        isVerlengd: true,
      }),
    ).toThrow()
  })
})
