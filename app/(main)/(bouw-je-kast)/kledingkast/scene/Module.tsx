'use client'

import { useMemo } from 'react'
import * as THREE from 'three/webgpu'
import { useClosetStore } from '../store'
import { getLayoutById, computeModulePositions } from './moduleLayouts'
import { getDiagHeightAt, isFullHeight, CORPUS_WALL } from './diagonalUtils'
import type { DiagParams } from './diagonalUtils'
import FillZone from './FillZone'
import SpecialElement from './SpecialElement'
import Door from '../../_shared/objects/Door'
import ClosetMaterial, { ModuleMaterialOverrideProvider } from '../../_shared/materials/ClosetMaterial'

const WALL = 0.018
const MODULE_WALL = 0.018
const MODULE_INSIDE_INSET = 0.010
const ONDERSTEL_HEIGHT = 0.108
const ONDERSTEL_GAP = 0.010
const CLOSET_INSIDE_INSET = 0.025
const MODULE_FLOOR_Y = ONDERSTEL_HEIGHT + ONDERSTEL_GAP

interface ModuleProps {
  index: number
  layoutId: number
  hasDoor: boolean
  span: 1 | 2
  diagParams: DiagParams
}

function wallHeightAt(xOuter: number, p: DiagParams): number {
  const diagH = getDiagHeightAt(xOuter, p)
  return Math.max(0, diagH - MODULE_FLOOR_Y - WALL)
}

/**
 * Computes an inward-offset polyline at true perpendicular distance `thickness` below an outer profile.
 * Uses miter joins at interior vertices so each segment has correct perpendicular thickness.
 */
function offsetProfileInward(
  outer: Array<{ x: number; y: number }>,
  thickness: number,
): Array<{ x: number; y: number }> {
  const n = outer.length
  // Per-segment direction and inward normal (90° clockwise = downward for a top profile)
  const segs = outer.slice(0, -1).map((p, i) => {
    const q = outer[i + 1]
    const dx = q.x - p.x
    const dy = q.y - p.y
    const len = Math.sqrt(dx * dx + dy * dy)
    return { dx: dx / len, dy: dy / len, nx: (thickness * dy) / len, ny: (-thickness * dx) / len }
  })
  const inner: Array<{ x: number; y: number }> = []
  inner.push({ x: outer[0].x + segs[0].nx, y: outer[0].y + segs[0].ny })
  for (let i = 1; i < n - 1; i++) {
    const s1 = segs[i - 1]
    const s2 = segs[i]
    const dnx = s1.nx - s2.nx
    const dny = s1.ny - s2.ny
    const det = s1.dx * s2.dy - s1.dy * s2.dx
    if (Math.abs(det) < 1e-9) {
      inner.push({ x: outer[i].x + (s1.nx + s2.nx) / 2, y: outer[i].y + (s1.ny + s2.ny) / 2 })
    } else {
      const s = (s2.dx * dny - s2.dy * dnx) / det
      inner.push({ x: outer[i].x + s1.nx + s * s1.dx, y: outer[i].y + s1.ny + s * s1.dy })
    }
  }
  const last = segs[n - 2]
  inner.push({ x: outer[n - 1].x + last.nx, y: outer[n - 1].y + last.ny })
  return inner
}

/**
 * Door top profile — same kink x as the ceiling (corpus diagonal outer-top corner)
 * but with explicit edge heights so the corpus-offset correction is included.
 * This keeps the door-to-ceiling gap uniform across the diagonal section.
 */
