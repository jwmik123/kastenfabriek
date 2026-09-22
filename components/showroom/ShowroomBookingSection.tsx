'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CalendarDays, Check, MapPin, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { saturdaysBetween, type DayAvailability, type Slot } from '@/lib/showroom/availability'
import { capitalizeFirst, formatDateNl, formatSlotNl } from '@/lib/showroom/format'
import { createShowroomAppointment, type ShowroomAppointmentResult } from '@/lib/actions/showroom-appointment'

const MONTHS_SHORT = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']

export interface ShowroomBookingSectionProps {
  /** Today in the showroom's zone, 'YYYY-MM-DD'. */
  today: string
  /** Last bookable date, 'YYYY-MM-DD'. */
  horizon: string
  /** Availability for [today, horizon], computed on the server. */
  initialDays: DayAvailability[]
  introText?: string
  addressLine?: string
  /** Set when booking opens later: the section then shows this date instead of a calendar. */
  bookableFrom?: string | null
}

/**
 * "Bezoek de showroom": the showroom only opens on Saturdays, so the customer
 * picks from a row of upcoming Saturdays; one opens a popup with its free time
 * slots and a short form. Availability comes from
 * the server (Sanity schedule minus confirmed bookings) and is refreshed after
 * every booking attempt, so a slot that just filled up disappears.
 */
