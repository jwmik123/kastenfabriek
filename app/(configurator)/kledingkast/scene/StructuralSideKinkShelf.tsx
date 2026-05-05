'use client'

import { useClosetStore } from '../store'
import ClosetMaterial, { ModuleMaterialOverrideProvider } from '../../_shared/materials/ClosetMaterial'
import { SHELF_THICKNESS } from './moduleLayouts'
import { getDiagHeightAt } from './diagonalUtils'
import type { DiagParams } from './diagonalUtils'

const WALL = 0.018
const CLOSET_INSIDE_INSET = 0.025
const MODULE_INSIDE_INSET = 0.010

interface StructuralSideKinkShelfProps {
  isStructural: true
  slotIndex: number
  span: 1 | 2
  side: 'left' | 'right'
  diagParams: DiagParams
  hasDoor: boolean
  buitenkantMaterialId?: string
  binnenkantMaterialId?: string
}

/**
 * Structural shelf at leftDiagStartHeight / rightDiagStartHeight, auto-inserted per module
 * when a side diagonal is active and the module is fully inside the diagonal zone.
 * Mirrors StructuralKinkShelf which does the same for backDiagonal.
 */
export default function StructuralSideKinkShelf({
  slotIndex,
  span,
  side,
  diagParams,
  hasDoor,
  buitenkantMaterialId,
  binnenkantMaterialId,
}: StructuralSideKinkShelfProps) {
  const width       = useClosetStore((s) => s.width) / 100
  const depth       = useClosetStore((s) => s.depth) / 100
  const moduleCount = useClosetStore((s) => s.moduleCount)

  const { diagonalSide, mainHeight } = diagParams

  if (diagonalSide !== side && diagonalSide !== 'both') return null

  const innerW      = width - WALL * 2
  const slotW       = innerW / moduleCount
  const moduleWidth = span * slotW

  // Module is fully inside zone when its far edge (away from the wall) is still within the diagonal.
  // Left zone: far edge = right edge. Right zone: far edge = left edge.
  const farEdgeX = side === 'left'
    ? WALL + (slotIndex + span) * slotW
    : WALL + slotIndex * slotW
  if (getDiagHeightAt(farEdgeX, diagParams) >= mainHeight) return null

  // Shelf height = diagonal height at the wall-side edge of this module (lowest point within module).
  const wallEdgeX = side === 'left'
    ? WALL + slotIndex * slotW
    : WALL + (slotIndex + span) * slotW
  const kinkH = getDiagHeightAt(wallEdgeX, diagParams)

  if (kinkH <= 0 || kinkH >= mainHeight) return null
  if (kinkH < SHELF_THICKNESS) return null

  const moduleDepth  = depth - WALL - CLOSET_INSIDE_INSET
  const contentDepth = moduleDepth - MODULE_INSIDE_INSET

  const cx = (-innerW / 2) + slotIndex * slotW + moduleWidth / 2
  const cy = kinkH - SHELF_THICKNESS / 2
  const cz = WALL + contentDepth / 2

  return (
    <ModuleMaterialOverrideProvider
      buitenkantMaterialId={buitenkantMaterialId}
      binnenkantMaterialId={binnenkantMaterialId}
    >
      <mesh position={[cx, cy, cz]} castShadow receiveShadow>
        <boxGeometry args={[moduleWidth, SHELF_THICKNESS, contentDepth]} />
        <ClosetMaterial variant={hasDoor ? 'binnenkant' : 'buitenkant'} />
      </mesh>
    </ModuleMaterialOverrideProvider>
  )
}
