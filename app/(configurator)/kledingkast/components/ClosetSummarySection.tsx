'use client'

import { Ruler, Wrench } from 'lucide-react'
import { useClosetStore } from '../store'
import { MATERIALS } from '../materials'
import { HANDLE_TYPES } from '../../_shared/objects/Handles'

function ServiceItem({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="text-primary mt-0.5">{icon}</div>
      <div>
        <p className="font-semibold text-sm text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
  )
}

// ─── Spec row ─────────────────────────────────────────────────────────────────

function SpecRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3.5 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground shrink-0 w-40">{label}</span>
      <span className="text-sm text-foreground text-right">{children}</span>
    </div>
  )
}

function MaterialSwatch({ id }: { id: string }) {
  const material = MATERIALS.find((m) => m.id === id)
  if (!material) return <span className="text-sm text-foreground">{id}</span>

  return (
    <span className="inline-flex items-center gap-2">
      {material.type === 'color' ? (
        <span
          className="inline-block w-4 h-4 rounded-full border border-border shrink-0"
          style={{ backgroundColor: material.color }}
        />
      ) : (
        <img
          src={material.preview}
          alt={material.name}
          className="w-4 h-4 rounded-full object-cover border border-border shrink-0"
        />
      )}
      {material.name}
    </span>
  )
}

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

export default function ClosetSummarySection() {
  const width = useClosetStore((s) => s.width)
  const height = useClosetStore((s) => s.height)
  const depth = useClosetStore((s) => s.depth)
  const buitenkantMaterialId = useClosetStore((s) => s.buitenkantMaterialId)
  const binnenkantMaterialId = useClosetStore((s) => s.binnenkantMaterialId)
  const doorHandleId = useClosetStore((s) => s.doorHandleId)
  const needsTopCabinet = useClosetStore((s) => s.needsTopCabinet)
  const topCabinetHeight = useClosetStore((s) => s.topCabinetHeight)

  const handleLabel =
    doorHandleId === 'none'
      ? 'Geen (push-to-open)'
      : HANDLE_TYPES.find((h) => h.id === doorHandleId)?.name ?? doorHandleId

  return (
    <>
      {/* Services bar — full width, directly under configurator */}
      <div className="w-full bg-primary-200 px-8 py-12 flex justify-between flex-col sm:flex-row gap-12">
        <ServiceItem
          icon={<Ruler size={28} className="shrink-0" />}
          title="Optionele Inmeetservice"
          description="Wij meten jouw ruimte professioneel op."
        />
        <div className="hidden sm:block w-px bg-primary" />
        <ServiceItem
          icon={<Wrench size={28} className="shrink-0" />}
          title="Optionele Montageservice"
          description="Wij monteren de kast bij jou thuis."
        />
        <div className="hidden sm:block w-px bg-primary" />
        <ServiceItem
          icon={<Ruler size={28} className="shrink-0" />}
          title="Optionele Inmeetservice"
          description="Wij meten jouw ruimte professioneel op."
        />
        <div className="hidden sm:block w-px bg-primary" />
        <ServiceItem
          icon={<Wrench size={28} className="shrink-0" />}
          title="Optionele Montageservice"
          description="Wij monteren de kast bij jou thuis."
        />
      </div>

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
