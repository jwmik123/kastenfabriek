'use client'

import { useMemo } from 'react'
import * as THREE from 'three/webgpu'
import { useClosetStore } from '../store'
import { getLayoutById, computeModulePositions } from './moduleLayouts'
import { getDiagHeightAt, getBackDiagHeightAtZ, isFullHeight, CORPUS_WALL } from './diagonalUtils'
import type { DiagParams } from './diagonalUtils'
import FillZone from './FillZone'
import SpecialElement from './SpecialElement'
import Door from '../../_shared/objects/Door'
import ClosetMaterial, { ModuleMaterialOverrideProvider } from '../../_shared/materials/ClosetMaterial'
import { trapShape, trapGeo, trapNaN } from '@/utils/debugGeometry'

const WALL = 0.018
const MODULE_WALL = 0.018
const MODULE_INSIDE_INSET = 0.010
const ONDERSTEL_HEIGHT = 0.108
const ONDERSTEL_GAP = 0.010
const CLOSET_INSIDE_INSET = 0.025
const DOOR_TOP_GAP = 0.010  // 10mm clearance between door top and closet ceiling
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

function offsetProfileInward(
  outer: Array<{ x: number; y: number }>,
  thickness: number,
): Array<{ x: number; y: number }> {
  const n = outer.length
  const segs = outer.slice(0, -1).map((p, i) => {
    const q = outer[i + 1]
    const dx = q.x - p.x
    const dy = q.y - p.y
    const len = Math.sqrt(dx * dx + dy * dy)
    if (len < 1e-9) return { dx: 1, dy: 0, nx: 0, ny: -thickness }
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

function computeRoofProfile(
  leftXOuter: number,
  rightXOuter: number,
  p: DiagParams,
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

  const leftWallXOuter  = WALL + index * slotW
  const rightWallXOuter = WALL + (index + span) * slotW

  const isLastModule = index + span === moduleCount

  // ========================
  // BACK DIAGONAL case
  // ========================
  const isBackDiag = p.backDiagonal

  // Module group is at worldZ = WALL (inner face of corpus back panel).
  // module-local z=0 → worldZ=WALL (back), z=moduleDepth → worldZ=WALL+moduleDepth (front)
  const hBack = isBackDiag
    ? Math.max(0, Math.min(trapNaN(getBackDiagHeightAtZ(WALL, p), `Module${index}-hBack-raw`), p.mainHeight) - MODULE_FLOOR_Y - WALL)
    : 0
  const hFront = isBackDiag
    ? Math.max(0, Math.min(trapNaN(getBackDiagHeightAtZ(WALL + moduleDepth, p), `Module${index}-hFront-raw`), p.mainHeight) - MODULE_FLOOR_Y - WALL)
    : 0
  trapNaN(hBack, `Module${index}-hBack`)
  trapNaN(hFront, `Module${index}-hFront`)
  const flatH = p.mainHeight - MODULE_FLOOR_Y - WALL

  // Back diagonal ceiling profile in Z-Y space (treating z_local as x for offsetProfileInward).
  // Points sorted by z_local (back=0 to front=moduleDepth).
  //
  // Kink at crossingLocalZ: the worldZ where the shared shell height = mainHeight.
  // - No TC: closetHeight = mainHeight, so crossingLocalZ = flatStartLocalZ (same as before).
  // - TC active: closetHeight > mainHeight, crossing is earlier — ends the diagonal segment
  //   correctly at mainHeight rather than overshooting to closetHeight.
  const bdOuterProfile = useMemo((): Array<{ x: number; y: number }> => {
    if (!isBackDiag) return []
    const depthRun   = p.outerDepth - p.backDiagFlatSectionDepth
    const heightDrop = p.closetHeight - p.backDiagKinkHeight
    const crossingWZ = heightDrop > 0.001
      ? depthRun * (p.mainHeight - p.backDiagKinkHeight) / heightDrop
      : depthRun
    const crossingLZ = crossingWZ - WALL
    const pts: Array<{ x: number; y: number }> = [{ x: 0, y: hBack }]
    if (crossingLZ > 0.001 && crossingLZ < moduleDepth - 0.001) {
      pts.push({ x: crossingLZ, y: flatH })
    }
    pts.push({ x: moduleDepth, y: hFront })
    return pts
  }, [isBackDiag, hBack, hFront, flatH, moduleDepth, p])

  const bdInnerProfile = useMemo(() => {
    if (!isBackDiag || bdOuterProfile.length < 2) return []
    return offsetProfileInward(bdOuterProfile, MODULE_WALL)
  }, [isBackDiag, bdOuterProfile])

  // Roof geo: Y-Z profile extruded by moduleWidth along X, via rotateY(PI/2).
  // Shape uses x_shape = -z_local so after rotateY: vertex(x,y,z_ext) → (z_ext, y, -x).
  // z_ext=0..moduleWidth maps to localX=0..moduleWidth ✓
  // -x maps to localZ: x=0 → z=0 (back), x=-moduleDepth → z=moduleDepth (front) ✓
  const bdRoofGeo = useMemo(() => {
    if (!isBackDiag || bdOuterProfile.length < 2 || bdInnerProfile.length < 2) return null
    const shape = new THREE.Shape()
    shape.moveTo(-bdOuterProfile[0].x, bdOuterProfile[0].y)
    for (let i = 1; i < bdOuterProfile.length; i++) {
      shape.lineTo(-bdOuterProfile[i].x, bdOuterProfile[i].y)
    }
    for (let i = bdInnerProfile.length - 1; i >= 0; i--) {
      shape.lineTo(-bdInnerProfile[i].x, bdInnerProfile[i].y)
    }
    shape.closePath()
    const geo = new THREE.ExtrudeGeometry(trapShape(shape, `Module${index}-bdRoofGeo`), { depth: moduleWidth, bevelEnabled: false })
    geo.rotateY(Math.PI / 2)
    return trapGeo(geo, `Module${index}-bdRoofGeo-geo`)
  }, [isBackDiag, bdOuterProfile, bdInnerProfile, moduleWidth])

  // Side wall geo for back diagonal: trapezoid in Z-Y, extruded by MODULE_WALL along X.
  // Both left and right walls share this shape — only mesh position differs.
  const bdSideWallGeo = useMemo(() => {
    if (!isBackDiag || bdInnerProfile.length < 2) return null
    const shape = new THREE.Shape()
    shape.moveTo(0, 0)
    shape.lineTo(-moduleDepth, 0)
    shape.lineTo(-bdInnerProfile[bdInnerProfile.length - 1].x, bdInnerProfile[bdInnerProfile.length - 1].y)
    for (let i = bdInnerProfile.length - 2; i >= 1; i--) {
      shape.lineTo(-bdInnerProfile[i].x, bdInnerProfile[i].y)
    }
    shape.lineTo(-bdInnerProfile[0].x, bdInnerProfile[0].y)
    shape.closePath()
    const geo = new THREE.ExtrudeGeometry(trapShape(shape, `Module${index}-bdSideWallGeo`), { depth: MODULE_WALL, bevelEnabled: false })
    geo.rotateY(Math.PI / 2)
    return trapGeo(geo, `Module${index}-bdSideWallGeo-geo`)
  }, [isBackDiag, bdInnerProfile, moduleDepth])

  // ========================
  // SIDE DIAGONAL case (existing logic)
  // ========================
  const hasLeftDiag  = (p.diagonalSide === 'left'  || p.diagonalSide === 'both') && index === 0
  const hasRightDiag = (p.diagonalSide === 'right' || p.diagonalSide === 'both') && isLastModule

  const riseLeft  = p.mainHeight - p.leftDiagStartHeight
  const riseRight = p.mainHeight - p.rightDiagStartHeight
  const runLeft   = CORPUS_WALL + p.leftDiagTopWidth
  const runRight  = CORPUS_WALL + p.rightDiagTopWidth
  const lenLeft   = Math.sqrt(riseLeft  * riseLeft  + runLeft  * runLeft)
  const lenRight  = Math.sqrt(riseRight * riseRight + runRight * runRight)

  const leftWallH  = wallHeightAt(leftWallXOuter,  p) + (hasLeftDiag  ? WALL * (riseLeft  + runLeft  - lenLeft)  / runLeft  : 0)
  const rightWallH = wallHeightAt(rightWallXOuter, p) + (hasRightDiag ? WALL * (riseRight + runRight - lenRight) / runRight : 0)

  // roofY: min ceiling height for content placement
  const roofY = isBackDiag ? hBack : Math.min(leftWallH, rightWallH)
  const { specialElementY, fillAbove, fillBelow } = computeModulePositions(layout, roofY)

  const roofProfile = useMemo(() => {
    if (isBackDiag) return []  // not used for back diagonal
    const profile = computeRoofProfile(leftWallXOuter, rightWallXOuter, p)
    profile[0] = { ...profile[0], y: leftWallH }
    profile[profile.length - 1] = { ...profile[profile.length - 1], y: rightWallH }
    return profile
  }, [isBackDiag, leftWallXOuter, rightWallXOuter, p, leftWallH, rightWallH])

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

  const backWallGeo = useMemo(() => {
    if (isBackDiag) return null  // handled inline in JSX for back diagonal
    const shape = new THREE.Shape()
    shape.moveTo(0, 0)
    shape.lineTo(moduleWidth, 0)
    for (let i = roofProfile.length - 1; i >= 0; i--) {
      shape.lineTo(roofProfile[i].x, roofProfile[i].y)
    }
    shape.closePath()
    return trapGeo(new THREE.ExtrudeGeometry(trapShape(shape, `Module${index}-backWall`), { depth: MODULE_WALL, bevelEnabled: false }), `Module${index}-backWall-geo`)
  }, [isBackDiag, roofProfile, moduleWidth])

  const innerProfile = useMemo(
    () => isBackDiag ? [] : offsetProfileInward(roofProfile, MODULE_WALL),
    [isBackDiag, roofProfile],
  )

  const roofGeo = useMemo(() => {
    if (isBackDiag) return null  // handled by bdRoofGeo
    const shape = new THREE.Shape()
    shape.moveTo(roofProfile[0].x, roofProfile[0].y)
    for (let i = 1; i < roofProfile.length; i++) {
      shape.lineTo(roofProfile[i].x, roofProfile[i].y)
    }
    for (let i = innerProfile.length - 1; i >= 0; i--) {
      shape.lineTo(innerProfile[i].x, innerProfile[i].y)
    }
    shape.closePath()
    return trapGeo(new THREE.ExtrudeGeometry(trapShape(shape, `Module${index}-roofGeo`), { depth: moduleDepth, bevelEnabled: false }), `Module${index}-roofGeo-geo`)
  }, [isBackDiag, roofProfile, innerProfile, moduleDepth])

  const leftWallGeo = useMemo(() => {
    if (isBackDiag) return null  // handled by bdSideWallGeo
    if (innerProfile.length < 2) return null
    const denom = innerProfile[1].x - innerProfile[0].x
    trapNaN(denom, `Module${index}-leftWall-denom`)
    const t = (MODULE_WALL - innerProfile[0].x) / denom
    const hRight = innerProfile[0].y + t * (innerProfile[1].y - innerProfile[0].y)
    trapNaN(hRight, `Module${index}-leftWall-hRight`)
    trapNaN(leftWallH, `Module${index}-leftWallH`)
    const shape = new THREE.Shape()
    shape.moveTo(0, 0)
    shape.lineTo(MODULE_WALL, 0)
    shape.lineTo(MODULE_WALL, hRight)
    shape.lineTo(0, leftWallH)
    shape.closePath()
    return trapGeo(new THREE.ExtrudeGeometry(trapShape(shape, `Module${index}-leftWall`), { depth: moduleDepth, bevelEnabled: false }), `Module${index}-leftWall-geo`)
  }, [isBackDiag, innerProfile, leftWallH, moduleDepth])

  const rightWallGeo = useMemo(() => {
    if (isBackDiag) return null  // handled by bdSideWallGeo
    if (innerProfile.length < 2) return null
    const n = innerProfile.length
    const denom = innerProfile[n - 1].x - innerProfile[n - 2].x
    trapNaN(denom, `Module${index}-rightWall-denom`)
    const t = (moduleWidth - MODULE_WALL - innerProfile[n - 2].x) / denom
    const hLeft = innerProfile[n - 2].y + t * (innerProfile[n - 1].y - innerProfile[n - 2].y)
    trapNaN(hLeft, `Module${index}-rightWall-hLeft`)
    trapNaN(rightWallH, `Module${index}-rightWallH`)
    const shape = new THREE.Shape()
    shape.moveTo(moduleWidth - MODULE_WALL, 0)
    shape.lineTo(moduleWidth, 0)
    shape.lineTo(moduleWidth, rightWallH)
    shape.lineTo(moduleWidth - MODULE_WALL, hLeft)
    shape.closePath()
    return trapGeo(new THREE.ExtrudeGeometry(trapShape(shape, `Module${index}-rightWall`), { depth: moduleDepth, bevelEnabled: false }), `Module${index}-rightWall-geo`)
  }, [isBackDiag, innerProfile, rightWallH, moduleDepth, moduleWidth])

  const moduleHasDiag    = !isFullHeight(leftWallXOuter, rightWallXOuter, p)

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
  const mirrorDoor = isBackDiag
    ? (index % 2 === 1 || isLastModule)
    : (moduleHasDiag ? leftWallH < rightWallH : (index % 2 === 1 || isLastModule))

  // Door profile for back diagonal.
  // When filler active (flatSec=0): extend door to closetH - DOOR_TOP_GAP so it
  // covers the filler panel, leaving only a 10mm clearance gap at the top.
  // Without filler: flat top at hFront as before.
  const bdDoorProfile = useMemo((): Array<{ x: number; y: number }> => {
    if (!isBackDiag) return []
    const fillerActive = p.backDiagFlatSectionDepth < 0.001
    const doorTopH = fillerActive
      // Shell height at door front face Z (= depth - CLOSET_INSIDE_INSET), minus 10mm gap.
      // Filler is recessed so its top is below closetHeight; door must not exceed it.
      ? getBackDiagHeightAtZ(WALL + moduleDepth, p) - DOOR_TOP_GAP - MODULE_FLOOR_Y
      : hFront
    return [{ x: 0, y: doorTopH }, { x: slotW, y: doorTopH }]
  }, [isBackDiag, hFront, slotW, moduleDepth, p])

  const startX = -innerW / 2
  const x      = startX + index * slotW

  return (
    <ModuleMaterialOverrideProvider
      buitenkantMaterialId={moduleSlot?.buitenkantMaterialId}
      binnenkantMaterialId={moduleSlot?.binnenkantMaterialId}
    >
    <group position={[x, MODULE_FLOOR_Y, WALL]}>
      <SpecialElement
        layout={layout}
        targetWidth={moduleWidth - MODULE_WALL * 2}
        targetDepth={contentDepth}
        positionY={specialElementY}
        hovered={hoveredSlot === index}
        hasDoor={hasDoor}
      />

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

      {/* Back wall */}
      {isBackDiag ? (
        <mesh key="back-wall-bd" position={[moduleWidth / 2, hBack / 2, MODULE_WALL / 2]} castShadow receiveShadow>
          <boxGeometry args={[moduleWidth, Math.max(0.001, hBack), MODULE_WALL]} />
          <ClosetMaterial variant={hasDoor ? 'binnenkant' : 'buitenkant'} />
        </mesh>
      ) : (
        <mesh key="back-wall-sd" position={[0, 0, 0]} geometry={backWallGeo!} castShadow receiveShadow>
          <ClosetMaterial variant={hasDoor ? 'binnenkant' : 'buitenkant'} />
        </mesh>
      )}

      {/* Left wall */}
      {isBackDiag ? (
        bdSideWallGeo && (
          <mesh key="left-wall-bd" position={[0, 0, 0]} geometry={bdSideWallGeo} castShadow receiveShadow>
            <ClosetMaterial variant={hasDoor ? 'binnenkant' : 'buitenkant'} />
          </mesh>
        )
      ) : (
        leftWallGeo && (
          <mesh key="left-wall-sd" position={[0, 0, centerZ - moduleDepth / 2]} geometry={leftWallGeo} castShadow receiveShadow>
            <ClosetMaterial variant={hasDoor ? 'binnenkant' : 'buitenkant'} />
          </mesh>
        )
      )}

      {/* Right wall */}
      {isBackDiag ? (
        bdSideWallGeo && (
          <mesh key="right-wall-bd" position={[moduleWidth - MODULE_WALL, 0, 0]} geometry={bdSideWallGeo} castShadow receiveShadow>
            <ClosetMaterial variant={hasDoor ? 'binnenkant' : 'buitenkant'} />
          </mesh>
        )
      ) : (
        rightWallGeo && (
          <mesh key="right-wall-sd" position={[0, 0, centerZ - moduleDepth / 2]} geometry={rightWallGeo} castShadow receiveShadow>
            <ClosetMaterial variant={hasDoor ? 'binnenkant' : 'buitenkant'} />
          </mesh>
        )
      )}

      {/* Floor */}
      <mesh position={[moduleWidth / 2, MODULE_WALL / 2, centerZ]} castShadow receiveShadow>
        <boxGeometry args={[moduleWidth, MODULE_WALL, moduleDepth]} />
        <ClosetMaterial variant={hasDoor ? 'binnenkant' : 'buitenkant'} />
      </mesh>

      {/* Roof */}
      {isBackDiag ? (
        bdRoofGeo && (
          <mesh key="roof-bd" position={[0, 0, 0]} geometry={bdRoofGeo} castShadow receiveShadow>
            <ClosetMaterial variant={hasDoor ? 'binnenkant' : 'buitenkant'} />
          </mesh>
        )
      ) : (
        <mesh key="roof-sd" position={[0, 0, centerZ - moduleDepth / 2]} geometry={roofGeo!} castShadow receiveShadow>
          <ClosetMaterial variant={hasDoor ? 'binnenkant' : 'buitenkant'} />
        </mesh>
      )}

      {/* Door(s) */}
      {hasDoor && span === 1 && (
        <Door
          moduleHeight={isBackDiag ? hFront : roofY}
          slotW={slotW}
          moduleDepth={moduleDepth}
          doorsOpen={doorsOpen}
          doorHandleId={doorHandleId}
          mirror={mirrorDoor}
          topProfile={isBackDiag ? bdDoorProfile : doorProfile}
        />
      )}
      {hasDoor && span === 2 && (
        <>
          <Door
            moduleHeight={isBackDiag ? hFront : Math.min(leftDoorProfile[0].y, leftDoorProfile[leftDoorProfile.length - 1].y)}
            slotW={slotW}
            moduleDepth={moduleDepth}
            doorsOpen={doorsOpen}
            doorHandleId={doorHandleId}
            topProfile={isBackDiag ? bdDoorProfile : leftDoorProfile}
          />
          <group position={[slotW, 0, 0]}>
            <Door
              moduleHeight={isBackDiag ? hFront : Math.min(rightDoorProfile[0].y, rightDoorProfile[rightDoorProfile.length - 1].y)}
              slotW={slotW}
              moduleDepth={moduleDepth}
              doorsOpen={doorsOpen}
              doorHandleId={doorHandleId}
              mirror
              topProfile={isBackDiag ? bdDoorProfile : rightDoorProfile}
            />
          </group>
        </>
      )}
    </group>
    </ModuleMaterialOverrideProvider>
  )
}
