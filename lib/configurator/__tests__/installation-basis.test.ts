import { describe, it, expect } from 'vitest'
import { computeInstallationBasis } from '../installation-basis'

describe('computeInstallationBasis', () => {
  it('strips delivery and LED from the subtotal', () => {
    expect(computeInstallationBasis({ subtotal: 2000, deliveryCost: 95, ledCost: 180 })).toBe(1725)
  })

  it('equals the subtotal when there is no delivery or LED', () => {
    expect(computeInstallationBasis({ subtotal: 2000, deliveryCost: 0, ledCost: 0 })).toBe(2000)
  })

  it('keeps a configuration in its tier when LED is added', () => {
    // Cabinet €1900, tier boundary at €2000: LED must not push it over.
    const withoutLed = computeInstallationBasis({ subtotal: 1995, deliveryCost: 95, ledCost: 0 })
    const withLed = computeInstallationBasis({ subtotal: 2175, deliveryCost: 95, ledCost: 180 })
    expect(withoutLed).toBe(1900)
    expect(withLed).toBe(1900)
  })
})
