'use client'

import { Plug, Zap } from 'lucide-react'
import { useWasmachinekastStore } from '../store'
import { Toggle } from '@/components/ui/Toggle'
import { cn } from '@/lib/utils'

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
      {children}
    </h3>
  )
}

export default function AccessoiresStep() {
  const modules = useWasmachinekastStore((s) => s.modules)
  const setHasPowerHole = useWasmachinekastStore((s) => s.setHasPowerHole)
  const mainsNotice = useWasmachinekastStore((s) => s.pricingData?.mainsElectricityNotice)
  const anyPrado = modules.some((m) => m.hasPowerHole)

  return (
    <div className="space-y-10">

      {/* ── Prado 2.0 ── */}
      <section className="space-y-5">
        <div>
          <h2 className="text-base font-semibold">Accessoires</h2>
          <SectionHeading>Prado 2.0</SectionHeading>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Selecteer een vak om Prado 2.0 toe te voegen
          </p>
        </div>

        <div className="grid grid-cols-8 gap-1">
          {modules.map((m) => {
            const active = m.hasPowerHole ?? false
            return (
              <button
                key={m.slotIndex}
                onClick={() => setHasPowerHole(m.slotIndex, !active)}
                className={cn(
                  'aspect-square flex flex-col items-center justify-center rounded-md text-sm font-medium transition-colors gap-0.5',
                  active
                    ? 'bg-primary text-primary-foreground border-0'
                    : 'border border-border/50 bg-transparent text-foreground hover:border-border hover:bg-muted/40',
                )}
              >
                {m.slotIndex + 1}
                {active && <Plug className="w-3 h-3" data-plug="1" />}
              </button>
            )
          })}
        </div>
        {anyPrado && mainsNotice && (
          <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
            <Zap className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{mainsNotice}</span>
          </div>
        )}
      </section>

    </div>
  )
}
