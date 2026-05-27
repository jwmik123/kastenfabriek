'use client'

import { useMemo } from 'react'
import * as THREE from 'three/webgpu'
import { useGLTF } from '@react-three/drei'
import { useConfiguratorStore } from '../store/context'
import { resolveElementPositions } from '../../kledingkast/scene/moduleLayouts'
import type { ModuleLayoutConfig, ElementBbox } from '../../kledingkast/scene/moduleLayouts'
import { getDiagHeightAt, getBackDiagHeightAtZ, isFullHeight } from '../../kledingkast/scene/diagonalUtils'
import type { DiagParams } from '../../kledingkast/scene/diagonalUtils'
import FillZone from './FillZone'
import SpecialElement from './SpecialElement'
import Door from '../objects/Door'
import ClosetMaterial, { ModuleMaterialOverrideProvider } from '../materials/ClosetMaterial'
import { trapShape, trapGeo, trapNaN } from '@/utils/debugGeometry'
import { computeSlotWidthsM } from '../store/slotWidths'

const WALL = 0.018
const MODULE_WALL = 0.018
const MODULE_INSIDE_INSET = 0.010
const ONDERSTEL_HEIGHT = 0.108
const ONDERSTEL_GAP = 0.010
const CLOSET_INSIDE_INSET = 0.025
const MODULE_FLOOR_Y = ONDERSTEL_HEIGHT + ONDERSTEL_GAP

interface ModuleProps {
  index: number
  layout: ModuleLayoutConfig
  hasDoor: boolean
  span: 1 | 2
  diagParams: DiagParams
  mirror?: boolean
  depthOverride?: number
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

// Min X-gap from a module edge before we accept a kink there. Prevents a
// near-duplicate roof-profile point that otherwise produces denom≈0 and NaN
// downstream in side-wall geo math (leftWall-hRight / rightWall-hLeft).
const KINK_EDGE_EPS = 1e-4

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
    const kx = p.sideWallThickness + p.leftDiagTopWidth
    if (kx > leftXOuter + KINK_EDGE_EPS && kx < rightXOuter - KINK_EDGE_EPS) kinks.push({ x: kx, y: flatH })
  }
  if ((p.diagonalSide === 'right' || p.diagonalSide === 'both') && p.rightDiagTopWidth > 0) {
    const kx = p.outerWidth - p.sideWallThickness - p.rightDiagTopWidth
    if (kx > leftXOuter + KINK_EDGE_EPS && kx < rightXOuter - KINK_EDGE_EPS) kinks.push({ x: kx, y: flatH })
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
    const kx = p.sideWallThickness + p.leftDiagTopWidth
    if (kx > leftXOuter + KINK_EDGE_EPS && kx < rightXOuter - KINK_EDGE_EPS) kinks.push({ x: kx, y: flatH })
  }
  if ((p.diagonalSide === 'right' || p.diagonalSide === 'both') && p.rightDiagTopWidth > 0) {
    const kx = p.outerWidth - p.sideWallThickness - p.rightDiagTopWidth
    if (kx > leftXOuter + KINK_EDGE_EPS && kx < rightXOuter - KINK_EDGE_EPS) kinks.push({ x: kx, y: flatH })
  }

  const edges = [leftXOuter, rightXOuter].map((xOuter) => ({ x: xOuter, y: wallHeightAt(xOuter, p) }))
  return [...edges, ...kinks]
    .sort((a, b) => a.x - b.x)
    .map(({ x, y }) => ({ x: x - leftXOuter, y }))
}

