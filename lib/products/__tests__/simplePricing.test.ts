import { describe, it, expect } from 'vitest'
import { calcSimpleProductPrice, resolveSimpleOptions } from '../pricing'
import type { Product } from '@/sanity/lib/products'

const product: Product = {
  _id: 's1',
  title: 'Lade',
  slug: 'lade',
  productType: 'simple',
  isActive: true,
  shortDescription: '',
  longDescription: [],
  heroImage: { asset: { _ref: 'image-x', _type: 'reference' } },
  deliveryFee: 15,
  simpleConfig: {
    priceEur: 50,
    optionGroups: [
      {
        _key: 'kleur',
        name: 'Kleur',
        values: [
          { _key: 'wit', label: 'Wit' },
          { _key: 'zwart', label: 'Zwart', priceDeltaEur: 10 },
        ],
      },
      {
        _key: 'maat',
        name: 'Maat',
        values: [
          { _key: 'm60', label: '60 cm', priceDeltaEur: -5 },
          { _key: 'm80', label: '80 cm', priceDeltaEur: 20 },
        ],
      },
    ],
  },
}

describe('calcSimpleProductPrice', () => {
  it('uses the first value of each group when nothing is picked', () => {
    const snap = calcSimpleProductPrice(product)
    expect(snap.unitPrice).toBe(45)
    expect(snap.total).toBe(45)
    expect(snap.deliveryCost).toBe(15)
  })

  it('adds the surcharge of every picked value', () => {
    const snap = calcSimpleProductPrice(product, { kleur: 'zwart', maat: 'm80' })
    expect(snap.unitPrice).toBe(80)
  })

  it('ignores a pick that no longer exists', () => {
    const snap = calcSimpleProductPrice(product, { kleur: 'weg' })
    expect(snap.unitPrice).toBe(45)
  })

  it('is the base price for a product without options', () => {
    const plain = { ...product, simpleConfig: { priceEur: 50 } }
    expect(calcSimpleProductPrice(plain).unitPrice).toBe(50)
    expect(resolveSimpleOptions(plain.simpleConfig!)).toEqual([])
  })
})

describe('calcSimpleProductPrice — service', () => {
  it('has no delivery cost', () => {
    const service = {
      ...product,
      simpleConfig: { ...product.simpleConfig!, isService: true },
    }
    expect(calcSimpleProductPrice(service).deliveryCost).toBe(0)
  })
})
