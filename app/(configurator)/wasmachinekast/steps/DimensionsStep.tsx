'use client'

import { useEffect, useState } from 'react'
import { useWasmachinekastStore, type PlacementType } from '../store'
import { Slider } from '@/components/ui/slider'
import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

function DimensionInput({
  label,
  value,
  min,
  max,
  unit,
  onChange,
  hint,
}: {
  label: string
  value: number
  min: number
  max: number
  unit: string
  onChange: (v: number) => void
  hint?: string
}) {
  const [draft, setDraft] = useState(String(value))

  useEffect(() => {
    setDraft(String(value))
  }, [value])

  const commit = () => {
    const parsed = Number(draft)
    const clamped = clamp(isNaN(parsed) ? value : parsed, min, max)
    setDraft(String(clamped))
    onChange(clamped)
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-3">
        <span className="w-16 shrink-0 text-sm font-medium">{label}</span>
        <Slider
          min={min}
          max={max}
          step={1}
          value={[value]}
          onValueChange={([v]) => onChange(v)}
          className="flex-1"
        />
        <div className="flex items-center gap-1 shrink-0">
          <input
            type="number"
            min={min}
            max={max}
            step={1}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
            className="w-18 rounded border border-input px-2 py-1 text-sm tabular-nums text-right bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <span className="text-xs text-muted-foreground">{unit}</span>
        </div>
      </div>
      {hint && <p className="text-[11px] text-muted-foreground pl-[4.75rem]">{hint}</p>}
    </div>
  )
}

const PLACEMENT_OPTIONS: { value: PlacementType; label: string; hint: string }[] = [
  { value: 'ingebouwd', label: 'Ingebouwd', hint: 'Kast staat tussen twee muren' },
  { value: 'vrijstaand', label: 'Vrijstaand', hint: 'Kast staat los in de ruimte' },
]

function ThicknessToggle({ value, onChange }: { value: 18 | 36; onChange: (v: 18 | 36) => void }) {
  return (
    <div className="flex rounded-md border border-border overflow-hidden text-sm font-medium">
      {[18, 36].map((t) => (
        <button
          key={t}
          onClick={() => onChange(t as 18 | 36)}
          className={cn(
            'flex-1 py-2 transition-colors',
            value === t
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-muted',
          )}
        >
          {t}mm
        </button>
      ))}
    </div>
  )
}

