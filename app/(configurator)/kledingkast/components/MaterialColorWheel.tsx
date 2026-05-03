'use client'

import { MATERIALS, type ColorMaterial, type TextureMaterial } from '../materials'

const CX = 150
const CY = 150

const OUTER_INNER_R = 100
const OUTER_OUTER_R = 140
const OUTER_SELECTED_R = 147

const INNER_INNER_R = 54
const INNER_OUTER_R = 95

const COLOR_GAP_DEG = 2

function polarToCartesian(r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) }
}

function donutSegmentPath(innerR: number, outerR: number, startAngle: number, endAngle: number) {
  const p1 = polarToCartesian(outerR, startAngle)
  const p2 = polarToCartesian(outerR, endAngle)
  const p3 = polarToCartesian(innerR, endAngle)
  const p4 = polarToCartesian(innerR, startAngle)
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  return [
    `M ${p1.x} ${p1.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${p4.x} ${p4.y}`,
    'Z',
  ].join(' ')
}

interface MaterialColorWheelProps {
  materialId: string
  onSelect: (id: string) => void
  size?: number
  hideOutsideOnly?: boolean
}

export default function MaterialColorWheel({ materialId, onSelect, size = 300, hideOutsideOnly = false }: MaterialColorWheelProps) {
  const colorMats = MATERIALS.filter((m): m is ColorMaterial => m.type === 'color' && (!hideOutsideOnly || !m.outsideOnly))
  const textureMats = MATERIALS.filter((m): m is TextureMaterial => m.type === 'texture')
  const colorSegAngle = 360 / colorMats.length

  return (
    <svg viewBox="0 0 300 300" width={size} height={size}>
      <defs>
        {textureMats.map((mat) => (
          <pattern
            key={mat.id}
            id={`mat-pat-${mat.id}`}
            patternUnits="userSpaceOnUse"
            x={CX - INNER_OUTER_R}
            y={CY - INNER_OUTER_R}
            width={INNER_OUTER_R * 2}
            height={INNER_OUTER_R * 2}
          >
            <image
              href={mat.preview}
              x="0"
              y="0"
              width={INNER_OUTER_R * 2}
              height={INNER_OUTER_R * 2}
              preserveAspectRatio="xMidYMid slice"
            />
          </pattern>
        ))}
        <mask id="inner-ring-mask">
          <circle cx={CX} cy={CY} r={INNER_OUTER_R} fill="white" />
          <circle cx={CX} cy={CY} r={INNER_INNER_R} fill="black" />
        </mask>
      </defs>

      {/* Outer ring — color segments */}
      {colorMats.map((mat, i) => {
        const startAngle = i * colorSegAngle + COLOR_GAP_DEG / 2
        const endAngle = (i + 1) * colorSegAngle - COLOR_GAP_DEG / 2
        const isSelected = materialId === mat.id
        const outerR = isSelected ? OUTER_SELECTED_R : OUTER_OUTER_R

        return (
          <path
            key={mat.id}
            d={donutSegmentPath(OUTER_INNER_R, outerR, startAngle, endAngle)}
            fill={mat.color}
            onClick={() => onSelect(mat.id)}
            className="cursor-pointer"
          />
        )
      })}

      {/* Inner ring — texture segments */}
      {textureMats.map((mat, i) => {
        const startAngle = (i / textureMats.length) * 360
        const endAngle = ((i + 1) / textureMats.length) * 360
        const isSelected = materialId === mat.id

        return (
          <g key={mat.id} onClick={() => onSelect(mat.id)} className="cursor-pointer">
            {textureMats.length === 1 ? (
              <circle
                cx={CX}
                cy={CY}
                r={INNER_OUTER_R}
                fill={`url(#mat-pat-${mat.id})`}
                mask="url(#inner-ring-mask)"
              />
            ) : (
              <path
                d={donutSegmentPath(INNER_INNER_R, INNER_OUTER_R, startAngle, endAngle)}
                fill={`url(#mat-pat-${mat.id})`}
              />
            )}
            {isSelected && (
              <>
                <circle cx={CX} cy={CY} r={INNER_OUTER_R - 2} fill="none" stroke="white" strokeWidth="3" />
                <circle cx={CX} cy={CY} r={INNER_INNER_R + 2} fill="none" stroke="white" strokeWidth="3" />
              </>
            )}
          </g>
        )
      })}
    </svg>
  )
}
