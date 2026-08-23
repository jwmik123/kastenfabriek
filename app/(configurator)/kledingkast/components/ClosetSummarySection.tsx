'use client'

import { useClosetStore } from '../store'
import ConfiguratorServicesBar from '../../_shared/components/ConfiguratorServicesBar'
import type { ConfiguratorService } from '@/lib/configurator/services'
import { SpecRow, MaterialSwatch } from '../../_shared/components/SpecList'

// ─── Module summary ───────────────────────────────────────────────────────────

function ModulesSummary() {
  const modules = useClosetStore((s) => s.modules)
  const moduleCount = useClosetStore((s) => s.moduleCount)
  const moduleWidthCm = useClosetStore((s) => s.moduleWidthCm)
  const width = useClosetStore((s) => s.width)

  const doorsCount = modules.filter((m) => m.hasDoor).length
  const doubleCount = modules.filter((m) => m.span === 2).length
  const singleCount = moduleCount - doubleCount * 2

  const widthPerModule = moduleWidthCm()

  return (
    <>
      <SpecRow label="Aantal modules">
        {moduleCount} ({Math.round(widthPerModule)} cm breed per module)
      </SpecRow>
      {doubleCount > 0 && (
        <SpecRow label="Dubbele modules">{doubleCount}</SpecRow>
      )}
      <SpecRow label="Modules met deur">
        {doorsCount} van {moduleCount}
      </SpecRow>
    </>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ClosetSummarySection({ services }: { services: ConfiguratorService[] }) {
  const width = useClosetStore((s) => s.width)
  const height = useClosetStore((s) => s.height)
  const depth = useClosetStore((s) => s.depth)
  const buitenkantMaterialId = useClosetStore((s) => s.buitenkantMaterialId)
  const binnenkantMaterialId = useClosetStore((s) => s.binnenkantMaterialId)
  const doorHandleId = useClosetStore((s) => s.doorHandleId)
  const needsTopCabinet = useClosetStore((s) => s.needsTopCabinet)
  const topCabinetHeight = useClosetStore((s) => s.topCabinetHeight)
  const handles = useClosetStore((s) => s.pricingData?.handles)

  // Handles are Sanity-driven, so their display names live on the pricing data.
  const handle = handles?.find((h) => h.id === doorHandleId)
  const handleLabel =
    doorHandleId === 'none'
      ? 'Geen (push-to-open)'
      : handle?.nameNl ?? handle?.name ?? doorHandleId

  return (
    <>
      {/* Services bar — full width, directly under configurator */}
      <ConfiguratorServicesBar services={services} />

      {/* Specifications */}
      <section className="w-full container mx-auto px-4 py-12 md:py-24">
        <div className='flex flex-col lg:flex-row gap-24'>
          <div>
            <h2 className="text-xl md:text-2xl lg:text-5xl font-semibold mb-1">Jouw kast specificaties</h2>
            <p className="text-md text-muted-foreground mb-5">
              Een overzicht van jouw configuratie.
            </p>
          </div>
          <div className="flex-1 bg-white border border-border rounded-xl px-6 divide-y divide-border">
            <SpecRow label="Breedte">{width} cm</SpecRow>
            <SpecRow label="Hoogte">{height} cm</SpecRow>
            <SpecRow label="Diepte">{depth} cm</SpecRow>
            {needsTopCabinet() && (
              <SpecRow label="Bovenkast hoogte">{Math.round(topCabinetHeight())} cm</SpecRow>
            )}
            <ModulesSummary />
            <SpecRow label="Materiaal buiten">
              <MaterialSwatch id={buitenkantMaterialId} />
            </SpecRow>
            <SpecRow label="Materiaal binnen">
              <MaterialSwatch id={binnenkantMaterialId} />
            </SpecRow>
            <SpecRow label="Handgreep">{handleLabel}</SpecRow>
          </div>
        </div>
      </section>
    </>
  )
}
