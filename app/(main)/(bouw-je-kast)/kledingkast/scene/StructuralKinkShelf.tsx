'use client'

import { useClosetStore } from '../store'
import ClosetMaterial, { ModuleMaterialOverrideProvider } from '../../_shared/materials/ClosetMaterial'
import { SHELF_THICKNESS } from './moduleLayouts'

// Must match Module.tsx and FillZone.tsx constants exactly
const WALL = 0.018
const CLOSET_INSIDE_INSET = 0.025
const MODULE_INSIDE_INSET = 0.010
const ONDERSTEL_HEIGHT = 0.108
const ONDERSTEL_GAP = 0.010
const MODULE_FLOOR_Y = ONDERSTEL_HEIGHT + ONDERSTEL_GAP

interface StructuralKinkShelfProps {
  isStructural: true
  slotIndex: number
  span: 1 | 2
  hasDoor: boolean
  buitenkantMaterialId?: string
  binnenkantMaterialId?: string
}

/**
 * Structural shelf at kinkHeight, auto-inserted per module when backDiagonal is active.
 * Top surface sits exactly at kinkHeight, supporting the kink geometrically.
 * Locked to backDiagonal lifecycle — renders iff backDiagonal is true.
 */
export default function StructuralKinkShelf({
  slotIndex,
  span,
  hasDoor,
  buitenkantMaterialId,
  binnenkantMaterialId,
}: StructuralKinkShelfProps) {
  const backDiagonal = useClosetStore((s) => s.backDiagonal)
  const kinkHeightCm = useClosetStore((s) => s.backDiagKinkHeight)
  const width        = useClosetStore((s) => s.width)        / 100
  const depth        = useClosetStore((s) => s.depth)        / 100
  const moduleCount  = useClosetStore((s) => s.moduleCount)
  const mainH        = useClosetStore((s) => s.mainHeight()) / 100

  // Lifecycle: tied to backDiagonal. Remove when toggled off.
  if (!backDiagonal) return null

  const kinkH = kinkHeightCm / 100

  // Guard: degenerate states during transitions
  if (kinkH <= 0 || kinkH >= mainH) return null
  if (kinkH < SHELF_THICKNESS) {
    console.warn(`StructuralKinkShelf[${slotIndex}]: kinkH ${kinkH.toFixed(3)}m < SHELF_THICKNESS ${SHELF_THICKNESS}m — skipping`)
    return null
  }

  const innerW       = width - WALL * 2
  const slotW        = innerW / moduleCount
  const moduleWidth  = span * slotW
  const moduleDepth  = depth - WALL - CLOSET_INSIDE_INSET
  const contentDepth = moduleDepth - MODULE_INSIDE_INSET

  // World-space center — matches FillZone shelf coordinate system:
  //   Module group origin: [(-innerW/2) + slotIndex*slotW, MODULE_FLOOR_Y, WALL]
  //   Shelf local: [moduleWidth/2, kinkLocalY - SHELF_THICKNESS/2, contentDepth/2]
  //   → world: X below, Y = kinkH - SHELF_THICKNESS/2, Z = WALL + contentDepth/2
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