export default function ShowroomBookingSection({
  today,
  horizon,
  initialDays,
  introText,
  addressLine,
  bookableFrom,
}: ShowroomBookingSectionProps) {
  const [days, setDays] = useState<Map<string, DayAvailability>>(
    () => new Map(initialDays.map((d) => [d.date, d])),
  )
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/showroom/availability?from=${today}&to=${horizon}`, { cache: 'no-store' })
      if (!res.ok) return
      const data = (await res.json()) as { days: DayAvailability[] }
      setDays(new Map(data.days.map((d) => [d.date, d])))
    } catch {
      // keep what we have
    }
  }, [today, horizon])

  const saturdays = useMemo(() => saturdaysBetween(today, horizon), [today, horizon])
  const openDays = useMemo(() => [...days.values()].filter((d) => d.open).length, [days])

  const selectedDay = selectedDate ? days.get(selectedDate) ?? null : null

  if (bookableFrom && bookableFrom > today) {
    return (
      <SectionShell introText={introText} addressLine={addressLine}>
        <div className="rounded-xl bg-white/80 p-6 text-center text-sm text-gray-700">
          <CalendarDays className="mx-auto mb-2 h-6 w-6 text-primary" />
          Afspraken maken kan vanaf{' '}
          <strong>{formatDateNl(bookableFrom)}</strong>. Tot die tijd kun je ons mailen
          voor een bezoek.
        </div>
      </SectionShell>
    )
  }

  return (
    <SectionShell introText={introText} addressLine={addressLine}>
      <div className="rounded-2xl bg-white shadow-sm p-4 sm:p-6" data-testid="showroom-calendar">
        <h3 className="text-base sm:text-lg font-semibold mb-4">Kies een zaterdag</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {saturdays.map((date) => {
            const day = days.get(date)
            const free = day?.slots.filter((s) => s.remaining > 0).length ?? 0
            const bookable = !!day && day.open && free > 0
            const full = !!day && day.open && free === 0
            const d = Number(date.slice(8, 10))
            const m = MONTHS_SHORT[Number(date.slice(5, 7)) - 1]
            return (
              <button
                key={date}
                type="button"
                disabled={!bookable}
                onClick={() => setSelectedDate(date)}
                aria-label={`Zaterdag ${d} ${m}${bookable ? `, ${free} tijdslot${free === 1 ? '' : 's'} vrij` : full ? ', vol' : ', gesloten'}`}
                className={cn(
                  'flex flex-col items-center justify-center rounded-lg border px-2 py-3 transition-colors',
                  bookable && 'border-primary bg-primary text-white hover:bg-primary-600 cursor-pointer',
                  full && 'border-gray-200 bg-gray-50 text-gray-400',
                  !bookable && !full && 'border-gray-200 text-gray-300',
                )}
              >
                <span className="text-[11px] uppercase tracking-wider opacity-80">za</span>
                <span className="text-lg font-semibold leading-tight">{d} {m}</span>
                <span className="text-[11px] mt-0.5 opacity-80">
                  {bookable ? `${free} ${free === 1 ? 'tijdslot' : 'tijdslots'} vrij` : full ? 'vol' : 'gesloten'}
                </span>
              </button>
            )
          })}
        </div>

        <p className="mt-4 text-xs text-gray-500">
          {openDays > 0
            ? 'De showroom is op zaterdag geopend. Kies een datum om een tijdslot te reserveren.'
            : 'Er zijn op dit moment geen tijdslots beschikbaar. Kijk later nog eens of mail ons.'}
        </p>
      </div>

      {selectedDay && (
        <SlotDialog
          day={selectedDay}
          onClose={() => setSelectedDate(null)}
          onBooked={refresh}
          onSlotTaken={refresh}
        />
      )}
    </SectionShell>
  )
}

function SectionShell({
  introText,
  addressLine,
  children,
}: {
  introText?: string
  addressLine?: string
  children: React.ReactNode
}) {
  const mapsHref = addressLine
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressLine)}`
    : undefined
  return (
    <section id="showroom" className="w-full scroll-mt-24 bg-[#f2ede4] py-20 md:py-28 px-4 sm:px-6 font-poppins">
      <div className="max-w-6xl mx-auto grid gap-10 lg:grid-cols-[1fr_minmax(0,520px)] lg:items-start">
        <div>
          <p className="text-amber-600 text-xs uppercase tracking-widest font-semibold mb-3">Showroom</p>
          <h2 className="text-3xl md:text-4xl font-semibold text-gray-900">
            Liever eerst zien en <span className="italic text-primary">voelen?</span>
          </h2>
          <p className="text-gray-600 mt-4 max-w-md">
            {introText ||
              'Kom langs in onze showroom en bekijk de materialen en modules in het echt. Kies een dag en tijd die jou uitkomt.'}
          </p>
          {addressLine && (
            <a
              href={mapsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-gray-600 text-sm mt-4 underline underline-offset-4 decoration-gray-300 hover:text-gray-900"
            >
              <MapPin className="w-4 h-4 shrink-0" />
              {addressLine}
            </a>
          )}
        </div>
        <div>{children}</div>
      </div>
    </section>
  )
}

type Phase = { kind: 'pick' } | { kind: 'form'; slot: Slot } | { kind: 'done'; result: Extract<ShowroomAppointmentResult, { ok: true }> }

function SlotDialog({
  day,
  onClose,
  onBooked,
  onSlotTaken,
}: {
  day: DayAvailability
  onClose: () => void
  onBooked: () => Promise<void>
  onSlotTaken: () => Promise<void>
}) {
  const [phase, setPhase] = useState<Phase>({ kind: 'pick' })
  const [form, setForm] = useState({ name: '', email: '', phone: '', note: '', company: '' })
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panelRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  // A slot may have filled up while the popup was open: drop back to the list.
  useEffect(() => {
    if (phase.kind !== 'form') return
    const still = day.slots.find((s) => s.start === phase.slot.start)
    if (!still || still.remaining <= 0) {
      setPhase({ kind: 'pick' })
      setError('Dit tijdslot is zojuist geboekt. Kies een ander moment.')
    }
  }, [day, phase])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (phase.kind !== 'form' || busy) return
    setBusy(true)
    setError(null)
    try {
      const result = await createShowroomAppointment({
        date: day.date,
        start: phase.slot.start,
        ...form,
      })
      if (result.ok) {
        setPhase({ kind: 'done', result })
        void onBooked()
      } else {
        setError(result.error)
        if (result.code === 'slot-taken') {
          setPhase({ kind: 'pick' })
          void onSlotTaken()
        }
      }
    } catch {
      setError('Er ging iets mis. Probeer het opnieuw of mail ons.')
    } finally {
      setBusy(false)
    }
  }

  const dayLabel = capitalizeFirst(formatDateNl(day.date))

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="showroom-dialog-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md max-h-[92dvh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white shadow-xl p-5 sm:p-6 font-poppins outline-none"
        data-testid="showroom-slot-dialog"
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-amber-600 font-semibold">Showroombezoek</p>
            <h3 id="showroom-dialog-title" className="text-lg font-semibold mt-1">
              {dayLabel}
            </h3>
          </div>
          <button
            type="button"
            aria-label="Sluiten"
            onClick={onClose}
            className="h-9 w-9 -mr-2 -mt-1 inline-flex items-center justify-center rounded-md hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800" role="alert">
            {error}
          </div>
        )}

        {phase.kind === 'pick' && (
          <>
            <p className="text-sm text-gray-600 mb-3">Kies een tijdslot:</p>
            <div className="grid grid-cols-3 gap-2">
              {day.slots.map((slot) => {
                const free = slot.remaining > 0
                return (
                  <button
                    key={slot.start}
                    type="button"
                    disabled={!free}
                    onClick={() => {
                      setError(null)
                      setPhase({ kind: 'form', slot })
                    }}
                    className={cn(
                      'rounded-md border px-3 py-2.5 text-sm font-medium tabular-nums transition-colors',
                      free
                        ? 'border-primary/30 text-gray-900 hover:bg-primary hover:text-white'
                        : 'border-gray-200 text-gray-300 line-through cursor-not-allowed',
                    )}
                  >
                    {slot.start}
                  </button>
                )
              })}
            </div>
          </>
        )}

        {phase.kind === 'form' && (
          <form onSubmit={submit} className="space-y-3">
            <div className="flex items-center justify-between rounded-md bg-[#f2ede4] px-3 py-2 text-sm">
              <span>
                <strong>{phase.slot.start}–{phase.slot.end}</strong> uur
              </span>
              <button type="button" className="text-primary underline underline-offset-2" onClick={() => setPhase({ kind: 'pick' })}>
                Andere tijd
              </button>
            </div>
            <Field label="Naam" required>
              <input
                required
                autoComplete="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="E-mailadres" required>
              <input
                required
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Telefoonnummer" required>
              <input
                required
                type="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Opmerking (optioneel)">
              <textarea
                rows={2}
                maxLength={1000}
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                className={inputClass}
                placeholder="Bijv. welke kast je in gedachten hebt"
              />
            </Field>
            {/* Honeypot: hidden from people, filled by bots. */}
            <div className="hidden" aria-hidden="true">
              <label>
                Bedrijf
                <input tabIndex={-1} autoComplete="off" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
              </label>
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-md bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-60"
            >
              {busy ? 'Bezig met reserveren…' : 'Reserveer dit tijdslot'}
            </button>
            <p className="text-[11px] text-gray-500">Je ontvangt direct een bevestiging per e-mail.</p>
          </form>
        )}

        {phase.kind === 'done' && (
          <div className="text-center py-4" data-testid="showroom-booked">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white">
              <Check className="h-6 w-6" />
            </div>
            <p className="font-semibold">Je bezoek staat ingepland</p>
            <p className="text-sm text-gray-600 mt-1">
              {capitalizeFirst(formatSlotNl(phase.result.date, phase.result.start, phase.result.end))}
            </p>
            <p className="text-xs text-gray-500 mt-3">Een bevestiging is onderweg naar je inbox.</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
            >
              Sluiten
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const inputClass =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary'

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </label>
  )
}