function computeDoorProfile(
  leftXOuter: number,
  rightXOuter: number,
  p: DiagParams,
  leftH: number,
  rightH: number,
): Array<{ x: number; y: number }> {
  const flatH = p.mainHeight - MODULE_FLOOR_Y - WALL
  const kinks: Array<{ x: number; y: number }> = []

  if ((p.diagonalSide === 'left' || p.diagonalSide === 'both') && p.leftDiagTopWidth > 0) {
    const kx = CORPUS_WALL + p.leftDiagTopWidth
    if (kx > leftXOuter && kx < rightXOuter) kinks.push({ x: kx, y: flatH })
  }
  if ((p.diagonalSide === 'right' || p.diagonalSide === 'both') && p.rightDiagTopWidth > 0) {
    const kx = p.outerWidth - CORPUS_WALL - p.rightDiagTopWidth
    if (kx > leftXOuter && kx < rightXOuter) kinks.push({ x: kx, y: flatH })
  }

  const edges = [
    { x: leftXOuter, y: leftH },
    { x: rightXOuter, y: rightH },
  ]
  return [...edges, ...kinks]
    .sort((a, b) => a.x - b.x)
    .map(({ x, y }) => ({ x: x - leftXOuter, y }))
}

/**
 * Ceiling profile across a module's X range, in module-local coordinates.
 * Samples getDiagHeightAt at the left edge, any diagonal kink points that
 * fall inside the module (where the slope transitions to flat), and the right
 * edge. Without this, a straight tilted panel leaves empty space when the
 * kink point sits inside the module width.
 */
function computeRoofProfile(
  leftXOuter: number,
  rightXOuter: number,
  p: DiagParams,
): Array<{ x: number; y: number }> {
  // Flat-section ceiling height (module-local y).
  const flatH = p.mainHeight - MODULE_FLOOR_Y - WALL

  // Kink points: x aligns with the corpus diagonal outer-top corner (= top panel edge),
  // y snapped to flatH so the transition sits at the correct height.
  const kinks: Array<{ x: number; y: number }> = []

  if ((p.diagonalSide === 'left' || p.diagonalSide === 'both') && p.leftDiagTopWidth > 0) {
    const kx = CORPUS_WALL + p.leftDiagTopWidth
    if (kx > leftXOuter && kx < rightXOuter) kinks.push({ x: kx, y: flatH })
  }
  if ((p.diagonalSide === 'right' || p.diagonalSide === 'both') && p.rightDiagTopWidth > 0) {
    const kx = p.outerWidth - CORPUS_WALL - p.rightDiagTopWidth
    if (kx > leftXOuter && kx < rightXOuter) kinks.push({ x: kx, y: flatH })
  }

  const edges = [leftXOuter, rightXOuter].map((xOuter) => ({ x: xOuter, y: wallHeightAt(xOuter, p) }))
  return [...edges, ...kinks]
    .sort((a, b) => a.x - b.x)
    .map(({ x, y }) => ({ x: x - leftXOuter, y }))
}

