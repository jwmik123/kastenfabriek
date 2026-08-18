'use client'

import { useWasmachinekastStore } from '../store'
import type { Section } from '../sections/types'
import type { WasmLayout } from '../sections/types'
import type { HandleType } from '@/types/configurator-pricing'
import ConfiguratorServicesBar from '../../_shared/components/ConfiguratorServicesBar'
import { SpecRow, MaterialSwatch } from '../../_shared/components/SpecList'

const LAYOUT_LABELS: Record<WasmLayout, string> = {
  'high-only': 'Alleen hoge kast',
  'low-only': 'Alleen lage kast',
  'low-left': 'Lage links + hoge rechts',
  'low-right': 'Hoge links + lage rechts',
}

// Handles are Sanity-driven, so their display names live on the pricing data.
function handleLabel(id: string, handles: HandleType[] | undefined) {
  if (id === 'none') return 'Geen (push-to-open)'
  const handle = handles?.find((h) => h.id === id)
  return handle?.nameNl ?? handle?.name ?? id
}

/**
 * Specs for one section. In a dual layout both sections have their own width,
 * height and module count, so each gets its own block.
 */
function SectionSpecs({
  section,
  prefix,
  washerCount,
}: {
  section: Section
  prefix: string
  washerCount: number
}) {
  const doorsCount = section.modules.filter((m) => m.hasDoor).length
  const doubleCount = section.modules.filter((m) => m.span === 2).length
  const widthPerModule = section.moduleCount > 0 ? section.width / section.moduleCount : 0

  return (
    <>
      <SpecRow label={`${prefix} breedte`}>{section.width} cm</SpecRow>
      <SpecRow label={`${prefix} hoogte`}>{section.height} cm</SpecRow>
      <SpecRow label={`${prefix} modules`}>
        {section.moduleCount} ({Math.round(widthPerModule)} cm breed per module)
      </SpecRow>
      {doubleCount > 0 && <SpecRow label={`${prefix} dubbele modules`}>{doubleCount}</SpecRow>}
      <SpecRow label={`${prefix} modules met deur`}>
        {doorsCount} van {section.moduleCount}
      </SpecRow>
      {washerCount > 0 && (
        <SpecRow label={`${prefix} wasmachines`}>{washerCount}</SpecRow>
      )}
    </>
  )
}

export default function WasmSummarySection() {
  const layout = useWasmachinekastStore((s) => s.layout)
  const depth = useWasmachinekastStore((s) => s.depth)
  const highSection = useWasmachinekastStore((s) => s.highSection)
  const lowSection = useWasmachinekastStore((s) => s.lowSection)
  const washerModules = useWasmachinekastStore((s) => s.washerModules)
  const buitenkantMaterialId = useWasmachinekastStore((s) => s.buitenkantMaterialId)
  const binnenkantMaterialId = useWasmachinekastStore((s) => s.binnenkantMaterialId)
  const countertopMaterialId = useWasmachinekastStore((s) => s.countertopMaterialId)
  const doorHandleId = useWasmachinekastStore((s) => s.doorHandleId)
  const needsTopCabinet = useWasmachinekastStore((s) => s.needsTopCabinet)
  const topCabinetHeight = useWasmachinekastStore((s) => s.topCabinetHeight)
  const handles = useWasmachinekastStore((s) => s.pricingData?.handles)

  const high = highSection()
  const highWashers = washerModules.filter((w) => w.section === 'high').length
  const lowWashers = washerModules.filter((w) => w.section === 'low').length

  return (
    <>
      {/* Services bar — full width, directly under configurator */}
      <ConfiguratorServicesBar />

      {/* Specifications */}
      <section className="w-full container mx-auto px-4 py-12 md:py-24">
        <div className="flex flex-col lg:flex-row gap-24">
          <div>
            <h2 className="text-xl md:text-2xl lg:text-5xl font-semibold mb-1">Jouw kast specificaties</h2>
            <p className="text-md text-muted-foreground mb-5">
              Een overzicht van jouw configuratie.
            </p>
          </div>
          <div className="flex-1 bg-white border border-border rounded-xl px-6 divide-y divide-border">
            <SpecRow label="Opstelling">{LAYOUT_LABELS[layout]}</SpecRow>
            <SpecRow label="Diepte">{depth} cm</SpecRow>
            {high && (
              <SectionSpecs
                section={high}
                prefix={lowSection ? 'Hoge kast' : 'Kast'}
                washerCount={highWashers}
              />
            )}
            {high && needsTopCabinet() && (
              <SpecRow label="Bovenkast hoogte">{Math.round(topCabinetHeight())} cm</SpecRow>
            )}
            {lowSection && (
              <SectionSpecs
                section={lowSection}
                prefix={high ? 'Lage kast' : 'Kast'}
                washerCount={lowWashers}
              />
            )}
            <SpecRow label="Materiaal buiten">
              <MaterialSwatch id={buitenkantMaterialId} />
            </SpecRow>
            <SpecRow label="Materiaal binnen">
              <MaterialSwatch id={binnenkantMaterialId} />
            </SpecRow>
            {lowSection && (
              <SpecRow label="Werkblad">
                <MaterialSwatch id={countertopMaterialId ?? buitenkantMaterialId} />
              </SpecRow>
            )}
            <SpecRow label="Handgreep">{handleLabel(doorHandleId, handles)}</SpecRow>
          </div>
        </div>
      </section>
    </>
  )
}
