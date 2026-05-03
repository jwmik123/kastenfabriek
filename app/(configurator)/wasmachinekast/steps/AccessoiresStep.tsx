'use client'

import { Plug } from 'lucide-react'
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

  return (
    <div className="space-y-10">

      {/* ── Stekkerdoos gaten ── */}
      <section className="space-y-5">
        <div>
          <h2 className="text-base font-semibold">Accessoires</h2>
          <SectionHeading>Stekkerdoos gaten</SectionHeading>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Selecteer een vak om een stekkerdoos gat toe te voegen
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
      </section>

    </div>
  )
}
