/**
 * Showroom opening schedule → bookable time slots. Pure: the Sanity singleton
 * and the confirmed bookings go in, the slots per day come out. The homepage
 * calendar, the booking action and the Studio preview all read this, so a
 * slot can only ever exist in one place.
 *
 * All dates are wall-clock in the showroom's own zone (Europe/Amsterdam):
 * a date is 'YYYY-MM-DD', a time 'HH:mm'. Nothing here is a UTC instant,
 * so a DST change never moves a Saturday-morning slot.
 */

export const SHOWROOM_TIME_ZONE = 'Europe/Amsterdam'

/** 0 = Sunday … 6 = Saturday, as `Date#getDay`. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

export interface TimeRange {
  /** 'HH:mm' */
  start: string
  /** 'HH:mm', after `start` */
  end: string
}

export interface WeeklyOpening {
  weekday: Weekday
  ranges: TimeRange[]
}

export interface DateException {
  /** 'YYYY-MM-DD' */
  date: string
  /** Closed all day; `ranges` is ignored. */
  closed?: boolean
  /** Opening times for this date, replacing the weekday's. */
  ranges?: TimeRange[]
}

export interface ShowroomAvailabilityConfig {
  enabled?: boolean
  /** 'YYYY-MM-DD': nothing before this is bookable (showroom not finished yet). */
  bookableFrom?: string | null
  slotMinutes?: number
  capacityPerSlot?: number
  minLeadHours?: number
  maxWeeksAhead?: number
  weeklySchedule?: WeeklyOpening[]
  exceptions?: DateException[]
}

export interface BookingCount {
  date: string
  startTime: string
  count: number
}

export interface Slot {
  date: string
  start: string
  end: string
  /** Bookings still possible in this slot. */
  remaining: number
}

export interface DayAvailability {
  date: string
  /** The showroom is open this day, even when every slot is taken. */
  open: boolean
  slots: Slot[]
}

/** The showroom only ever opens on Saturdays. */
export const SHOWROOM_WEEKDAY: Weekday = 6

/** The Sanity document as stored: one set of Saturday times, not a weekly template. */
export interface ShowroomDocument extends Omit<ShowroomAvailabilityConfig, 'weeklySchedule'> {
  saturdayRanges?: TimeRange[]
  /** Older shape of the document; its Saturday entry is used when `saturdayRanges` is missing. */
  weeklySchedule?: WeeklyOpening[]
}

/**
 * Sanity document → availability config. Only Saturdays open, and an
 * exception on any other day is ignored, so a stray date can never open a
 * weekday.
 */
export function toAvailabilityConfig(doc: ShowroomDocument | null | undefined): ShowroomAvailabilityConfig | null {
  if (!doc) return null
  const ranges =
    doc.saturdayRanges ??
    doc.weeklySchedule?.find((w) => Number(w?.weekday) === SHOWROOM_WEEKDAY)?.ranges ??
    []
  return {
    ...doc,
    weeklySchedule: [{ weekday: SHOWROOM_WEEKDAY, ranges }],
    exceptions: (doc.exceptions ?? []).filter((e) => isIsoDate(e?.date) && weekdayOf(e.date) === SHOWROOM_WEEKDAY),
  }
}

/** Every Saturday in [from, to]. */
export function saturdaysBetween(from: string, to: string): string[] {
  const out: string[] = []
  if (!isIsoDate(from) || !isIsoDate(to)) return out
  let d = addDays(from, (SHOWROOM_WEEKDAY - weekdayOf(from) + 7) % 7)
  while (daysBetween(d, to) >= 0) {
    out.push(d)
    d = addDays(d, 7)
  }
  return out
}

export const DEFAULTS = {
  slotMinutes: 60,
  capacityPerSlot: 1,
  minLeadHours: 24,
  maxWeeksAhead: 8,
} as const

// ---------------------------------------------------------------- date maths

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/

