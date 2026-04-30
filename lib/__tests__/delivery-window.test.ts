import { describe, it, expect } from 'vitest'
import { getDeliveryWindow } from '../delivery-window'

describe('getDeliveryWindow', () => {
  it('returns same-year range without year suffix', () => {
    // 2026-04-30: +56d = 25 jun, +84d = 23 jul — both in 2026
    const result = getDeliveryWindow(new Date('2026-04-30'))
    expect(result).toBe('25. jun – 23. jul')
  })

  it('shows year on end date when it crosses into next calendar year', () => {
    // 2026-10-15: +56d = 10 dec 2026, +84d = 7 jan 2027
    const result = getDeliveryWindow(new Date('2026-10-15'))
    expect(result).toBe('10. dec – 7. jan 2027')
  })

  it('shows year on both dates when both cross into next calendar year', () => {
    // 2026-11-20: +56d = 15 jan 2027, +84d = 12 feb 2027
    const result = getDeliveryWindow(new Date('2026-11-20'))
    expect(result).toBe('15. jan 2027 – 12. feb 2027')
  })

  it('31 December edge case: both dates in next year', () => {
    // 2026-12-31: +56d = 25 feb 2027, +84d = 25 mrt 2027
    const result = getDeliveryWindow(new Date('2026-12-31'))
    expect(result).toBe('25. feb 2027 – 25. mrt 2027')
  })

  it('always shows both months even in same-month range', () => {
    // 2026-05-01: +56d = 26 jun, +84d = 24 jul
    const result = getDeliveryWindow(new Date('2026-05-01'))
    expect(result).toBe('26. jun – 24. jul')
  })
})
