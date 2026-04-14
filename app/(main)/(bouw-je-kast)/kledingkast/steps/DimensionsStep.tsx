'use client'

import { useEffect, useState } from 'react'
import { useClosetStore } from '../store'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import type { DiagonalSide } from '../scene/diagonalUtils'
import { getWidthRange, getStartHeightRange, clamp, diagAmplification } from '../diagonalConstraints'
import type { PlacementType } from '../store'

function DimensionInput({
  label,
  value,
  min,
  max,
  unit,
  onChange,
  hint,
  labelWidth = 'w-14',
}: {
  label: string
  value: number
  min: number
  max: number
  unit: string
  onChange: (v: number) => void
  hint?: string
  labelWidth?: string
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-3">
        <span className={cn(labelWidth, 'text-sm font-medium shrink-0')}>{label}</span>
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
        <p className={cn('text-[11px] text-muted-foreground', labelWidth === 'w-14' ? 'pl-[4.25rem]' : 'pl-[5.5rem]')}>{hint}</p>
      )}
    </div>
  )
}

function DiagNumberInput({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
}) {
  const [draft, setDraft] = useState(String(value))

  // Sync draft when the committed value changes externally (e.g. auto-clamp from store)
  useEffect(() => {
    setDraft(String(value))
  }, [value])

  const parsed = Number(draft)
  const isValid = !isNaN(parsed) && parsed >= min && parsed <= max

  const commit = () => {
    const clamped = clamp(isNaN(parsed) ? value : parsed, min, max)
    setDraft(String(clamped))
    onChange(clamped)
  }

  return (
    <div className="flex items-center gap-2">
      <span className="w-24 text-sm text-muted-foreground shrink-0">{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        step={1}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
        className={cn(
          'w-20 rounded border px-2 py-1 text-sm tabular-nums text-right bg-background focus:outline-none focus:ring-1 focus:ring-ring',
          isValid ? 'border-input' : 'border-orange-400 bg-orange-50 text-orange-900',
        )}
      />
      <span className="text-sm text-muted-foreground shrink-0">cm</span>
      <span className="text-[11px] text-muted-foreground shrink-0">{min}–{max}</span>
    </div>
  )
}

const DIAGONAL_OPTIONS: { value: DiagonalSide; label: string }[] = [
  { value: 'none',  label: 'Geen' },
  { value: 'left',  label: 'Links' },
  { value: 'right', label: 'Rechts' },
  { value: 'both',  label: 'Beide' },
]

const PLACEMENT_OPTIONS: { value: PlacementType; label: string; hint: string }[] = [
  { value: 'ingebouwd', label: 'Ingebouwd', hint: 'Zij- of achterwand schuin mogelijk' },
  { value: 'vrijstaand', label: 'Vrijstaand', hint: 'Alleen achterwand schuin mogelijk' },
]

export default function DimensionsStep() {
  const placementType = useClosetStore((s) => s.placementType)
  const setPlacementType = useClosetStore((s) => s.setPlacementType)

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

  const moduleCount = useClosetStore((s) => s.moduleCount)
  const diagonalSide = useClosetStore((s) => s.diagonalSide)
  const leftDiagStartHeight = useClosetStore((s) => s.leftDiagStartHeight)
  const rightDiagStartHeight = useClosetStore((s) => s.rightDiagStartHeight)
  const leftDiagTopWidth = useClosetStore((s) => s.leftDiagTopWidth)
  const rightDiagTopWidth = useClosetStore((s) => s.rightDiagTopWidth)
  const setDiagonalSide = useClosetStore((s) => s.setDiagonalSide)
  const setLeftDiagStartHeight = useClosetStore((s) => s.setLeftDiagStartHeight)
  const setRightDiagStartHeight = useClosetStore((s) => s.setRightDiagStartHeight)
  const setLeftDiagTopWidth = useClosetStore((s) => s.setLeftDiagTopWidth)
  const setRightDiagTopWidth = useClosetStore((s) => s.setRightDiagTopWidth)
  const mainHeight = useClosetStore((s) => s.mainHeight())
  const backDiagonal             = useClosetStore((s) => s.backDiagonal)
  const backDiagKinkHeight       = useClosetStore((s) => s.backDiagKinkHeight)
  const backDiagFlatSectionDepth = useClosetStore((s) => s.backDiagFlatSectionDepth)
  const setBackDiagonal          = useClosetStore((s) => s.setBackDiagonal)
  const setBackDiagKinkHeight    = useClosetStore((s) => s.setBackDiagKinkHeight)
  const setBackDiagFlatSectionDepth = useClosetStore((s) => s.setBackDiagFlatSectionDepth)

  const startHeightRange = getStartHeightRange(mainHeight)
  const hasLeft  = diagonalSide === 'left'  || diagonalSide === 'both'
  const hasRight = diagonalSide === 'right' || diagonalSide === 'both'
  const hasDiagonal = diagonalSide !== 'none'
  const backDiagKinkRange = { min: 40, max: Math.floor(mainHeight - 20) }
  const backDiagFlatRange = { min: 0, max: Math.floor(depth - 10) }

  // Amplification: how much the diagonal's reach is multiplied from mainH to full closet height.
  // For non-TC closets this is ~1. For TC closets (height > 275cm) this can be 4-5×.
  const leftAmp  = diagAmplification(leftDiagStartHeight,  mainHeight, height)
  const rightAmp = diagAmplification(rightDiagStartHeight, mainHeight, height)

  // Visual widths: what the user sees in the 3D view (reach at full closet height)
  const leftVisualWidth  = Math.round(leftDiagTopWidth  * leftAmp)
  const rightVisualWidth = Math.round(rightDiagTopWidth * rightAmp)

  // Constraint ranges in visual space
  const leftWidthRange  = hasLeft  ? getWidthRange('left',  width, moduleCount, diagonalSide === 'both' ? rightVisualWidth : null) : null
  const rightWidthRange = hasRight ? getWidthRange('right', width, moduleCount, diagonalSide === 'both' ? leftVisualWidth  : null) : null

  // Auto-clamp when closetWidth, moduleCount, or the other side changes (all in visual space)
  useEffect(() => {
    if (!hasLeft) return
    const rightVis = hasRight
      ? Math.round(rightDiagTopWidth * diagAmplification(rightDiagStartHeight, mainHeight, height))
      : null
    const range = getWidthRange('left', width, moduleCount, rightVis)
    const amp   = diagAmplification(leftDiagStartHeight, mainHeight, height)
    const clamped = Math.round(clamp(leftDiagTopWidth * amp, range.min, range.max) / amp)
    if (clamped !== leftDiagTopWidth) setLeftDiagTopWidth(clamped)
  }, [width, moduleCount, rightDiagTopWidth, rightDiagStartHeight, diagonalSide]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!hasRight) return
    const leftVis = hasLeft
      ? Math.round(leftDiagTopWidth * diagAmplification(leftDiagStartHeight, mainHeight, height))
      : null
    const range = getWidthRange('right', width, moduleCount, leftVis)
    const amp   = diagAmplification(rightDiagStartHeight, mainHeight, height)
    const clamped = Math.round(clamp(rightDiagTopWidth * amp, range.min, range.max) / amp)
    if (clamped !== rightDiagTopWidth) setRightDiagTopWidth(clamped)
  }, [width, moduleCount, leftDiagTopWidth, leftDiagStartHeight, diagonalSide]) // eslint-disable-line react-hooks/exhaustive-deps

  const sc = constraints?.singleCorpus
  const topMax = constraints?.topCabinet.maxHeight ?? 110
  const minW = sc?.minWidth ?? 15
  const maxW = (sc?.maxWidth ?? 65) * 8

  return (
    <div className="space-y-6">
      {/* Placement type selector */}
      <div className="space-y-2">
        <span className="text-sm font-medium">Plaatsing</span>
        <div className="grid grid-cols-2 gap-2">
          {PLACEMENT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPlacementType(opt.value)}
              className={cn(
                'flex flex-col items-start gap-0.5 rounded-md border px-3 py-2.5 text-left transition-colors',
                placementType === opt.value
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border bg-background text-foreground hover:bg-muted',
              )}
            >
              <span className="text-sm font-medium">{opt.label}</span>
              <span className={cn('text-[11px]', placementType === opt.value ? 'text-background/70' : 'text-muted-foreground')}>
                {opt.hint}
              </span>
            </button>
          ))}
        </div>
      </div>

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
          {DIAGONAL_OPTIONS.map((opt) => {
            const isSide = opt.value !== 'none'
            const disabled = isSide && placementType === 'vrijstaand'
            return (
              <button
                key={opt.value}
                onClick={() => !disabled && setDiagonalSide(opt.value)}
                disabled={disabled}
                title={disabled ? 'Zijwanden schuin niet mogelijk bij vrijstaande kast' : undefined}
                className={cn(
                  'flex-1 py-1.5 text-sm transition-colors',
                  disabled
                    ? 'bg-background text-muted-foreground/40 cursor-not-allowed'
                    : diagonalSide === opt.value
                      ? 'bg-foreground text-background font-medium'
                      : 'bg-background text-muted-foreground hover:bg-muted',
                )}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
        {placementType === 'vrijstaand' && (
          <p className="text-[11px] text-muted-foreground">Zijwanden schuin niet mogelijk bij vrijstaande kast.</p>
        )}

        {hasDiagonal && (
          <div className="space-y-4 pl-1">
            {hasLeft && (
              <div className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Links</span>
                <div className="space-y-2 pl-1">
                  <DiagNumberInput
                    label="Starthoogte"
                    value={leftDiagStartHeight}
                    min={startHeightRange.min}
                    max={startHeightRange.max}
                    onChange={setLeftDiagStartHeight}
                  />
                  {leftWidthRange && (
                    <DiagNumberInput
                      label="Breedte"
                      value={leftVisualWidth}
                      min={leftWidthRange.min}
                      max={leftWidthRange.max}
                      onChange={(vis) => setLeftDiagTopWidth(Math.round(vis / leftAmp))}
                    />
                  )}
                </div>
              </div>
            )}
            {hasRight && (
              <div className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Rechts</span>
                <div className="space-y-2 pl-1">
                  <DiagNumberInput
                    label="Starthoogte"
                    value={rightDiagStartHeight}
                    min={startHeightRange.min}
                    max={startHeightRange.max}
                    onChange={setRightDiagStartHeight}
                  />
                  {rightWidthRange && (
                    <DiagNumberInput
                      label="Breedte"
                      value={rightVisualWidth}
                      min={rightWidthRange.min}
                      max={rightWidthRange.max}
                      onChange={(vis) => setRightDiagTopWidth(Math.round(vis / rightAmp))}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Back diagonal section */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium flex-1">Achterdiagonaal</span>
          <div className="flex rounded-md border overflow-hidden">
            <button
              onClick={() => setBackDiagonal(true)}
              className={cn(
                'flex-1 px-3 py-1.5 text-sm transition-colors',
                backDiagonal
                  ? 'bg-foreground text-background font-medium'
                  : 'bg-background text-muted-foreground hover:bg-muted',
              )}
            >
              Aan
            </button>
            <button
              onClick={() => setBackDiagonal(false)}
              className={cn(
                'flex-1 px-3 py-1.5 text-sm transition-colors',
                !backDiagonal
                  ? 'bg-foreground text-background font-medium'
                  : 'bg-background text-muted-foreground hover:bg-muted',
              )}
            >
              Uit
            </button>
          </div>
        </div>

        {backDiagonal && (
          <div className="space-y-2 pl-1">
            <DiagNumberInput
              label="Knikhoogte"
              value={backDiagKinkHeight}
              min={backDiagKinkRange.min}
              max={backDiagKinkRange.max}
              onChange={setBackDiagKinkHeight}
            />
            <DiagNumberInput
              label="Vlak deel"
              value={backDiagFlatSectionDepth}
              min={backDiagFlatRange.min}
              max={backDiagFlatRange.max}
              onChange={setBackDiagFlatSectionDepth}
            />
          </div>
        )}
      </div>
    </div>
  )
}
