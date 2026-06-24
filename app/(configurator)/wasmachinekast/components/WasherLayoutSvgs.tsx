/**
 * SVG representations of the washer module layout types.
 * Shared between the high- and low-cabinet washer modules (step 3).
 *
 *   enkel  → 1 big drawer
 *   dubbel → 2 big drawers
 *   plank  → 1 tiny (desk) drawer with a big drawer below
 *
 * Same visual language as ../kledingkast/components/LayoutSvgs.tsx:
 * currentColor strokes, rounded outer frame, round-capped drawer handles.
 */

import * as React from 'react'

interface SvgProps {
  className?: string
}

const frame = { fill: 'none', stroke: 'currentColor', strokeMiterlimit: 10, strokeWidth: 4 }
const handle = { ...frame, strokeLinecap: 'round' as const }

/** Centered drawer handle line at vertical position `y`. */
function Handle({ y }: { y: number }) {
  return <line {...handle} x1={23} y1={y} x2={41} y2={y} />
}

/** Enkel — 1 big drawer */
export function WasherEnkelSvg({ className }: SvgProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className={className}>
      <rect {...frame} x="2" y="2" width="60" height="60" rx="2.15" ry="2.15" />
      <Handle y={32} />
    </svg>
  )
}

/** Dubbel model — 2 big drawers */
export function WasherDubbelSvg({ className }: SvgProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className={className}>
      <rect {...frame} x="2" y="2" width="60" height="60" rx="2.15" ry="2.15" />
      <line {...frame} x1="2" y1="32" x2="62" y2="32" />
      <Handle y={17} />
      <Handle y={47} />
    </svg>
  )
}

/** Wasmachine met plank — 1 tiny desk drawer with a big drawer below */
export function WasherPlankSvg({ className }: SvgProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className={className}>
      <rect {...frame} x="2" y="2" width="60" height="60" rx="2.15" ry="2.15" />
      <line {...frame} x1="2" y1="18" x2="62" y2="18" />
      <Handle y={10} />
      <Handle y={40} />
    </svg>
  )
}

/** Map every washer/low-module layoutId to its SVG (high + low share the 3 shapes). */
export const WASHER_LAYOUT_SVGS: Record<number, React.ComponentType<SvgProps>> = {
  // high cabinet
  11: WasherEnkelSvg, // Wasmachine (enkel)
  13: WasherDubbelSvg, // Wasmachine (dubbel model)
  14: WasherPlankSvg, // Wasmachine met plank
  // low cabinet
  23: WasherEnkelSvg, // Wasmachine (lage kast) — single open vak
  21: WasherEnkelSvg, // Lage kast — enkel vak
  22: WasherDubbelSvg, // Lage kast — dubbel vak
  20: WasherPlankSvg, // Lage kast — plank
}