export function isIsoDate(s: unknown): s is string {
  if (typeof s !== 'string' || !DATE_RE.test(s)) return false
  const d = new Date(`${s}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s
}

export function isTime(s: unknown): s is string {
  return typeof s === 'string' && TIME_RE.test(s)
}

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export function minutesToTime(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** Calendar days between two ISO dates (b − a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((Date.UTC(+b.slice(0, 4), +b.slice(5, 7) - 1, +b.slice(8, 10)) -
    Date.UTC(+a.slice(0, 4), +a.slice(5, 7) - 1, +a.slice(8, 10))) / 86400000)
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export function weekdayOf(date: string): Weekday {
  return new Date(`${date}T00:00:00Z`).getUTCDay() as Weekday
}

/** The showroom's wall clock right now: local date and minutes since midnight. */
export function localNow(now: Date, timeZone = SHOWROOM_TIME_ZONE): { date: string; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00'
  const hour = Number(get('hour')) % 24 // some engines print 24:00
  return { date: `${get('year')}-${get('month')}-${get('day')}`, minutes: hour * 60 + Number(get('minute')) }
}

// ---------------------------------------------------------------- schedule

function cleanRanges(ranges: TimeRange[] | undefined): TimeRange[] {
  return (ranges ?? [])
    .filter((r) => isTime(r?.start) && isTime(r?.end) && timeToMinutes(r.end) > timeToMinutes(r.start))
    .sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start))
}

/** Opening ranges of one date: an exception wins over the weekly template. */
export function openingRangesFor(config: ShowroomAvailabilityConfig, date: string): TimeRange[] {
  const exception = (config.exceptions ?? []).find((e) => e?.date === date)
  if (exception) {
    if (exception.closed) return []
    if (exception.ranges && exception.ranges.length > 0) return cleanRanges(exception.ranges)
    return []
  }
  const weekday = weekdayOf(date)
  const day = (config.weeklySchedule ?? []).find((w) => Number(w?.weekday) === weekday)
  return day ? cleanRanges(day.ranges) : []
}

/** Slice opening ranges into slots of `slotMinutes`; a tail shorter than a slot is dropped. */
export function sliceSlots(ranges: TimeRange[], slotMinutes: number): TimeRange[] {
  const step = Math.max(5, Math.floor(slotMinutes))
  const out: TimeRange[] = []
  for (const r of ranges) {
    for (let t = timeToMinutes(r.start); t + step <= timeToMinutes(r.end); t += step) {
      out.push({ start: minutesToTime(t), end: minutesToTime(t + step) })
    }
  }
  return out
}

export interface ComputeInput {
  config: ShowroomAvailabilityConfig | null | undefined
  bookings: BookingCount[]
  /** First date to report, 'YYYY-MM-DD'. */
  from: string
  /** Last date to report, inclusive. */
  to: string
  now: Date
  timeZone?: string
}

/**
 * Availability per day in [from, to]. Days outside the booking window, before
 * `bookableFrom`, or with the whole config disabled come back closed.
 */
export function computeAvailability({ config, bookings, from, to, now, timeZone }: ComputeInput): DayAvailability[] {
  const days: DayAvailability[] = []
  if (!isIsoDate(from) || !isIsoDate(to) || daysBetween(from, to) < 0) return days
  if (!config || config.enabled === false) {
    for (let d = from; daysBetween(d, to) >= 0; d = addDays(d, 1)) days.push({ date: d, open: false, slots: [] })
    return days
  }

  const slotMinutes = config.slotMinutes && config.slotMinutes > 0 ? config.slotMinutes : DEFAULTS.slotMinutes
  const capacity = config.capacityPerSlot && config.capacityPerSlot > 0 ? Math.floor(config.capacityPerSlot) : DEFAULTS.capacityPerSlot
  const leadHours = config.minLeadHours ?? DEFAULTS.minLeadHours
  const weeksAhead = config.maxWeeksAhead ?? DEFAULTS.maxWeeksAhead

  const local = localNow(now, timeZone)
  const lastDate = addDays(local.date, weeksAhead * 7)
  const bookableFrom = isIsoDate(config.bookableFrom) ? config.bookableFrom : null

  const booked = new Map<string, number>()
  for (const b of bookings) booked.set(`${b.date} ${b.startTime}`, (booked.get(`${b.date} ${b.startTime}`) ?? 0) + b.count)

  for (let d = from; daysBetween(d, to) >= 0; d = addDays(d, 1)) {
    const inWindow = daysBetween(local.date, d) >= 0 && daysBetween(d, lastDate) >= 0
    const afterOpening = !bookableFrom || daysBetween(bookableFrom, d) >= 0
    const ranges = inWindow && afterOpening ? openingRangesFor(config, d) : []
    if (ranges.length === 0) {
      days.push({ date: d, open: false, slots: [] })
      continue
    }
    const dayOffsetMin = daysBetween(local.date, d) * 1440
    const slots: Slot[] = []
    for (const s of sliceSlots(ranges, slotMinutes)) {
      const minutesUntilStart = dayOffsetMin + timeToMinutes(s.start) - local.minutes
      if (minutesUntilStart < leadHours * 60) continue
      const remaining = Math.max(0, capacity - (booked.get(`${d} ${s.start}`) ?? 0))
      slots.push({ date: d, start: s.start, end: s.end, remaining })
    }
    days.push({ date: d, open: slots.length > 0, slots })
  }
  return days
}

/** The one slot at (date, start), or null when it is not bookable right now. */
export function findBookableSlot(input: Omit<ComputeInput, 'from' | 'to'> & { date: string; start: string }): Slot | null {
  if (!isIsoDate(input.date)) return null
  const [day] = computeAvailability({ ...input, from: input.date, to: input.date })
  const slot = day?.slots.find((s) => s.start === input.start)
  return slot && slot.remaining > 0 ? slot : null
}
