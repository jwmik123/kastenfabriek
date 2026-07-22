'use client'

import { Plug, Zap } from 'lucide-react'
import { useClosetStore } from '../store'
import { Toggle } from '@/components/ui/Toggle'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { cn } from '@/lib/utils'

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
      {children}
    </h3>
  )
}

export default function AccessoiresStep() {
  const lightStripsEnabled = useClosetStore((s) => s.lightStripsEnabled)
  const setLightStripsEnabled = useClosetStore((s) => s.setLightStripsEnabled)
  const modules = useClosetStore((s) => s.modules)
  const setHasPowerHole = useClosetStore((s) => s.setHasPowerHole)
  const sidePanelThickness = useClosetStore((s) => s.sidePanelThickness)
  const setSidePanelThickness = useClosetStore((s) => s.setSidePanelThickness)
  const diagonalSide = useClosetStore((s) => s.diagonalSide)
  const sidePanels36mmLocked = diagonalSide !== 'none'
  const mainsNotice = useClosetStore((s) => s.pricingData?.mainsElectricityNotice)
  const anyPrado = modules.some((m) => m.hasPowerHole)

  return (
    <div className="space-y-10">

      {/* ── Verlichting ── */}
      <section className="space-y-5">
        <div>
          <h2 className="text-base font-semibold">Verlichting</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Voeg LED-lichtstrips toe aan de binnenzijde van de modules.
          </p>
        </div>

        <div className="flex items-center justify-between gap-4 p-4 rounded-md border">
          <div>
            <p className="text-sm font-medium">LED-lichtstrips</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Warm wit licht, 10 cm van de voorzijde ingebouwd in de zijwanden.
            </p>
          </div>
          <Toggle checked={lightStripsEnabled} onCheckedChange={setLightStripsEnabled} />
        </div>
        {lightStripsEnabled && mainsNotice && (
          <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
            <Zap className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{mainsNotice}</span>
          </div>
        )}
      </section>

      {/* ── Zijpanelen dikte ── */}
      <section className="space-y-5">
        <div>
          <h2 className="text-base font-semibold">Zijpanelen</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Standaard 18 mm. Upgrade naar 36 mm voor een robuustere uitstraling.
          </p>
        </div>

        <div className="p-4 rounded-md border space-y-2">
          <SegmentedControl<'18mm' | '36mm'>
            options={[
              { value: '18mm', label: '18 mm' },
              { value: '36mm', label: '36 mm' },
            ]}
            value={sidePanelThickness}
            onChange={(v) => setSidePanelThickness(v)}
            disabledValues={sidePanels36mmLocked ? ['36mm'] : []}
          />
          {sidePanels36mmLocked && (
            <p className="text-xs text-muted-foreground">
              36 mm zijpanelen zijn niet beschikbaar met schuine wand.
            </p>
          )}
        </div>
      </section>

      {/* ── Prado 2.0 ── */}
      <section className="space-y-5">
        <div>
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