export default function DimensionsStep() {
  const placementType = useWasmachinekastStore((s) => s.placementType)
  const setPlacementType = useWasmachinekastStore((s) => s.setPlacementType)
  const width = useWasmachinekastStore((s) => s.width)
  const height = useWasmachinekastStore((s) => s.height)
  const depth = useWasmachinekastStore((s) => s.depth)
  const setWidth = useWasmachinekastStore((s) => s.setWidth)
  const setHeight = useWasmachinekastStore((s) => s.setHeight)
  const setDepth = useWasmachinekastStore((s) => s.setDepth)
  const constraints = useWasmachinekastStore((s) => s.constraints)
  const minModules = useWasmachinekastStore((s) => s.minModules())
  const maxModules = useWasmachinekastStore((s) => s.maxModules())
  const layout = useWasmachinekastStore((s) => s.layout)
  const topPanelThicknessMm = useWasmachinekastStore((s) => s.topPanelThicknessMm)
  const setLowTopPanelThicknessMm = useWasmachinekastStore((s) => s.setLowTopPanelThicknessMm)
  const moduleCount = useWasmachinekastStore((s) => s.moduleCount)
  const setModuleCount = useWasmachinekastStore((s) => s.setModuleCount)
  const lowSection = useWasmachinekastStore((s) => s.lowSection)
  const setLowSectionWidth = useWasmachinekastStore((s) => s.setLowSectionWidth)
  const setLowSectionModuleCount = useWasmachinekastStore((s) => s.setLowSectionModuleCount)

  const sc = constraints?.singleCorpus
  const topMax = constraints?.topCabinet.maxHeight ?? 110
  const minW = sc?.minWidth ?? 15
  const maxW = (sc?.maxWidth ?? 65) * 8
  const minDepth = Math.max(85, sc?.minDepth ?? 85)
  const isLowOnly = layout === 'low-only'
  const isDual = layout === 'low-left' || layout === 'low-right'

  const lowMinModules = lowSection
    ? Math.max(1, Math.ceil(lowSection.width / (sc?.maxWidth ?? 65)))
    : 1
  const lowMaxModules = lowSection ? Math.floor(lowSection.width / minW) : 1

  return (
    <div className="space-y-10">
      <section className="space-y-5">
        <div className="grid grid-cols-2 gap-2">
          {PLACEMENT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPlacementType(opt.value)}
              className={cn(
                'flex flex-col items-start gap-0.5 rounded-md border px-3 py-2.5 text-left transition-colors',
                placementType === opt.value
                  ? 'border-foreground bg-primary text-primary-foreground'
                  : 'border-border bg-background text-foreground hover:bg-muted',
              )}
            >
              <span className="text-sm font-medium">{opt.label}</span>
              <span className={cn('text-[11px]', placementType === opt.value ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                {opt.hint}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <DimensionInput
          label="Diepte"
          value={depth}
          min={minDepth}
          max={sc?.maxDepth ?? 90}
          unit="cm"
          onChange={setDepth}
          hint="Minimaal 85 cm voor wasmachine"
        />

        {isLowOnly && (
          <div className="space-y-5 rounded-md border border-border/60 p-3">
            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Lage kast
            </h3>
            <DimensionInput
              label="Breedte"
              value={width}
              min={minW}
              max={maxW}
              unit="cm"
              onChange={setWidth}
              hint={`${minModules}–${maxModules} modules`}
            />
            <DimensionInput
              label="Modules"
              value={moduleCount}
              min={minModules}
              max={maxModules}
              unit=""
              onChange={setModuleCount}
              hint="Hoogte vast op 90 cm"
            />
            <div className="space-y-2">
              <span className="text-sm font-medium">Werkblad dikte</span>
              <ThicknessToggle value={topPanelThicknessMm} onChange={setLowTopPanelThicknessMm} />
            </div>
          </div>
        )}

        {!isLowOnly && (
          <div className="space-y-5 rounded-md border border-border/60 p-3">
            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Hoge kast
            </h3>
            <DimensionInput
              label="Breedte"
              value={width}
              min={minW}
              max={maxW}
              unit="cm"
              onChange={setWidth}
              hint={`${minModules}–${maxModules} modules`}
            />
            <DimensionInput
              label="Hoogte"
              value={height}
              min={sc?.minHeight ?? 200}
              max={(sc?.maxHeight ?? 275) + topMax}
              unit="cm"
              onChange={setHeight}
            />
            <DimensionInput
              label="Modules"
              value={moduleCount}
              min={minModules}
              max={maxModules}
              unit=""
              onChange={setModuleCount}
            />
            <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 px-3 py-2.5 rounded-md">
              <Info className="size-4 shrink-0 mt-0.5" />
              <span className="text-xs">Bovenkast wordt automatisch toegevoegd bij hoogte &gt; 275 cm</span>
            </div>
          </div>
        )}

        {isDual && lowSection && (
          <div className="space-y-5 rounded-md border border-border/60 p-3">
            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Lage kast
            </h3>
            <DimensionInput
              label="Breedte"
              value={lowSection.width}
              min={minW}
              max={maxW}
              unit="cm"
              onChange={setLowSectionWidth}
              hint={`${lowMinModules}–${lowMaxModules} modules`}
            />
            <DimensionInput
              label="Modules"
              value={lowSection.moduleCount}
              min={lowMinModules}
              max={lowMaxModules}
              unit=""
              onChange={setLowSectionModuleCount}
              hint="Hoogte vast op 90 cm"
            />
            <div className="space-y-2">
              <span className="text-sm font-medium">Werkblad dikte</span>
              <ThicknessToggle value={topPanelThicknessMm} onChange={setLowTopPanelThicknessMm} />
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
