'use client'

import DebugPanelShell from '../../_shared/components/DebugPanelShell'
import { useClosetStore } from '../store'
import { useDebugPricing } from '../hooks/useDebugPricing'
import type { DebugSlotRow, DebugTopCabinetRow, DebugMaterialInfo } from '../hooks/useDebugPricing'

const fmt = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 })
const cm = (m: number) => (m * 100).toFixed(1)
const dims = (d: { w: number; h: number; d: number }) => `${cm(d.w)} × ${cm(d.h)} × ${cm(d.d)}`

function MaterialLine({ label, info }: { label: string; info: DebugMaterialInfo }) {
  return (
    <div className={`flex gap-1 ${info.isOverride ? 'text-amber-400' : ''}`}>
      <span>{info.isOverride ? '↑' : '↓'}</span>
      <span>{label}: {info.name} ({info.id})</span>
    </div>
  )
}

function SlotRow({ row }: { row: DebugSlotRow }) {
  if (row.isEmpty) {
    return (
      <div className="py-1 border-b border-border/30">
        <div className="flex items-center gap-1 text-muted-foreground/50">
          <span className="font-mono text-[10px] w-4 shrink-0">{row.slotIndex}</span>
          <span className="italic">Leeg</span>
        </div>
        <div className="pl-5 font-mono text-[10px] text-muted-foreground/40 flex flex-col gap-px">
          <span>{dims(row.dimensions.nominal)} cm</span>
          <MaterialLine label="buiten" info={row.buitenkant} />
          <MaterialLine label="binnen" info={row.binnenkant} />
        </div>
      </div>
    )
  }

  return (
    <div className="py-1 border-b border-border/30">
      <div className="flex items-center gap-1 font-mono">
        <span className="text-[10px] w-4 shrink-0 text-muted-foreground">{row.slotIndex}</span>
        <span className="font-semibold text-foreground truncate">{row.layoutName ?? `#${row.layoutId}`}</span>
        <span className="ml-auto text-muted-foreground text-[10px]">{row.pricingTier}</span>
        <span className="font-semibold">{fmt.format(row.slotSubtotal)}</span>
      </div>
      <div className="pl-5 flex flex-col gap-px text-muted-foreground text-[10px] font-mono">
        <div className="flex justify-between">
          <span>interieur</span>
          <span>{fmt.format(row.interiorCost)}</span>
        </div>
        {row.hasDoor && (
          <div className="flex justify-between">
            <span>deuren ({row.doorCount}× {row.doorVariant})</span>
            <span>{fmt.format(row.doorCost)}</span>
          </div>
        )}
        {row.hasDoor && (
          <div className="flex justify-between">
            <span>greep/mech. ({row.doorCount}×)</span>
            <span>{fmt.format(row.handleCost)}</span>
          </div>
        )}
        {row.powerHoleCost > 0 && (
          <div className="flex justify-between">
            <span>stekkerhole</span>
            <span>{fmt.format(row.powerHoleCost)}</span>
          </div>
        )}
        <div className="flex justify-between mt-0.5">
          <span>{dims(row.dimensions.nominal)} cm</span>
        </div>
        <div className="flex justify-between text-muted-foreground/50">
          <span>↳ {dims(row.dimensions.innerClear)} cm</span>
        </div>
        <MaterialLine label="buiten" info={row.buitenkant} />
        <MaterialLine label="binnen" info={row.binnenkant} />
      </div>
    </div>
  )
}

function TopCabinetRow({ row }: { row: DebugTopCabinetRow }) {
  return (
    <div className="py-1 border-b border-border/30">
      <div className="flex items-center gap-1 font-mono">
        <span className="text-[10px] w-4 shrink-0 text-muted-foreground">↑</span>
        <span className="font-semibold text-foreground">Bovenkast</span>
        <span className="ml-auto font-semibold">{fmt.format(row.subtotal)}</span>
      </div>
      <div className="pl-5 flex flex-col gap-px text-muted-foreground text-[10px] font-mono">
        <div className="flex justify-between">
          <span>deuren ({row.doorCount}× {row.doorVariant})</span>
          <span>{fmt.format(row.doorCost)}</span>
        </div>
        <div className="flex justify-between">
          <span>greep/mech. ({row.doorCount}×)</span>
          <span>{fmt.format(row.handleCost)}</span>
        </div>
      </div>
    </div>
  )
}

export default function DebugPricePanel() {
  const width = useClosetStore((s) => s.width)
  const height = useClosetStore((s) => s.height)
  const depth = useClosetStore((s) => s.depth)
  const moduleCount = useClosetStore((s) => s.moduleCount)

  const pricing = useDebugPricing()

  return (
    <DebugPanelShell
      title="debug"
      subtitle={`${width} × ${height} × ${depth} cm — ${moduleCount} modules`}
      footer={
        pricing ? (
          <div className="border-t border-border px-3 py-2 bg-muted/40 flex flex-col gap-0.5 font-mono">
            <div className="flex justify-between text-muted-foreground">
              <span>
                {pricing.global.ledCost > 0
                  ? `LED strips (${pricing.global.ledModuleCount} mod.)`
                  : 'LED strips'}
              </span>
              <span>{fmt.format(pricing.global.ledCost)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Bezorging</span>
              <span>{fmt.format(pricing.global.deliveryCost)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Montage{pricing.global.installationTierName ? ` (${pricing.global.installationTierName})` : ''}</span>
              <span>{fmt.format(pricing.global.installationCost)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground border-t border-border/50 mt-0.5 pt-0.5">
              <span>Subtotaal</span>
              <span>{fmt.format(pricing.global.subtotal)}</span>
            </div>
            <div className="flex justify-between font-semibold text-foreground">
              <span>Totaal</span>
              <span>{fmt.format(pricing.global.grandTotal)}</span>
            </div>
          </div>
        ) : undefined
      }
    >
      {pricing ? (
        <>
          {pricing.slots.map((row) => (
            <SlotRow key={row.slotIndex} row={row} />
          ))}
          {pricing.topCabinet && <TopCabinetRow row={pricing.topCabinet} />}
        </>
      ) : (
        <span className="text-[10px]">Prijsdata laden…</span>
      )}
    </DebugPanelShell>
  )
}
