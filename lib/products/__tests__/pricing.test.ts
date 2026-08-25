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

  it('prices a left or right door as a single panel', () => {
    for (const doorSide of ['left', 'right'] as const) {
      const snap = calcProductPrice({
        product: baseProduct,
        widthCm: 25,
        heightCm: 194,
        materialId: 'zwart',
        qty: 1,
        doorSide,
      })
      expect(snap.unitPrice).toBe(100)
      expect(snap.total).toBe(100)
    }
  })

  it('doubles panel price and surcharge for a left+right pair', () => {
    const snap = calcProductPrice({
      product: baseProduct,
      widthCm: 37,
      heightCm: 229,
      materialId: 'h1714-lincoln-notelaar',
      qty: 1,
      doorSide: 'pair',
    })
    expect(snap.unitPrice).toBe(300)
    expect(snap.materialSurcharge).toBe(50)
    expect(snap.total).toBe(350)
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
      afwerkEnabled: true,
      pricePerM2Deuren: 200,
      pricePerM2Hoek: 234,
      pricePerM2Afwerk: 133,
      minCustomPrice: 60,
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

  it('prices a zijpaneel on depth × height at the m² rate', () => {
    const snap = calcProductPrice({
      product: typedProduct,
      widthCm: 0,
      heightCm: 250,
      depthCm: 60,
      materialId: 'zwart',
      qty: 1,
      doorType: 'afwerkpaneel',
    })
    // 0.60 × 2.50 m = 1.5 m² × €133
    expect(snap.unitPrice).toBe(199.5)
  })

  it('never prices a small zijpaneel under the minimum', () => {
    const snap = calcProductPrice({
      product: typedProduct,
      widthCm: 0,
      heightCm: 60,
      depthCm: 20,
      materialId: 'zwart',
      qty: 1,
      doorType: 'afwerkpaneel',
    })
    // 0.12 m² × €133 = €15.96, floored at €60
    expect(snap.unitPrice).toBe(60)
  })

  it('throws on a zijpaneel without a depth', () => {
    expect(() =>
      calcProductPrice({
        product: typedProduct,
        widthCm: 0,
        heightCm: 236,
        materialId: 'zwart',
        qty: 1,
        doorType: 'afwerkpaneel',
      }),
    ).toThrow()
  })

  it('prices a verlengde deur on width × height at the m² rate', () => {
    const snap = calcProductPrice({
      product: typedProduct,
      widthCm: 25,
      heightCm: 262, // custom, not in any matrix
      materialId: 'zwart',
      qty: 1,
      doorType: 'deuren',
      isVerlengd: true,
    })
    // 0.25 × 2.62 m = 0.655 m² × €200
    expect(snap.unitPrice).toBe(131)
  })

  it('falls back to the flat verlengde price when no m² rate is set', () => {
    const flat: Product = {
      ...typedProduct,
      paxConfig: { ...typedProduct.paxConfig!, pricePerM2Deuren: undefined },
    }
    const snap = calcProductPrice({
      product: flat,
      widthCm: 25,
      heightCm: 262,
      materialId: 'zwart',
      qty: 1,
      doorType: 'deuren',
      isVerlengd: true,
    })
    expect(snap.unitPrice).toBe(475.2)
  })

  it('prices verlengde hoekdeuren over both panels at the hoek m² rate', () => {
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
    // 27 + 50 = 77 cm read from the label; 0.77 × 2.80 m = 2.156 m² × €234
    expect(snap.unitPrice).toBe(504.5)
  })

  it('prefers a stated total width over the label sum', () => {
    const stated: Product = {
      ...typedProduct,
      paxConfig: {
        ...typedProduct.paxConfig!,
        hoekVariants: (typedProduct.paxConfig!.hoekVariants ?? []).map((v) => ({
          ...v,
          widthTotalCm: 80,
        })),
      },
    }
    const snap = calcProductPrice({
      product: stated,
      widthCm: 0,
      widthLabel: '27cm & 50cm',
      heightCm: 280,
      materialId: 'zwart',
      qty: 1,
      doorType: 'hoekdeuren',
      isVerlengd: true,
    })
    // 0.80 × 2.80 m = 2.24 m² × €234
    expect(snap.unitPrice).toBe(524.16)
  })

  it('falls back to the flat hoek price when no hoek m² rate is set', () => {
    const flat: Product = {
      ...typedProduct,
      paxConfig: { ...typedProduct.paxConfig!, pricePerM2Hoek: undefined },
    }
    const snap = calcProductPrice({
      product: flat,
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

  it('throws on a flat-price product when the verlengde width has no price', () => {
    const flat: Product = {
      ...typedProduct,
      paxConfig: { ...typedProduct.paxConfig!, pricePerM2Deuren: undefined },
    }
    expect(() =>
      calcProductPrice({
        product: flat,
        widthCm: 50,
        heightCm: 280,
        materialId: 'zwart',
        qty: 1,
        isVerlengd: true,
      }),
    ).toThrow()
  })
})
