'use client'

import { useEffect, useState } from 'react'
import { useClosetStore } from '../store'
import { Slider } from '@/components/ui/slider'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { cn } from '@/lib/utils'
import { maxTotalWidthCm } from '@/lib/configurator/dimensions'
import { Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { DiagonalSide } from '../scene/diagonalUtils'
import { getWidthRange, getStartHeightRange, clamp, diagAmplification } from '../diagonalConstraints'
import type { PlacementType } from '../store'

// ─── Section heading ──────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
      {children}
    </h3>
  )
}

// ─── Dimension slider row ─────────────────────────────────────────────────────

function DimensionInput({
  label,
  value,
  min,
  max,
  unit,
  onChange,
  hint,
  tooltip,
}: {
  label: string
  value: number
  min: number
  max: number
  unit: string
  onChange: (v: number) => void
  hint?: string
  tooltip?: string
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
        <span className="w-16 shrink-0 text-sm font-medium flex items-center gap-1">
          {label}
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
                    <Info className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {tooltip}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </span>
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

// ─── Diagonal detail inputs ───────────────────────────────────────────────────

function DiagNumberInput({
  label,
  value,
  min,
  max,
  onChange,
  tooltip,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
  tooltip?: string
}) {
  const [draft, setDraft] = useState(String(value))

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
      <span className="w-24 text-sm text-muted-foreground shrink-0 flex items-center gap-1">
        {label}
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Info className="size-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                {tooltip}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </span>
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

// ─── Option data ──────────────────────────────────────────────────────────────

const DIAGONAL_OPTIONS: { value: DiagonalSide; label: string }[] = [
  { value: 'none',  label: 'Geen' },
  { value: 'left',  label: 'Links' },
  { value: 'right', label: 'Rechts' },
  { value: 'both',  label: 'Beide' },
]

const PLACEMENT_OPTIONS: { value: PlacementType; label: string; hint: string }[] = [
  { value: 'ingebouwd', label: 'Ingebouwd', hint: '' },
  { value: 'vrijstaand', label: 'Vrijstaand', hint: '' },
]

// ─── Main component ───────────────────────────────────────────────────────────

export default function DimensionsStep() {
  const placementType = useClosetStore((s) => s.placementType)
  const setPlacementType = useClosetStore((s) => s.setPlacementType)

  const width  = useClosetStore((s) => s.width)
  const height = useClosetStore((s) => s.height)
  const depth  = useClosetStore((s) => s.depth)
  const setWidth  = useClosetStore((s) => s.setWidth)
  const setHeight = useClosetStore((s) => s.setHeight)
  const setDepth  = useClosetStore((s) => s.setDepth)

  const minModules  = useClosetStore((s) => s.minModules())
  const maxModules  = useClosetStore((s) => s.maxModules())
  const constraints = useClosetStore((s) => s.constraints)
  const moduleCount = useClosetStore((s) => s.moduleCount)

  const diagonalSide         = useClosetStore((s) => s.diagonalSide)
  const leftDiagStartHeight  = useClosetStore((s) => s.leftDiagStartHeight)
  const rightDiagStartHeight = useClosetStore((s) => s.rightDiagStartHeight)
  const leftDiagTopWidth     = useClosetStore((s) => s.leftDiagTopWidth)
  const rightDiagTopWidth    = useClosetStore((s) => s.rightDiagTopWidth)
  const setDiagonalSide          = useClosetStore((s) => s.setDiagonalSide)
  const setLeftDiagStartHeight   = useClosetStore((s) => s.setLeftDiagStartHeight)
  const setRightDiagStartHeight  = useClosetStore((s) => s.setRightDiagStartHeight)
  const setLeftDiagTopWidth      = useClosetStore((s) => s.setLeftDiagTopWidth)
  const setRightDiagTopWidth     = useClosetStore((s) => s.setRightDiagTopWidth)
  const mainHeight = useClosetStore((s) => s.mainHeight())

  const backDiagonal             = useClosetStore((s) => s.backDiagonal)
  const backDiagKinkHeight       = useClosetStore((s) => s.backDiagKinkHeight)
  const backDiagFlatSectionDepth = useClosetStore((s) => s.backDiagFlatSectionDepth)
  const setBackDiagonal          = useClosetStore((s) => s.setBackDiagonal)
  const setBackDiagKinkHeight    = useClosetStore((s) => s.setBackDiagKinkHeight)
  const setBackDiagFlatSectionDepth = useClosetStore((s) => s.setBackDiagFlatSectionDepth)

  const startHeightRange = getStartHeightRange(mainHeight)
  const hasLeft    = diagonalSide === 'left'  || diagonalSide === 'both'
  const hasRight   = diagonalSide === 'right' || diagonalSide === 'both'
  const hasDiagonal = diagonalSide !== 'none'

  const backDiagKinkRange = { min: 40, max: Math.floor(mainHeight - 20) }
  const backDiagFlatRange = { min: 0,  max: Math.floor(depth - 10) }

  const leftAmp  = diagAmplification(leftDiagStartHeight,  mainHeight, height)
  const rightAmp = diagAmplification(rightDiagStartHeight, mainHeight, height)
  const leftVisualWidth  = Math.round(leftDiagTopWidth  * leftAmp)
  const rightVisualWidth = Math.round(rightDiagTopWidth * rightAmp)

  const leftWidthRange  = hasLeft  ? getWidthRange('left',  width, moduleCount, diagonalSide === 'both' ? rightVisualWidth : null) : null
  const rightWidthRange = hasRight ? getWidthRange('right', width, moduleCount, diagonalSide === 'both' ? leftVisualWidth  : null) : null

  useEffect(() => {
    if (!hasLeft) return
    const rightVis = hasRight
      ? Math.round(rightDiagTopWidth * diagAmplification(rightDiagStartHeight, mainHeight, height))
      : null
    const range   = getWidthRange('left', width, moduleCount, rightVis)
    const amp     = diagAmplification(leftDiagStartHeight, mainHeight, height)
    const clamped = Math.round(clamp(leftDiagTopWidth * amp, range.min, range.max) / amp)
    if (clamped !== leftDiagTopWidth) setLeftDiagTopWidth(clamped)
  }, [width, moduleCount, rightDiagTopWidth, rightDiagStartHeight, diagonalSide]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!hasRight) return
    const leftVis = hasLeft
      ? Math.round(leftDiagTopWidth * diagAmplification(leftDiagStartHeight, mainHeight, height))
      : null
    const range   = getWidthRange('right', width, moduleCount, leftVis)
    const amp     = diagAmplification(rightDiagStartHeight, mainHeight, height)
    const clamped = Math.round(clamp(rightDiagTopWidth * amp, range.min, range.max) / amp)
    if (clamped !== rightDiagTopWidth) setRightDiagTopWidth(clamped)
  }, [width, moduleCount, leftDiagTopWidth, leftDiagStartHeight, diagonalSide]) // eslint-disable-line react-hooks/exhaustive-deps

  const sc     = constraints?.singleCorpus
  const topMax = constraints?.topCabinet.maxHeight ?? 110
  const minW   = sc?.minWidth  ?? 15
  const maxW   = maxTotalWidthCm(constraints)

  // Mutual-exclusion state
  const backDiagDisabled = hasDiagonal // Zijwand active → disable Achterwand toggle
  const zijwandDisabledValues: DiagonalSide[] =
    backDiagonal || placementType === 'vrijstaand' ? ['left', 'right', 'both'] : []

  const handleSetDiagonalSide = (side: DiagonalSide) => {
    if (side !== 'none' && backDiagonal) {
      setBackDiagonal(false)
    }
    setDiagonalSide(side)
  }

  return (
    <div className="space-y-10">

      {/* ── Section 1: Plaatsing ── */}
      <section className="space-y-5">
        {/* <SectionHeading>Plaatsing</SectionHeading> */}
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

      {/* ── Section 2: Afmetingen ── */}
      <section className="space-y-5">
        {/* <SectionHeading>Afmetingen</SectionHeading> */}

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
          tooltip="Bovenkast wordt automatisch toegevoegd bij hoogte > 275 cm"
        />
        <DimensionInput
          label="Diepte"
          value={depth}
          min={sc?.minDepth ?? 15}
          max={sc?.maxDepth ?? 90}
          unit="cm"
          onChange={setDepth}
        />

      </section>

      {/* ── Section 3: Schuine wand ── */}
      <section className="space-y-5">

        {/* Combined card */}
        <div className="bg-muted/40 rounded-lg p-4 space-y-4">

          {/* Zijwand row */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium w-24 shrink-0">Schuine wand</span>
              <SegmentedControl
                options={DIAGONAL_OPTIONS}
                value={diagonalSide}
                onChange={handleSetDiagonalSide}
                disabledValues={zijwandDisabledValues}
                className="flex-1"
              />
            </div>
            {placementType === 'vrijstaand' && (
              <p className="text-[11px] text-muted-foreground">Zijwanden schuin niet mogelijk bij vrijstaande kast.</p>
            )}
            {hasDiagonal && (
              <div className="space-y-3">
                {hasLeft && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Links</span>
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
                )}
                {hasRight && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Rechts</span>
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
                )}
              </div>
            )}
          </div>

          {/* Achterwand row */}
          <div className={cn('space-y-3 border-t pt-3 transition-opacity', backDiagDisabled && 'opacity-45')}>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium w-24 shrink-0">Schuine achterwand</span>
              <SegmentedControl
                options={[{ value: 'geen', label: 'Geen' }, { value: 'aan', label: 'Aan' }]}
                value={backDiagonal && !backDiagDisabled ? 'aan' : 'geen'}
                onChange={(v) => !backDiagDisabled && setBackDiagonal(v === 'aan')}
                className="flex-1"
              />
            </div>
            {backDiagonal && !backDiagDisabled && (
              <div className="space-y-1.5">
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
                  tooltip="Diepte van het vlakke gedeelte van de bovenste plank in de kast."
                />
              </div>
            )}
          </div>
        </div>

      </section>

    </div>
  )
}