export default function Module({ index, layoutId, hasDoor, span, diagParams: p }: ModuleProps) {
  const depth        = useClosetStore((s) => s.depth) / 100
  const moduleCount  = useClosetStore((s) => s.moduleCount)
  const width        = useClosetStore((s) => s.width) / 100
  const doorsOpen    = useClosetStore((s) => s.doorsOpen)
  const hoveredSlot  = useClosetStore((s) => s.hoveredSlot)
  const doorHandleId = useClosetStore((s) => s.doorHandleId)
  const moduleSlot   = useClosetStore((s) => s.modules.find((m) => m.slotIndex === index))

  const layout = getLayoutById(layoutId)
  if (!layout) return null

  const innerW       = width - WALL * 2
  const slotW        = innerW / moduleCount
  const moduleWidth  = span * slotW
  const moduleDepth  = depth - WALL - CLOSET_INSIDE_INSET
  const contentDepth = moduleDepth - MODULE_INSIDE_INSET
  const centerZ      = contentDepth / 2
  const centerX      = moduleWidth / 2

  // X positions from outer left edge for the left and right walls of this module
  const leftWallXOuter  = WALL + index * slotW
  const rightWallXOuter = WALL + (index + span) * slotW

  const isLastModule = index + span === moduleCount

  // Whether this module's left/right wall abuts the corpus diagonal panel
  const hasLeftDiag  = (p.diagonalSide === 'left'  || p.diagonalSide === 'both') && index === 0
  const hasRightDiag = (p.diagonalSide === 'right' || p.diagonalSide === 'both') && isLastModule

  // Perpendicular-offset correction: the corpus diagonal inner face is offset from
  // the outer face by WALL perpendicular to the slope, not vertically. The inner face
  // at the module edge is at diagStartH - WALL*(1-sinT)/cosT below diagStartH.
  // Correction = WALL*(rise + run - len) / run  =  WALL*(1 - sinT) / cosT
  const riseLeft  = p.mainHeight - p.leftDiagStartHeight
  const riseRight = p.mainHeight - p.rightDiagStartHeight
  // runLeft/runRight = full outer-face horizontal extent per side (matches SideWallAssembly)
  const runLeft   = CORPUS_WALL + p.leftDiagTopWidth
  const runRight  = CORPUS_WALL + p.rightDiagTopWidth
  const lenLeft   = Math.sqrt(riseLeft  * riseLeft  + runLeft  * runLeft)
  const lenRight  = Math.sqrt(riseRight * riseRight + runRight * runRight)

  const leftWallH  = wallHeightAt(leftWallXOuter,  p) + (hasLeftDiag  ? WALL * (riseLeft  + runLeft  - lenLeft)  / runLeft  : 0)
  const rightWallH = wallHeightAt(rightWallXOuter, p) + (hasRightDiag ? WALL * (riseRight + runRight - lenRight) / runRight : 0)

  // Fill zones use the enclosed floor height (min of both walls — shelves must be fully enclosed)
  const roofY = Math.min(leftWallH, rightWallH)
  const { specialElementY, fillAbove, fillBelow } = computeModulePositions(layout, roofY)

  // Ceiling profile: left edge, kink points within the module, right edge.
  // Edge y values are overridden with the cosine-corrected wall heights so the
  // roof outer face aligns flush with the module side wall tops.
  const roofProfile = useMemo(() => {
    const profile = computeRoofProfile(leftWallXOuter, rightWallXOuter, p)
    profile[0] = { ...profile[0], y: leftWallH }
    profile[profile.length - 1] = { ...profile[profile.length - 1], y: rightWallH }
    return profile
  }, [leftWallXOuter, rightWallXOuter, p, leftWallH, rightWallH])

  // Door profiles — slope-matching kink so the door top edge is parallel to the corpus diagonal.
  // Computed separately from roofProfile so the ceiling geometry is not affected.
  const midXOuter        = leftWallXOuter + slotW
  const midH             = wallHeightAt(midXOuter, p)
  const doorProfile      = useMemo(
    () => computeDoorProfile(leftWallXOuter, rightWallXOuter, p, leftWallH, rightWallH),
    [leftWallXOuter, rightWallXOuter, p, leftWallH, rightWallH],
  )
  const leftDoorProfile  = useMemo(
    () => computeDoorProfile(leftWallXOuter, midXOuter, p, leftWallH, midH),
    [leftWallXOuter, midXOuter, p, leftWallH, midH],
  )
  const rightDoorProfile = useMemo(
    () => computeDoorProfile(midXOuter, rightWallXOuter, p, midH, rightWallH),
    [midXOuter, rightWallXOuter, p, midH, rightWallH],
  )

  // Back wall — polygon following the ceiling profile, extruded by MODULE_WALL
  const backWallGeo = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(0, 0)
    shape.lineTo(moduleWidth, 0)
    for (let i = roofProfile.length - 1; i >= 0; i--) {
      shape.lineTo(roofProfile[i].x, roofProfile[i].y)
    }
    shape.closePath()
    return new THREE.ExtrudeGeometry(shape, { depth: MODULE_WALL, bevelEnabled: false })
  }, [roofProfile, moduleWidth])

  // Shared inner face profile — true perpendicular offset of roofProfile inward by MODULE_WALL.
  // Used by roofGeo, leftWallGeo, and rightWallGeo so all joints reference the same surface.
  const innerProfile = useMemo(
    () => offsetProfileInward(roofProfile, MODULE_WALL),
    [roofProfile],
  )

  // Roof panel — ExtrudeGeometry following the ceiling profile, extruded by moduleDepth.
  const roofGeo = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(roofProfile[0].x, roofProfile[0].y)
    for (let i = 1; i < roofProfile.length; i++) {
      shape.lineTo(roofProfile[i].x, roofProfile[i].y)
    }
    for (let i = innerProfile.length - 1; i >= 0; i--) {
      shape.lineTo(innerProfile[i].x, innerProfile[i].y)
    }
    shape.closePath()
    return new THREE.ExtrudeGeometry(shape, { depth: moduleDepth, bevelEnabled: false })
  }, [roofProfile, innerProfile, moduleDepth])

  // Left wall — always a trapezoid: outer (left) face at roof outer-face height, inner (right)
  // face at roof inner-face height so the top meets the sloped ceiling with no gap or cutoff.
  const leftWallGeo = useMemo(() => {
    if (innerProfile.length < 2) return null
    const t = (MODULE_WALL - innerProfile[0].x) / (innerProfile[1].x - innerProfile[0].x)
    const hRight = innerProfile[0].y + t * (innerProfile[1].y - innerProfile[0].y)
    const shape = new THREE.Shape()
    shape.moveTo(0, 0)
    shape.lineTo(MODULE_WALL, 0)
    shape.lineTo(MODULE_WALL, hRight)
    shape.lineTo(0, leftWallH)
    shape.closePath()
    return new THREE.ExtrudeGeometry(shape, { depth: moduleDepth, bevelEnabled: false })
  }, [innerProfile, leftWallH, moduleDepth])

  // Right wall — always a trapezoid: outer (right) face at roof outer-face height, inner (left)
  // face at roof inner-face height.
  const rightWallGeo = useMemo(() => {
    if (innerProfile.length < 2) return null
    const n = innerProfile.length
    const t = (moduleWidth - MODULE_WALL - innerProfile[n - 2].x) / (innerProfile[n - 1].x - innerProfile[n - 2].x)
    const hLeft = innerProfile[n - 2].y + t * (innerProfile[n - 1].y - innerProfile[n - 2].y)
    const shape = new THREE.Shape()
    shape.moveTo(moduleWidth - MODULE_WALL, 0)
    shape.lineTo(moduleWidth, 0)
    shape.lineTo(moduleWidth, rightWallH)
    shape.lineTo(moduleWidth - MODULE_WALL, hLeft)
    shape.closePath()
    return new THREE.ExtrudeGeometry(shape, { depth: moduleDepth, bevelEnabled: false })
  }, [hasRightDiag, innerProfile, rightWallH, moduleDepth, moduleWidth])

  const moduleHasDiag    = !isFullHeight(leftWallXOuter, rightWallXOuter, p)

  // A kink point (diagonal→flat transition) inside the module means a partly-straight roof.
  // fillToTop only applies when the entire roof is uniformly sloped (no kink inside).
  const hasKinkInRange =
    ((p.diagonalSide === 'left' || p.diagonalSide === 'both') &&
      p.leftDiagTopWidth > 0 &&
      CORPUS_WALL + p.leftDiagTopWidth > leftWallXOuter &&
      CORPUS_WALL + p.leftDiagTopWidth < rightWallXOuter) ||
    ((p.diagonalSide === 'right' || p.diagonalSide === 'both') &&
      p.rightDiagTopWidth > 0 &&
      p.outerWidth - CORPUS_WALL - p.rightDiagTopWidth > leftWallXOuter &&
      p.outerWidth - CORPUS_WALL - p.rightDiagTopWidth < rightWallXOuter)
  const fillToTop = moduleHasDiag && !hasKinkInRange
  // Diagonal: left wall lower → left diagonal → mirror=true; right wall lower → right diagonal → mirror=false
  const mirrorDoor       = moduleHasDiag ? leftWallH < rightWallH : (index % 2 === 1 || isLastModule)

  const startX = -innerW / 2
  const x      = startX + index * slotW

  return (
    <ModuleMaterialOverrideProvider
      buitenkantMaterialId={moduleSlot?.buitenkantMaterialId}
      binnenkantMaterialId={moduleSlot?.binnenkantMaterialId}
    >
    <group position={[x, MODULE_FLOOR_Y, WALL]}>
      {/* Special element (GLB) */}
      <SpecialElement
        layout={layout}
        targetWidth={moduleWidth - MODULE_WALL * 2}
        targetDepth={contentDepth}
        positionY={specialElementY}
        hovered={hoveredSlot === index}
        hasDoor={hasDoor}
      />

      {/* Fill zone above special element */}
      {fillAbove.end > fillAbove.start && (
        <FillZone
          config={layout.fillZone.above}
          startY={fillAbove.start}
          endY={fillAbove.end}
          width={moduleWidth}
          depth={contentDepth}
          centerX={centerX}
          centerZ={centerZ}
          hasDoor={hasDoor}
          fillToTop={fillToTop}
        />
      )}

      {/* Fill zone below special element */}
      {fillBelow.end > fillBelow.start && (
        <FillZone
          config={layout.fillZone.below}
          startY={fillBelow.start}
          endY={fillBelow.end}
          width={moduleWidth}
          depth={contentDepth}
          centerX={centerX}
          centerZ={centerZ}
          hasDoor={hasDoor}
          fillToTop={fillToTop}
        />
      )}

      {/* Back wall — trapezoid matching leftWallH/rightWallH, extruded by MODULE_WALL */}
      <mesh position={[0, 0, 0]} geometry={backWallGeo} castShadow receiveShadow>
        <ClosetMaterial variant={hasDoor ? 'binnenkant' : 'buitenkant'} />
      </mesh>

      {/* Left wall — trapezoid with sloped top following the ceiling inner face */}
      {leftWallGeo && (
        <mesh position={[0, 0, centerZ - moduleDepth / 2]} geometry={leftWallGeo} castShadow receiveShadow>
          <ClosetMaterial variant={hasDoor ? 'binnenkant' : 'buitenkant'} />
        </mesh>
      )}

      {/* Right wall — trapezoid with sloped top following the ceiling inner face */}
      {rightWallGeo && (
        <mesh position={[0, 0, centerZ - moduleDepth / 2]} geometry={rightWallGeo} castShadow receiveShadow>
          <ClosetMaterial variant={hasDoor ? 'binnenkant' : 'buitenkant'} />
        </mesh>
      )}

      {/* Floor */}
      <mesh position={[moduleWidth / 2, MODULE_WALL / 2, centerZ]} castShadow receiveShadow>
        <boxGeometry args={[moduleWidth, MODULE_WALL, moduleDepth]} />
        <ClosetMaterial variant={hasDoor ? 'binnenkant' : 'buitenkant'} />
      </mesh>

      {/* Roof — follows ceiling profile exactly, filling to the diagonal */}
      <mesh position={[0, 0, centerZ - moduleDepth / 2]} geometry={roofGeo} castShadow receiveShadow>
        <ClosetMaterial variant={hasDoor ? 'binnenkant' : 'buitenkant'} />
      </mesh>

      {/* Door(s) */}
      {hasDoor && span === 1 && (
        <Door
          moduleHeight={roofY}
          slotW={slotW}
          moduleDepth={moduleDepth}
          doorsOpen={doorsOpen}
          doorHandleId={doorHandleId}
          mirror={mirrorDoor}
          topProfile={doorProfile}
        />
      )}
      {hasDoor && span === 2 && (
        <>
          <Door
            moduleHeight={Math.min(leftDoorProfile[0].y, leftDoorProfile[leftDoorProfile.length - 1].y)}
            slotW={slotW}
            moduleDepth={moduleDepth}
            doorsOpen={doorsOpen}
            doorHandleId={doorHandleId}
            topProfile={leftDoorProfile}
          />
          <group position={[slotW, 0, 0]}>
            <Door
              moduleHeight={Math.min(rightDoorProfile[0].y, rightDoorProfile[rightDoorProfile.length - 1].y)}
              slotW={slotW}
              moduleDepth={moduleDepth}
              doorsOpen={doorsOpen}
              doorHandleId={doorHandleId}
              mirror
              topProfile={rightDoorProfile}
            />
          </group>
        </>
      )}
    </group>
    </ModuleMaterialOverrideProvider>
  )
}
