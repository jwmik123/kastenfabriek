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

/* ------------------------------------------------------------------ */
/* Low-cabinet versions of the shared layouts                          */
/*                                                                     */
/* Layouts 1 (planken) and 2 (lades) are offered in both sections, but */
/* the kledingkast drawings are full-height silhouettes — wrong shape  */
/* for a 90 cm cabinet even though the module is the same. These are   */
/* the same layouts drawn in the low cabinet's square proportions.     */
/* ------------------------------------------------------------------ */

/** Planken — one shelf splitting the low cabinet in two. */
export function LowShelvesSvg({ className }: SvgProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className={className}>
      <rect {...frame} x="2" y="2" width="60" height="60" rx="2.15" ry="2.15" />
      <line {...frame} x1="2" y1="32" x2="62" y2="32" />
    </svg>
  )
}

/** Lades — three drawers stacked in the low cabinet. */
export function LowDrawersSvg({ className }: SvgProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className={className}>
      <rect {...frame} x="2" y="2" width="60" height="60" rx="2.15" ry="2.15" />
      <line {...frame} x1="2" y1="22" x2="62" y2="22" />
      <line {...frame} x1="2" y1="42" x2="62" y2="42" />
      <Handle y={12} />
      <Handle y={32} />
      <Handle y={52} />
    </svg>
  )
}

/** Low-section drawing for a layout that both sections share. */
export const LOW_LAYOUT_SVGS: Record<number, React.ComponentType<SvgProps>> = {
  1: LowShelvesSvg, // planken
  2: LowDrawersSvg, // lades
}

/* ------------------------------------------------------------------ */
/* Type-picker drawings (step 3)                                       */
/*                                                                     */
/* Tall front-view drawings of the whole cabinet: the circle is the    */
/* washer drum, the lines below are the vakken. Used for the washer    */
/* options in the indeling picker — the small square icons above stay  */
/* in place for the compact low-cabinet layouts.                       */
/* ------------------------------------------------------------------ */

const typeFrame = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 4,
  strokeLinejoin: 'miter' as const,
  strokeLinecap: 'butt' as const,
}

/** Cabinet outline + washer drum, shared by all three type drawings. */
function TypeShell({ className, children }: SvgProps & { children: React.ReactNode }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 320" className={className}>
      <g {...typeFrame}>
        <rect x="15" y="13" width="100" height="294" />
        <line x1="15" y1="77" x2="115" y2="77" />
        <line x1="15" y1="213" x2="115" y2="213" />
        <circle cx="65" cy="145" r="40" />
        {children}
      </g>
    </svg>
  )
}

/** Enkel — washer with one vak below (vooraanzicht-cirkel-1streep) */
export function WasherEnkelTypeSvg({ className }: SvgProps) {
  return (
    <TypeShell className={className}>
      <line x1="52" y1="272" x2="78" y2="272" />
    </TypeShell>
  )
}

/** Dubbel — washer with two vakken below (vooraanzicht-cirkel-2strepen) */
export function WasherDubbelTypeSvg({ className }: SvgProps) {
  return (
    <TypeShell className={className}>
      <line x1="15" y1="261" x2="115" y2="261" />
      <line x1="52" y1="242" x2="78" y2="242" />
      <line x1="52" y1="290" x2="78" y2="290" />
    </TypeShell>
  )
}

/** Plank — washer with a shallow plank vak plus a vak below
 *  (vooraanzicht-cirkel-1streep-2vakken) */
export function WasherPlankTypeSvg({ className }: SvgProps) {
  return (
    <TypeShell className={className}>
      <line x1="15" y1="251" x2="115" y2="251" />
      <line x1="52" y1="237" x2="78" y2="237" />
    </TypeShell>
  )
}

/** Losse machine — a free-standing machine in an open low bay, so just the
 *  machine front: a square with the drum in it. */
export function WasherLosseMachineTypeSvg({ className }: SvgProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 130" className={className}>
      <g {...typeFrame}>
        <rect x="15" y="15" width="100" height="100" />
        <circle cx="65" cy="65" r="32" />
      </g>
    </svg>
  )
}

/** Map layoutId to its large front drawing for the washer picker. Ids without
 *  an entry fall back to the compact WASHER_LAYOUT_SVGS icon. */
export const WASHER_TYPE_SVGS: Record<number, React.ComponentType<SvgProps>> = {
  11: WasherEnkelTypeSvg, // Wasmachine (enkel)
  13: WasherDubbelTypeSvg, // Wasmachine (dubbel model)
  14: WasherPlankTypeSvg, // Wasmachine met plank
  23: WasherLosseMachineTypeSvg, // Wasmachine (lage kast) — losse machine
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
