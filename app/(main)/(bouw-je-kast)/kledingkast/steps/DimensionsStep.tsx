'use client'

import { useClosetStore } from '../store'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import type { DiagonalSide } from '../scene/diagonalUtils'

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

function NumberInput({
  label,
  value,
  min,
  max,
  unit,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  unit: string
  onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-36 text-sm shrink-0">{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => {
          const v = parseInt(e.target.value, 10)
          if (!isNaN(v)) onChange(v)
        }}
        onBlur={(e) => {
          const v = parseInt(e.target.value, 10)
          if (!isNaN(v)) onChange(Math.max(min, Math.min(max, v)))
        }}
        className="w-20 rounded-md border bg-background px-2 py-1 text-sm text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <span className="text-sm text-muted-foreground">{unit}</span>
    </div>
  )
}

const DIAGONAL_OPTIONS: { value: DiagonalSide; label: string }[] = [
  { value: 'none',  label: 'Geen' },
  { value: 'left',  label: 'Links' },
  { value: 'right', label: 'Rechts' },
  { value: 'both',  label: 'Beide' },
]

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

  const diagonalSide = useClosetStore((s) => s.diagonalSide)
  const leftDiagStartHeight = useClosetStore((s) => s.leftDiagStartHeight)
  const rightDiagStartHeight = useClosetStore((s) => s.rightDiagStartHeight)
  const diagTopWidth = useClosetStore((s) => s.diagTopWidth)
  const setDiagonalSide = useClosetStore((s) => s.setDiagonalSide)
  const setLeftDiagStartHeight = useClosetStore((s) => s.setLeftDiagStartHeight)
  const setRightDiagStartHeight = useClosetStore((s) => s.setRightDiagStartHeight)
  const setDiagTopWidth = useClosetStore((s) => s.setDiagTopWidth)
  const mainHeight = useClosetStore((s) => s.mainHeight())

  const sc = constraints?.singleCorpus
  const topMax = constraints?.topCabinet.maxHeight ?? 110
  const minW = sc?.minWidth ?? 15
  const maxW = (sc?.maxWidth ?? 65) * 8

  const hasLeft = diagonalSide === 'left' || diagonalSide === 'both'
  const hasRight = diagonalSide === 'right' || diagonalSide === 'both'
  const hasDiagonal = diagonalSide !== 'none'

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

      {/* Diagonal wall section */}
      <div className="space-y-3">
        <span className="text-sm font-medium">Schuine wand</span>

        {/* Segmented control */}
        <div className="flex rounded-md border overflow-hidden">
          {DIAGONAL_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDiagonalSide(opt.value)}
              className={cn(
                'flex-1 py-1.5 text-sm transition-colors',
                diagonalSide === opt.value
                  ? 'bg-foreground text-background font-medium'
                  : 'bg-background text-muted-foreground hover:bg-muted',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {hasDiagonal && (
          <div className="space-y-2 pl-1">
            {hasLeft && (
              <NumberInput
                label="Hoogte begin schuin links"
                value={leftDiagStartHeight}
                min={100}
                max={Math.floor(mainHeight - 20)}
                unit="cm"
                onChange={setLeftDiagStartHeight}
              />
            )}
            {hasRight && (
              <NumberInput
                label="Hoogte begin schuin rechts"
                value={rightDiagStartHeight}
                min={100}
                max={Math.floor(mainHeight - 20)}
                unit="cm"
                onChange={setRightDiagStartHeight}
              />
            )}
            <NumberInput
              label="Breedte schuin bovenkant"
              value={diagTopWidth}
              min={10}
              max={Math.floor(width / 2 - 5)}
              unit="cm"
              onChange={setDiagTopWidth}
            />
          </div>
        )}
      </div>
    </div>
  )
}
