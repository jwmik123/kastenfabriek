/**
 * Line drawings for the PAX door types shown under "Type" on the product page.
 *
 *   deuren       → cabinet with the front face highlighted
 *   hoekdeuren   → 4-part folding panel with the two corner panels highlighted
 *   afwerkpaneel → "Zijpaneel": cabinet with the side face highlighted
 *
 * Strokes follow currentColor so the drawing inverts with the active pill;
 * the highlighted face is the same colour at low opacity.
 */

import * as React from 'react'

import type { PaxDoorType } from '@/sanity/lib/products'

interface SvgProps {
  className?: string
}

const line = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 6,
  strokeLinejoin: 'miter' as const,
  strokeLinecap: 'square' as const,
}

/** Filled face — same colour as the strokes, dialled down. */
const fill = { fill: 'currentColor', fillOpacity: 0.22 }

/** Deuren — cabinet in 3/4 view, front face highlighted. */
export function PaxDeurenSvg({ className }: SvgProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 560" className={className}>
      <g {...line}>
        {/* rechter zijvlak */}
        <polygon points="260,89 297,69 297,449 260,469" />
        {/* bovenvlak */}
        <polygon points="151,89 260,89 297,69 188,69" />
        {/* voorvlak (gemarkeerd) */}
        <rect x="151" y="89" width="109" height="380" {...fill} />
        {/* voorste hoekrib */}
        <line x1="260" y1="89" x2="260" y2="469" strokeWidth={12} />
      </g>
    </svg>
  )
}

/** Hoekdeuren — 4-part folding panel, the two middle panels highlighted. */
export function PaxHoekdeurenSvg({ className }: SvgProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 560" className={className}>
      <g {...line}>
        {/* paneel 1 */}
        <polygon points="43,58 153,50 153,489 43,469" />
        {/* paneel 2 (gemarkeerd) */}
        <polygon points="153,50 233,62 233,452 153,489" {...fill} />
        {/* paneel 3 (gemarkeerd) */}
        <polygon points="233,62 332,56 332,475 233,452" {...fill} />
        {/* paneel 4 */}
        <polygon points="332,56 387,66 387,452 332,475" />
        {/* vouwribben */}
        <line x1="153" y1="50" x2="153" y2="489" strokeWidth={12} />
        <line x1="233" y1="62" x2="233" y2="452" strokeWidth={12} />
        <line x1="332" y1="56" x2="332" y2="475" strokeWidth={12} />
      </g>
    </svg>
  )
}

/** Afwerkpaneel — cabinet in 3/4 view, side face highlighted. */
export function PaxAfwerkpaneelSvg({ className }: SvgProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 560" className={className}>
      <g {...line}>
        {/* rechter zijvlak (gemarkeerd) */}
        <polygon points="260,89 297,69 297,449 260,469" {...fill} />
        {/* bovenvlak */}
        <polygon points="151,89 260,89 297,69 188,69" />
        {/* voorvlak */}
        <rect x="151" y="89" width="109" height="380" />
        {/* voorste hoekrib */}
        <line x1="260" y1="89" x2="260" y2="469" strokeWidth={12} />
      </g>
    </svg>
  )
}

export const PAX_TYPE_SVGS: Record<PaxDoorType, React.ComponentType<SvgProps>> = {
  deuren: PaxDeurenSvg,
  hoekdeuren: PaxHoekdeurenSvg,
  afwerkpaneel: PaxAfwerkpaneelSvg,
}
