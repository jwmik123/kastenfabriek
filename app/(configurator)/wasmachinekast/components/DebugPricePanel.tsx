'use client'

import DebugPanelShell from '../../_shared/components/DebugPanelShell'
import { useWasmachinekastStore } from '../store'
import { useWasmPricing } from '../hooks/useWasmPricing'
import type { WasmPriceRow, WasmPricingResult, WasmTopCabinetRow } from '../pricing/computeWasmPricing'

const fmt = new Intl.NumberFormat('nl-NL', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const SECTION_LABEL: Record<'high' | 'low', string> = {
  high: 'Hoge kast',
  low: 'Lage kast',
}

function Line({
  label,
  value,
  muted,
  strong,
}: {
  label: React.ReactNode
  value: number
  muted?: boolean
  strong?: boolean
}) {
  return (
    <div className={`flex justify-between gap-2 ${strong ? 'font-semibold text-foreground' : ''} ${muted ? 'text-muted-foreground/60' : ''}`}>
      <span className="truncate">{label}</span>
      <span className="shrink-0">{fmt.format(value)}</span>
    </div>
  )
}

function ModuleRow({ row, handleName }: { row: WasmPriceRow; handleName: (id: string) => string }) {
  if (row.isEmpty) {
    return (
      <div className="py-1 border-b border-border/30 flex items-center gap-1 text-muted-foreground/50 font-mono">
        <span className="text-[10px] w-4 shrink-0">{row.slotIndex}</span>
        <span className="italic">Leeg</span>
      </div>
    )
  }

  return (
    <div className="py-1 border-b border-border/30">
      <div className="flex items-center gap-1 font-mono">
        <span className="text-[10px] w-4 shrink-0 text-muted-foreground">{row.slotIndex}</span>
        <span className="font-semibold text-foreground truncate">
          {row.layoutName ?? `#${row.layoutId}`}
        </span>
        <span className="ml-auto text-muted-foreground text-[10px] shrink-0">{row.pricingTier}</span>
        <span className="font-semibold shrink-0">{fmt.format(row.subtotal)}</span>
      </div>
      <div className="pl-5 flex flex-col gap-px text-muted-foreground text-[10px] font-mono">
        <Line label={`interieur (#${row.layoutId})`} value={row.interiorCost} />
        {!row.hasPriceDoc && (
          <div className="text-amber-400">⚠ geen prijsdocument in Sanity — telt als € 0</div>
        )}
        {row.hasDoor && (
          <Line label={`deur (${row.doorCount}× ${row.doorVariant})`} value={row.doorCost} />
        )}
        {row.hasDoor && (
          <Line
            label={`greep ${handleName(row.handleId ?? 'none')} (${row.handleCount}×)`}
            value={row.handleCost}
          />
        )}
        {row.drawerFrontCount > 0 && (
          <Line
            label={`ladefronten (${row.drawerFrontCount}× ${handleName(row.drawerHandleId ?? 'none')})`}
            value={row.drawerHandleCost}
          />
        )}
        {row.powerHoleCost > 0 && <Line label="stekkerdoos" value={row.powerHoleCost} />}
        {(row.isWasher || row.pushToOpen) && (
          <div className="text-muted-foreground/60">
            {[row.isWasher ? 'wasmachine' : null, row.pushToOpen ? 'push-to-open' : null]
              .filter(Boolean)
              .join(' · ')}
          </div>
        )}
      </div>
    </div>
  )
}

function TopCabinetRow({ row }: { row: WasmTopCabinetRow }) {
  return (
    <div className="py-1 border-b border-border/30">
      <div className="flex items-center gap-1 font-mono">
        <span className="text-[10px] w-4 shrink-0 text-muted-foreground">↑</span>
        <span className="font-semibold text-foreground">Bovenkast</span>
        <span className="ml-auto font-semibold">{fmt.format(row.subtotal)}</span>
      </div>
      <div className="pl-5 flex flex-col gap-px text-muted-foreground text-[10px] font-mono">
        <Line label={`deuren (${row.doorCount}× ${row.doorVariant})`} value={row.doorCost} />
        <Line label={`push-to-open (${row.doorCount}×)`} value={row.handleCost} />
      </div>
    </div>
  )
}

function Totals({ pricing }: { pricing: WasmPricingResult }) {
  const t = pricing.totals
  return (
    <div className="border-t border-border px-3 py-2 bg-muted/40 flex flex-col gap-0.5 font-mono text-[10px] text-muted-foreground">
      <Line label="Modules" value={t.moduleCost} />
      <Line label="Deuren" value={t.doorCost} />
      <Line label="Grepen / mechanisme" value={t.mechanismCost} />
      <Line
        label={t.ledCost > 0 ? `LED strips (${t.ledModuleCount} mod.)` : 'LED strips'}
        value={t.ledCost}
      />
      {t.powerHoleCost > 0 && (
        <Line label={`Stekkerdozen (${t.powerHoleCount}×)`} value={t.powerHoleCost} />
      )}
      {t.sidePanelCost > 0 && <Line label="Zijpanelen 36 mm" value={t.sidePanelCost} />}
      <div className="border-t border-border/50 mt-0.5 pt-0.5" />
      <Line label="Kast" value={t.cabinetCost} />
      <Line label="Bezorging" value={t.deliveryCost} />
      <Line label="Subtotaal" value={t.subtotal} />
      {/* The tier is looked up against the cabinet alone — delivery and LED are
          stripped out, so they cannot shove a configuration a band higher. */}
      <Line label="Montagebasis (excl. bezorging + LED)" value={t.installationBasis} muted />
      <Line
        label={`Montage${t.installationTier ? ` · ${t.installationTier.name}` : ' · geen tier'}`}
        value={t.installationTier?.price ?? 0}
      />
      {t.freeMontageApplied && (
        <Line label="Gratis montage-actie" value={-t.freeMontageDiscount} />
      )}
      <Line label="Totaal" value={t.grandTotal} strong />
    </div>
  )
}

export default function DebugPricePanel() {
  const pricing = useWasmPricing()
  const pricingData = useWasmachinekastStore((s) => s.pricingData)
  const width = useWasmachinekastStore((s) => s.width)
  const height = useWasmachinekastStore((s) => s.height)
  const depth = useWasmachinekastStore((s) => s.depth)
  const layout = useWasmachinekastStore((s) => s.layout)
  const lowSection = useWasmachinekastStore((s) => s.lowSection)

  const handleName = (id: string) =>
    id === 'none' ? 'push-to-open' : pricingData?.handles.find((h) => h.id === id)?.name ?? id

  const sections: Array<'high' | 'low'> = ['high', 'low']
  const showSectionLabels = pricing.rows.some((r) => r.section === 'high')
    && pricing.rows.some((r) => r.section === 'low')

  return (
    <DebugPanelShell
      title="debug"
      subtitle={
        <>
          {width} × {height} × {depth} cm · {layout}
          {lowSection ? ` · laag ${lowSection.width}×${lowSection.height}` : ''}
        </>
      }
      footer={pricingData ? <Totals pricing={pricing} /> : undefined}
    >
      {!pricingData && <span className="text-[10px]">Prijsdata laden…</span>}
      {pricingData &&
        sections.map((section) => {
          const rows = pricing.rows.filter((r) => r.section === section)
          if (rows.length === 0) return null
          return (
            <div key={section}>
              {showSectionLabels && (
                <div className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground/70 pt-1">
                  {SECTION_LABEL[section]}
                </div>
              )}
              {rows.map((row) => (
                <ModuleRow key={`${section}-${row.slotIndex}`} row={row} handleName={handleName} />
              ))}
            </div>
          )
        })}
      {pricingData && pricing.topCabinet && <TopCabinetRow row={pricing.topCabinet} />}
    </DebugPanelShell>
  )
}
