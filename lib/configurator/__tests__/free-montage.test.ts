import { describe, it, expect } from 'vitest'
import { computeFreeMontage } from '../free-montage'
import type { InstallationTier } from '@/types/configurator-pricing'

const tier: InstallationTier = { name: 'Groot project', minTotal: 1000, maxTotal: 2000, price: 720 }

describe('computeFreeMontage', () => {
  it('no free montage: passes through tier cost unchanged', () => {
    const result = computeFreeMontage({ subtotal: 1500, installationTier: tier, freeMontage: false })
    expect(result.effectiveInstallationCost).toBe(720)
    expect(result.freeMontageDiscount).toBe(0)
    expect(result.freeMontageApplied).toBe(false)
    expect(result.originalPrice).toBeUndefined()
    expect(result.grandTotal).toBe(2220)
  })

  it('free montage active: zeroes installation cost, exposes discount and originalPrice', () => {
    const result = computeFreeMontage({ subtotal: 1500, installationTier: tier, freeMontage: true })
    expect(result.effectiveInstallationCost).toBe(0)
    expect(result.freeMontageDiscount).toBe(720)
    expect(result.freeMontageApplied).toBe(true)
    expect(result.originalPrice).toBe(2220)
    expect(result.grandTotal).toBe(1500)
  })

  it('free montage active but no tier matched: freeMontageApplied false, discount 0', () => {
    const result = computeFreeMontage({ subtotal: 500, installationTier: undefined, freeMontage: true })
    expect(result.effectiveInstallationCost).toBe(0)
    expect(result.freeMontageDiscount).toBe(0)
    expect(result.freeMontageApplied).toBe(false)
    expect(result.originalPrice).toBeUndefined()
    expect(result.grandTotal).toBe(500)
  })

  it('no tier matched, no free montage: grandTotal equals subtotal', () => {
    const result = computeFreeMontage({ subtotal: 500, installationTier: undefined, freeMontage: false })
    expect(result.effectiveInstallationCost).toBe(0)
    expect(result.grandTotal).toBe(500)
    expect(result.freeMontageApplied).toBe(false)
  })
})
