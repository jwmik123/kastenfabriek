'use client'

import { useClosetStore } from '../store'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'

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
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-3">
        <span className="w-14 text-sm font-medium shrink-0">{label}</span>
        <Slider
          min={min}
          max={max}
          step={1}
          value={[value]}
          onValueChange={([v]) => onChange(v)}
          className="flex-1"
        />
        <span className="w-16 text-right text-sm tabular-nums text-muted-foreground shrink-0">
          {value} {unit}
        </span>
      </div>
      {hint && (
        <p className="pl-[4.25rem] text-[11px] text-muted-foreground">{hint}</p>
      )}
    </div>
  )
}

export default function DimensionsStep() {
  const width = useClosetStore((s) => s.width)
  const height = useClosetStore((s) => s.height)
  const depth = useClosetStore((s) => s.depth)
  const setWidth = useClosetStore((s) => s.setWidth)
  const setHeight = useClosetStore((s) => s.setHeight)
  const setDepth = useClosetStore((s) => s.setDepth)
  const needsTopCabinet = useClosetStore((s) => s.needsTopCabinet())
  const minModules = useClosetStore((s) => s.minModules())
  const maxModules = useClosetStore((s) => s.maxModules())
  const constraints = useClosetStore((s) => s.constraints)

  const sc = constraints?.singleCorpus
  const topMax = constraints?.topCabinet.maxHeight ?? 110
  const minW = sc?.minWidth ?? 15
  const maxW = (sc?.maxWidth ?? 65) * 8

  return (
    <div className="space-y-6">
      <div className="space-y-3">
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
          label="Diepte"
          value={depth}
          min={sc?.minDepth ?? 15}
          max={sc?.maxDepth ?? 90}
          unit="cm"
          onChange={setDepth}
        />
      </div>

      {needsTopCabinet && (
        <div className={cn(
          'p-3 rounded-md text-sm border',
          'bg-amber-50 border-amber-200 text-amber-800',
        )}>
          Bovenkast wordt automatisch toegevoegd (hoogte &gt; 275 cm).
        </div>
      )}
    </div>
  )
}
