import { describe, it, expect } from 'vitest'
import {
  computeAvailability,
  findBookableSlot,
  localNow,
  openingRangesFor,
  sliceSlots,
  type ShowroomAvailabilityConfig,
} from '../availability'

// Saturdays only, 10:00–13:00, hour slots.
const config: ShowroomAvailabilityConfig = {
  enabled: true,
  slotMinutes: 60,
  capacityPerSlot: 1,
  minLeadHours: 24,
  maxWeeksAhead: 8,
  weeklySchedule: [{ weekday: 6, ranges: [{ start: '10:00', end: '13:00' }] }],
  exceptions: [],
}

// Tuesday 2026-09-22 09:00 Amsterdam (07:00Z)
const now = new Date('2026-09-22T07:00:00Z')

const day = (days: ReturnType<typeof computeAvailability>, date: string) => days.find((d) => d.date === date)!

describe('localNow', () => {
  it('reads the showroom wall clock, not UTC', () => {
    expect(localNow(now)).toEqual({ date: '2026-09-22', minutes: 9 * 60 })
    // 23:30Z on the 22nd is already the 23rd in Amsterdam
    expect(localNow(new Date('2026-09-22T23:30:00Z')).date).toBe('2026-09-23')
  })
})

describe('sliceSlots', () => {
  it('cuts ranges into slots and drops a short tail', () => {
    expect(sliceSlots([{ start: '10:00', end: '12:30' }], 60)).toEqual([
      { start: '10:00', end: '11:00' },
      { start: '11:00', end: '12:00' },
    ])
  })
})

describe('computeAvailability', () => {
  it('opens only the weekdays in the template', () => {
    const days = computeAvailability({ config, bookings: [], from: '2026-09-21', to: '2026-09-27', now })
    expect(days.map((d) => d.open)).toEqual([false, false, false, false, false, true, false])
    expect(day(days, '2026-09-26').slots.map((s) => s.start)).toEqual(['10:00', '11:00', '12:00'])
  })

  it('a closed exception wins over the template', () => {
    const days = computeAvailability({
      config: { ...config, exceptions: [{ date: '2026-09-26', closed: true }] },
      bookings: [], from: '2026-09-26', to: '2026-09-26', now,
    })
    expect(day(days, '2026-09-26').open).toBe(false)
  })

  it('an exception with its own times replaces the weekday ranges', () => {
    const days = computeAvailability({
      config: { ...config, exceptions: [{ date: '2026-09-24', ranges: [{ start: '18:00', end: '20:00' }] }] },
      bookings: [], from: '2026-09-24', to: '2026-09-24', now,
    })
    expect(day(days, '2026-09-24').slots.map((s) => s.start)).toEqual(['18:00', '19:00'])
    expect(openingRangesFor({ ...config, exceptions: [{ date: '2026-09-26', ranges: [] }] }, '2026-09-26')).toEqual([])
  })

  it('hides slots inside the lead time', () => {
    // Saturday 09:30 local: with 24h lead nothing today; with 0h lead the 10:00 slot is still open
    const satMorning = new Date('2026-09-26T07:30:00Z')
    const strict = computeAvailability({ config, bookings: [], from: '2026-09-26', to: '2026-09-26', now: satMorning })
    expect(day(strict, '2026-09-26').open).toBe(false)
    const loose = computeAvailability({ config: { ...config, minLeadHours: 0 }, bookings: [], from: '2026-09-26', to: '2026-09-26', now: satMorning })
    expect(day(loose, '2026-09-26').slots.map((s) => s.start)).toEqual(['10:00', '11:00', '12:00'])
  })

  it('stops at the booking horizon', () => {
    const days = computeAvailability({ config: { ...config, maxWeeksAhead: 1 }, bookings: [], from: '2026-09-26', to: '2026-10-03', now })
    expect(day(days, '2026-09-26').open).toBe(true)
    expect(day(days, '2026-10-03').open).toBe(false)
  })

  it('subtracts confirmed bookings and reports a full slot', () => {
    const days = computeAvailability({
      config: { ...config, capacityPerSlot: 2 },
      bookings: [{ date: '2026-09-26', startTime: '10:00', count: 2 }, { date: '2026-09-26', startTime: '11:00', count: 1 }],
      from: '2026-09-26', to: '2026-09-26', now,
    })
    expect(day(days, '2026-09-26').slots.map((s) => s.remaining)).toEqual([0, 1, 2])
    expect(day(days, '2026-09-26').open).toBe(true)
  })

  it('keeps wall-clock slots across the DST change', () => {
    // Sunday 2026-10-25 is the switch; Saturday 31st must still read 10:00
    const days = computeAvailability({ config, bookings: [], from: '2026-10-31', to: '2026-10-31', now: new Date('2026-10-20T10:00:00Z') })
    expect(day(days, '2026-10-31').slots[0].start).toBe('10:00')
  })

  it('yields nothing while disabled or before bookableFrom', () => {
    expect(computeAvailability({ config: { ...config, enabled: false }, bookings: [], from: '2026-09-26', to: '2026-09-26', now })[0].open).toBe(false)
    const later = computeAvailability({ config: { ...config, bookableFrom: '2026-10-01' }, bookings: [], from: '2026-09-26', to: '2026-10-03', now })
    expect(day(later, '2026-09-26').open).toBe(false)
    expect(day(later, '2026-10-03').open).toBe(true)
  })
})

