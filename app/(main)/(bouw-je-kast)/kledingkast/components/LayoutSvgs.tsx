/**
 * SVG representations of module layout types.
 * Used in the Modules step to visually pick an indeling.
 */

import * as React from 'react'

const SIZE = 64
const WALL = 2
const INNER_W = SIZE - WALL * 2
const INNER_H = SIZE - WALL * 2

interface SvgProps {
  className?: string
  selected?: boolean
}

function Base({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      width={SIZE}
      height={SIZE}
      className={className}
      fill="currentColor"
    >
      {/* Outer frame */}
      <rect x={0} y={0} width={SIZE} height={SIZE} rx={2} fill="none" stroke="currentColor" strokeWidth={WALL} />
      {children}
    </svg>
  )
}

/** Layout 1: Full shelves */
export function FullShelvesSvg({ className }: SvgProps) {
  const stroke = { stroke: 'currentColor', strokeWidth: 4, strokeMiterlimit: 10 }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 279" className={className}>
      <rect x="2" y="2" width="60" height="275" rx="2.15" ry="2.15" fill="none" {...stroke} />
      <g fill="none" {...stroke}>
        <line x1="2" y1="37"  x2="62" y2="37"  />
        <line x1="2" y1="67"  x2="62" y2="67"  />
        <line x1="2" y1="97"  x2="62" y2="97"  />
        <line x1="2" y1="127" x2="62" y2="127" />
        <line x1="2" y1="157" x2="62" y2="157" />
        <line x1="2" y1="187" x2="62" y2="187" />
        <line x1="2" y1="217" x2="62" y2="217" />
        <line x1="2" y1="247" x2="62" y2="247" />
      </g>
    </svg>
  )
}

/** Layout 2: Drawers + shelves — 3 drawer fronts at bottom, 2 shelves above */
export function DrawersShelfSvg({ className }: SvgProps) {
  const s = { fill: 'none', stroke: 'currentColor', strokeMiterlimit: 10, strokeWidth: 4 }
  const sRound = { ...s, strokeLinecap: 'round' as const }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 279" className={className}>
      <rect {...s} x="2" y="2" width="60" height="275" rx="2.15" ry="2.15" />
      <g>
        <line {...sRound} x1="23.86" y1="201.05" x2="40.14" y2="201.05" />
        <line {...sRound} x1="23.86" y1="231.05" x2="40.14" y2="231.05" />
        <line {...sRound} x1="23.86" y1="261.05" x2="40.14" y2="261.05" />
      </g>
      <g>
        <line {...s} x1="2" y1="37" x2="62" y2="37" />
        <line {...s} x1="2" y1="67" x2="62" y2="67" />
        <line {...s} x1="2" y1="97" x2="62" y2="97" />
        <line {...s} x1="2" y1="127" x2="62" y2="127" />
        <line {...s} x1="2" y1="157" x2="62" y2="157" />
        <line {...s} x1="2" y1="187" x2="62" y2="187" />
        <line {...s} x1="2" y1="217" x2="62" y2="217" />
        <line {...s} x1="2" y1="247" x2="62" y2="247" />
      </g>
    </svg>
  )
}

/** Layout 3: Double rod + shelves — two hanging rails at bottom, shelf at top */
export function DoubleRodShelfSvg({ className }: SvgProps) {
  const s = { fill: 'none', stroke: 'currentColor', strokeMiterlimit: 10, strokeWidth: 4 }
  const sRod = { ...s, strokeOpacity: 0.4 }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 279" className={className}>
      <g>
        <line {...sRod} x1="3.6" y1="104.5" x2="60.23" y2="104.5" />
        <line {...sRod} x1="3.6" y1="194.5" x2="60.23" y2="194.5" />
      </g>
      <rect {...s} x="2" y="2" width="60" height="275" rx="2.15" ry="2.15" />
      <line {...s} x1="2" y1="187" x2="62" y2="187" />
      <g>
        <line {...s} x1="2" y1="37" x2="62" y2="37" />
        <line {...s} x1="2" y1="67" x2="62" y2="67" />
        <line {...s} x1="2" y1="97" x2="62" y2="97" />
      </g>
    </svg>
  )
}

/** Layout 4: Split — rod on right half, shelves on left half, full shelves above */
export function SplitShelfSvg({ className }: SvgProps) {
  const s = { fill: 'none', stroke: 'currentColor', strokeMiterlimit: 10, strokeWidth: 4 }
  const sRod = { ...s, strokeOpacity: 0.4 }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 279" className={className}>
      <line {...sRod} x1="32" y1="104.5" x2="62" y2="104.5" />
      <rect {...s} x="2" y="2" width="60" height="275" rx="2.15" ry="2.15" />
      <g>
        <line {...s} x1="2" y1="127" x2="32" y2="127" />
        <line {...s} x1="2" y1="157" x2="32" y2="157" />
        <line {...s} x1="2" y1="187" x2="32" y2="187" />
        <line {...s} x1="2" y1="217" x2="32" y2="217" />
        <line {...s} x1="2" y1="247" x2="32" y2="247" />
      </g>
      <line {...s} x1="32" y1="97" x2="32" y2="277.02" />
      <g>
        <line {...s} x1="2" y1="37" x2="62" y2="37" />
        <line {...s} x1="2" y1="67" x2="62" y2="67" />
        <line {...s} x1="2" y1="97" x2="62" y2="97" />
      </g>
    </svg>
  )
}

/** Layout 5: Single rod + shelves — one hanging rail in the middle, shelves above */
export function SingleRodShelfSvg({ className }: SvgProps) {
  const s = { fill: 'none', stroke: 'currentColor', strokeMiterlimit: 10, strokeWidth: 4 }
  const sRod = { ...s, strokeOpacity: 0.4 }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 279" className={className}>
      <line {...sRod} x1="3.68" y1="134.5" x2="60.32" y2="134.5" />
      <rect {...s} x="2" y="2" width="60" height="275" rx="2.15" ry="2.15" />
      <g>
        <line {...s} x1="2" y1="37" x2="62" y2="37" />
        <line {...s} x1="2" y1="67" x2="62" y2="67" />
        <line {...s} x1="2" y1="97" x2="62" y2="97" />
        <line {...s} x1="2" y1="127" x2="62" y2="127" />
      </g>
    </svg>
  )
}

/** Layout 6: Full rod — one full-width hanging rail, shelves above and one below */
export function FullRodShelfSvg({ className }: SvgProps) {
  const s = { fill: 'none', stroke: 'currentColor', strokeMiterlimit: 10, strokeWidth: 4 }
  const sRod = { ...s, strokeOpacity: 0.4 }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 279" className={className}>
      <line {...sRod} x1="2" y1="104.5" x2="62" y2="104.5" />
      <rect {...s} x="2" y="2" width="60" height="275" rx="2.15" ry="2.15" />
      <line {...s} x1="2" y1="247" x2="62" y2="247" />
      <g>
        <line {...s} x1="3.6" y1="37" x2="63.6" y2="37" />
        <line {...s} x1="3.6" y1="67" x2="63.6" y2="67" />
        <line {...s} x1="3.6" y1="97" x2="63.6" y2="97" />
      </g>
    </svg>
  )
}




/** Map from layoutId to SVG component */
export const LAYOUT_SVGS: Record<number, React.ComponentType<SvgProps>> = {
  1: FullShelvesSvg,
  2: DrawersShelfSvg,
  3: DoubleRodShelfSvg,
  4: SplitShelfSvg,
  5: SingleRodShelfSvg,
  6: FullRodShelfSvg,
}
