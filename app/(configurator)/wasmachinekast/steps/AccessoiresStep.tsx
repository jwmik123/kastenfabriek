'use client'

import { Info, Plug, Zap } from 'lucide-react'
import type { BaseModuleSlot } from '../../_shared/store/types'
import { useWasmachinekastStore } from '../store'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { cn } from '@/lib/utils'

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
      {children}
    </h3>
  )
}

function SlotGrid({
  modules,
  onToggle,
}: {
  modules: BaseModuleSlot[]
  onToggle: (slotIndex: number, value: boolean) => void
}) {
  return (
    <div className="grid grid-cols-8 gap-1">
      {modules.map((m) => {
        const active = m.hasPowerHole ?? false
        return (
          <button
            key={m.slotIndex}
            onClick={() => onToggle(m.slotIndex, !active)}
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
  )
}

export default function AccessoiresStep() {
  const modules = useWasmachinekastStore((s) => s.modules)
  const setHasPowerHole = useWasmachinekastStore((s) => s.setHasPowerHole)
  const lowSection = useWasmachinekastStore((s) => s.lowSection)
  const setLowSectionHasPowerHole = useWasmachinekastStore((s) => s.setLowSectionHasPowerHole)
  const mainsNotice = useWasmachinekastStore((s) => s.pricingData?.mainsElectricityNotice)
  const layout = useWasmachinekastStore((s) => s.layout)
  const accessories = useWasmachinekastStore((s) => s.pricingData?.accessories)
  const lowOnlyAccessoryNotice = useWasmachinekastStore((s) => s.lowOnlyAccessoryNotice)
  const dismissLowOnlyAccessoryNotice = useWasmachinekastStore((s) => s.dismissLowOnlyAccessoryNotice)
  const sidePanelThickness = useWasmachinekastStore((s) => s.sidePanelThickness)
  const setSidePanelThickness = useWasmachinekastStore((s) => s.setSidePanelThickness)

  const powerOutlet = accessories?.find((a) => a.id === 'power-outlet')
  const socketHidden = layout === 'low-only' && powerOutlet?.availableForLowSection === false
  const isDual = layout === 'low-left' || layout === 'low-right'
  const anySocket =
    modules.some((m) => m.hasPowerHole) ||
    (lowSection?.modules.some((m) => m.hasPowerHole) ?? false)

  return (
    <div className="space-y-10">
      {lowOnlyAccessoryNotice && (
        <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="flex-1">
            Sommige accessoires passen niet in een lage kast en zijn verwijderd uit je configuratie.
          </span>
          <button
            type="button"
            onClick={dismissLowOnlyAccessoryNotice}
            className="text-amber-900 underline underline-offset-2 hover:text-amber-950"
          >
            Begrepen
          </button>
        </div>
      )}

      {/* ── Zijpanelen dikte ── */}
      <section className="space-y-5">
        <div>
          <h2 className="text-base font-semibold">Zijpanelen</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Standaard 18 mm. Upgrade naar 36 mm voor een robuustere uitstraling.
          </p>
        </div>

        <div className="p-4 rounded-md border">
          <SegmentedControl<'18mm' | '36mm'>
            options={[
              { value: '18mm', label: '18 mm' },
              { value: '36mm', label: '36 mm' },
            ]}
            value={sidePanelThickness}
            onChange={(v) => setSidePanelThickness(v)}
          />
        </div>
      </section>

      {!socketHidden && (
        <section className="space-y-5">
          <div>
            <SectionHeading>Stekkerdoos</SectionHeading>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Selecteer een vak om een stekkerdoos toe te voegen
            </p>
          </div>

          {isDual && lowSection ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Hoge kast</p>
                <SlotGrid modules={modules} onToggle={setHasPowerHole} />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Lage kast</p>
                <SlotGrid
                  modules={lowSection.modules}
                  onToggle={setLowSectionHasPowerHole}
                />
              </div>
            </div>
          ) : (
            <SlotGrid modules={modules} onToggle={setHasPowerHole} />
          )}

          {anySocket && mainsNotice && (
            <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
              <Zap className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{mainsNotice}</span>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