describe('findBookableSlot', () => {
  it('returns the slot only while it has room', () => {
    expect(findBookableSlot({ config, bookings: [], date: '2026-09-26', start: '10:00', now })).toMatchObject({ remaining: 1 })
    expect(findBookableSlot({ config, bookings: [{ date: '2026-09-26', startTime: '10:00', count: 1 }], date: '2026-09-26', start: '10:00', now })).toBeNull()
    expect(findBookableSlot({ config, bookings: [], date: '2026-09-27', start: '10:00', now })).toBeNull()
    expect(findBookableSlot({ config, bookings: [], date: 'nope', start: '10:00', now })).toBeNull()
  })
})

import { saturdaysBetween, toAvailabilityConfig } from '../availability'

describe('alleen zaterdag', () => {
  it('lists every Saturday in a range', () => {
    expect(saturdaysBetween('2026-09-22', '2026-10-17')).toEqual(['2026-09-26', '2026-10-03', '2026-10-10', '2026-10-17'])
    expect(saturdaysBetween('2026-09-26', '2026-09-26')).toEqual(['2026-09-26'])
  })

  it('turns the Saturday times into a schedule that opens nothing else', () => {
    const cfg = toAvailabilityConfig({ enabled: true, saturdayRanges: [{ start: '10:00', end: '12:00' }] })!
    const days = computeAvailability({ config: cfg, bookings: [], from: '2026-09-21', to: '2026-09-27', now })
    expect(days.filter((d) => d.open).map((d) => d.date)).toEqual(['2026-09-26'])
    expect(days.find((d) => d.date === '2026-09-26')!.slots.map((s) => s.start)).toEqual(['10:00', '11:00'])
  })

  it('ignores an exception on a weekday, honours one on a Saturday', () => {
    const cfg = toAvailabilityConfig({
      enabled: true,
      saturdayRanges: [{ start: '10:00', end: '12:00' }],
      exceptions: [
        { date: '2026-09-24', ranges: [{ start: '18:00', end: '20:00' }] },
        { date: '2026-10-03', closed: true },
      ],
    })!
    const days = computeAvailability({ config: cfg, bookings: [], from: '2026-09-21', to: '2026-10-04', now })
    expect(days.filter((d) => d.open).map((d) => d.date)).toEqual(['2026-09-26'])
  })

  it('reads the Saturday entry of the older weekly shape', () => {
    const cfg = toAvailabilityConfig({ enabled: true, weeklySchedule: [{ weekday: 6, ranges: [{ start: '10:00', end: '11:00' }] }] })!
    expect(cfg.weeklySchedule).toEqual([{ weekday: 6, ranges: [{ start: '10:00', end: '11:00' }] }])
    expect(toAvailabilityConfig(null)).toBeNull()
  })
})