export default function Module({ index, layout, hasDoor, span, diagParams: p, mirror: mirrorProp, depthOverride }: ModuleProps) {
  const depth        = useConfiguratorStore((s) => s.depth) / 100
  const moduleCount  = useConfiguratorStore((s) => s.moduleCount)
  const width        = useConfiguratorStore((s) => s.width) / 100
  const doorsOpen           = useConfiguratorStore((s) => s.doorsOpen)
  const hoveredSlot         = useConfiguratorStore((s) => s.hoveredSlot)
  const doorHandleId        = useConfiguratorStore((s) => s.doorHandleId)
  const doorHandleMaterial  = useConfiguratorStore((s) => s.doorHandleMaterial)
  const doorsExtendToFloor  = useConfiguratorStore((s) => s.doorsExtendToFloor)
  const pricingData         = useConfiguratorStore((s) => s.pricingData)
  const resolvedHandle      = pricingData?.handles.find((h) => h.id === doorHandleId)
  const doorHandleBodyColor = resolvedHandle?.bodyColor
  const doorHandleMeshId    = resolvedHandle?.meshId
  const doorHandleHeightCm  = resolvedHandle?.heightCm
  const allModules   = useConfiguratorStore((s) => s.modules)
  const moduleSlot   = allModules.find((m) => m.slotIndex === index)
  const needsTop     = useConfiguratorStore((s) => s.needsTopCabinet())

  const sideWallM    = p.sideWallThickness
  const innerW       = width - sideWallM * 2
  const moduleDepth  = depthOverride ?? (depth - WALL - CLOSET_INSIDE_INSET)
  const groupZ       = depthOverride != null ? (depth - CLOSET_INSIDE_INSET - depthOverride) : WALL
  const contentDepth = moduleDepth - MODULE_INSIDE_INSET
  const centerZ      = contentDepth / 2

  const slotWidthsM = useMemo(() => computeSlotWidthsM(allModules, innerW), [allModules, innerW])
  const slotOffset   = slotWidthsM.slice(0, index).reduce((a, b) => a + b, 0)
  const moduleWidth  = slotWidthsM.slice(index, index + span).reduce((a, b) => a + b, 0)
  const thisSlotW    = slotWidthsM[index] ?? moduleWidth
  const nextSlotW    = slotWidthsM[index + 1] ?? thisSlotW
  const centerX      = moduleWidth / 2

  const leftWallXOuter  = sideWallM + slotOffset
  const rightWallXOuter = sideWallM + slotOffset + moduleWidth

  const isLastModule = index + span === moduleCount

  // ========================
  // BACK DIAGONAL case
  // ========================
  const isBackDiag = p.backDiagonal

  // Module group is at worldZ = WALL (inner face of corpus back panel).
  // module-local z=0 → worldZ=WALL (back), z=moduleDepth → worldZ=WALL+moduleDepth (front)
  const hBack = isBackDiag
    ? Math.max(0, Math.min(trapNaN(getBackDiagHeightAtZ(WALL, p), `Module${index}-hBack-raw`), p.moduleCapY) - MODULE_FLOOR_Y - WALL)
    : 0
  const hFront = isBackDiag
    ? Math.max(0, Math.min(trapNaN(getBackDiagHeightAtZ(WALL + moduleDepth, p), `Module${index}-hFront-raw`), p.moduleCapY) - MODULE_FLOOR_Y - WALL)
    : 0
  trapNaN(hBack, `Module${index}-hBack`)
  trapNaN(hFront, `Module${index}-hFront`)
  const flatH = p.moduleCapY - MODULE_FLOOR_Y - WALL

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
      ? depthRun * (p.moduleCapY - p.backDiagKinkHeight) / heightDrop
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
  const runLeft   = p.sideWallThickness + p.leftDiagTopWidth
  const runRight  = p.sideWallThickness + p.rightDiagTopWidth
  const lenLeft   = Math.sqrt(riseLeft  * riseLeft  + runLeft  * runLeft)
  const lenRight  = Math.sqrt(riseRight * riseRight + runRight * runRight)

  const leftWallH  = wallHeightAt(leftWallXOuter,  p) + (hasLeftDiag  ? WALL * (riseLeft  + runLeft  - lenLeft)  / runLeft  : 0)
  const rightWallH = wallHeightAt(rightWallXOuter, p) + (hasRightDiag ? WALL * (riseRight + runRight - lenRight) / runRight : 0)

  // roofY: min ceiling height for content placement
  const roofY = isBackDiag ? hBack : Math.min(leftWallH, rightWallH)

  // Load all element GLBs to get their bboxes (drei's useGLTF accepts string[]).
  // Use a sentinel path for the empty case to keep the hook call shape stable.
  const elementPaths = useMemo(() => layout.elements.map((e) => e.glbPath), [layout])
  const SENTINEL = '/objects/onderstel.glb'
  const pathsForLoad = elementPaths.length > 0 ? elementPaths : [SENTINEL]
  const loaded = useGLTF(pathsForLoad)
  const elementBboxes = useMemo<ElementBbox[]>(() => {
    if (elementPaths.length === 0) return []
    const arr = Array.isArray(loaded) ? loaded : [loaded]
    return arr.map((g) => {
      const b = new THREE.Box3().setFromObject(g.scene.clone(true))
      return { minY: b.min.y, maxY: b.max.y }
    })
  }, [loaded, elementPaths])

  const { elementYs, fillAbove, fillBelow } = resolveElementPositions(layout, roofY, elementBboxes)

  const roofProfile = useMemo(() => {
    if (isBackDiag) return []  // not used for back diagonal
    const profile = computeRoofProfile(leftWallXOuter, rightWallXOuter, p)
    profile[0] = { ...profile[0], y: leftWallH }
    profile[profile.length - 1] = { ...profile[profile.length - 1], y: rightWallH }
    return profile
  }, [isBackDiag, leftWallXOuter, rightWallXOuter, p, leftWallH, rightWallH])

  const midXOuter        = leftWallXOuter + thisSlotW
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
    // Degenerate first segment (kink near module edge): fall back to a flat
    // wall at leftWallH instead of dividing by ~0.
    const hRight = Math.abs(denom) < 1e-6
      ? leftWallH
      : innerProfile[0].y + ((MODULE_WALL - innerProfile[0].x) / denom) * (innerProfile[1].y - innerProfile[0].y)
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
    const hLeft = Math.abs(denom) < 1e-6
      ? rightWallH
      : innerProfile[n - 2].y + ((moduleWidth - MODULE_WALL - innerProfile[n - 2].x) / denom) * (innerProfile[n - 1].y - innerProfile[n - 2].y)
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
      p.sideWallThickness + p.leftDiagTopWidth > leftWallXOuter &&
      p.sideWallThickness + p.leftDiagTopWidth < rightWallXOuter) ||
    ((p.diagonalSide === 'right' || p.diagonalSide === 'both') &&
      p.rightDiagTopWidth > 0 &&
      p.outerWidth - p.sideWallThickness - p.rightDiagTopWidth > leftWallXOuter &&
      p.outerWidth - p.sideWallThickness - p.rightDiagTopWidth < rightWallXOuter)
  const fillToTop = moduleHasDiag && !hasKinkInRange
  const mirrorDoor = mirrorProp ?? (isBackDiag
    ? (index % 2 === 1 || isLastModule)
    : (moduleHasDiag ? leftWallH < rightWallH : (index % 2 === 1 || isLastModule)))

  // Door profile for back diagonal: door covers nearly to the shell height at its front
  // face (which equals the filler-panel top edge), leaving a WALL-thickness gap below.
  // With TC active, cap at mainHeight so the main-corpus door ends where TC begins.
  // Door is intentionally NOT capped at moduleCapY — that cap is for module geometry only.
  const bdDoorProfile = useMemo((): Array<{ x: number; y: number }> => {
    if (!isBackDiag) return []
    const rawH = trapNaN(getBackDiagHeightAtZ(WALL + moduleDepth, p), `Module${index}-bdDoor-raw`)
    const h = Math.max(0, (needsTop ? Math.min(rawH, p.mainHeight) : rawH) - MODULE_FLOOR_Y - WALL)
    return [{ x: 0, y: h }, { x: thisSlotW, y: h }]
  }, [isBackDiag, moduleDepth, needsTop, p, thisSlotW])

  const startX = -innerW / 2
  const x      = startX + slotOffset

  return (
    <ModuleMaterialOverrideProvider
      buitenkantMaterialId={moduleSlot?.buitenkantMaterialId}
      binnenkantMaterialId={moduleSlot?.binnenkantMaterialId}
    >
    <group position={[x, MODULE_FLOOR_Y, groupZ]}>
      {layout.elements.map((el, i) => (
        <SpecialElement
          key={`${el.glbPath}-${i}`}
          element={el}
          targetWidth={moduleWidth - MODULE_WALL * 2}
          targetDepth={contentDepth}
          positionY={elementYs[i]}
          hovered={hoveredSlot === index}
          hasDoor={hasDoor}
        />
      ))}

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

      {/* Plug hole circle mesh */}
      {moduleSlot?.hasPowerHole && (
        <mesh position={[centerX, 0.1, MODULE_WALL + 0.001]}>
          <circleGeometry args={[0.04, 32]} />
          <meshStandardMaterial color="#888" roughness={0.8} metalness={0} />
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
          key={isBackDiag ? 'door-bd' : 'door-sd'}
          moduleHeight={isBackDiag ? hFront : roofY}
          slotW={thisSlotW}
          moduleDepth={moduleDepth}
          doorsOpen={doorsOpen}
          doorHandleId={doorHandleId}
          doorHandleMaterial={doorHandleMaterial}
          doorHandleBodyColor={doorHandleBodyColor}
          doorHandleMeshId={doorHandleMeshId}
          doorHandleHeightCm={doorHandleHeightCm}
          mirror={mirrorDoor}
          extendToFloor={doorsExtendToFloor}
          topProfile={isBackDiag ? bdDoorProfile : doorProfile}
        />
      )}
      {hasDoor && span === 2 && (
        <>
          <Door
            key="door-L"
            moduleHeight={isBackDiag ? hFront : Math.min(leftDoorProfile[0].y, leftDoorProfile[leftDoorProfile.length - 1].y)}
            slotW={thisSlotW}
            moduleDepth={moduleDepth}
            doorsOpen={doorsOpen}
            doorHandleId={doorHandleId}
            doorHandleMaterial={doorHandleMaterial}
          doorHandleBodyColor={doorHandleBodyColor}
          doorHandleMeshId={doorHandleMeshId}
          doorHandleHeightCm={doorHandleHeightCm}
            extendToFloor={doorsExtendToFloor}
            topProfile={isBackDiag ? bdDoorProfile : leftDoorProfile}
          />
          <group position={[thisSlotW, 0, 0]}>
            <Door
              key="door-R"
              moduleHeight={isBackDiag ? hFront : Math.min(rightDoorProfile[0].y, rightDoorProfile[rightDoorProfile.length - 1].y)}
              slotW={nextSlotW}
              moduleDepth={moduleDepth}
              doorsOpen={doorsOpen}
              doorHandleId={doorHandleId}
              doorHandleMaterial={doorHandleMaterial}
          doorHandleBodyColor={doorHandleBodyColor}
          doorHandleMeshId={doorHandleMeshId}
          doorHandleHeightCm={doorHandleHeightCm}
              mirror
              extendToFloor={doorsExtendToFloor}
              topProfile={isBackDiag ? bdDoorProfile : rightDoorProfile}
            />
          </group>
        </>
      )}
    </group>
    </ModuleMaterialOverrideProvider>
  )
}
