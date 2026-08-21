'use client'

import { useRef, useEffect, useMemo } from 'react'
import * as THREE from 'three/webgpu'
import gsap from 'gsap'
import { useClosetStore } from '../store'
import ClosetMaterial from '../../_shared/materials/ClosetMaterial'
import { Model as HingeModel } from '../../_shared/objects/Hinge'
import { FILLER_FLAT_SEC_THRESHOLD, getBackDiagHeightAtZ, getFullDiagHeightAt } from './diagonalUtils'
import type { DiagParams } from './diagonalUtils'
import { trapShape, trapGeo, trapNaN } from '@/utils/debugGeometry'

const WALL = 0.018
const DOOR_DEPTH = 0.018
const SPACE = 0.001
const CLOSET_INSIDE_INSET = 0.025
const SIDE_WALL_EXTRA = 0.005  // must match ClosetCorpus.tsx
const HINGE_EDGE_OFFSET = 0.08


// TC wall height at x from outer left, in TC-local coords (y=0 = mainH world).
// Mirrors wallHeightAt() in Module.tsx — subtracts floor (mainH) and one ceiling WALL.
function tcWallHeightAt(x: number, p: DiagParams, mainH: number, closetH: number): number {
  return Math.max(0, getFullDiagHeightAt(x, p, closetH) - mainH - WALL)
}

// ---------------------------------------------------------------------------
// TC ceiling profile — identical approach to computeRoofProfile() in Module.tsx.
// Returns profile points in SLOT-LOCAL x coords (x=0 is slot left edge).
// ---------------------------------------------------------------------------
function computeTCRoofProfile(
  lx: number,  // slot left x from outer left
  rx: number,  // slot right x from outer left
  p: DiagParams,
  mainH: number,
  closetH: number,
): Array<{ x: number; y: number }> {
  const flatH = closetH - mainH - WALL  // flat-zone ceiling outer-face height (TC-local)

  // Kink points where the extended diagonal transitions to flat within this slot.
  // Uses outer face formula: x = where the diagonal outer face reaches closetH,
  // same as ClosetCorpus topRunLeft — so TC kink aligns exactly with corpus top panel.
  const kinks: Array<{ x: number; y: number }> = []

  if ((p.diagonalSide === 'left' || p.diagonalSide === 'both') &&
      p.leftDiagTopWidth > 0 && p.mainHeight > p.leftDiagStartHeight) {
    const scale = (closetH - p.leftDiagStartHeight) / (p.mainHeight - p.leftDiagStartHeight)
    const kx = (p.sideWallThickness + p.leftDiagTopWidth) * scale   // matches ClosetCorpus topRunLeft
    if (kx > lx && kx < rx) kinks.push({ x: kx, y: flatH })
  }

  if ((p.diagonalSide === 'right' || p.diagonalSide === 'both') &&
      p.rightDiagTopWidth > 0 && p.mainHeight > p.rightDiagStartHeight) {
    const scale = (closetH - p.rightDiagStartHeight) / (p.mainHeight - p.rightDiagStartHeight)
    const kx = p.outerWidth - (p.sideWallThickness + p.rightDiagTopWidth) * scale   // matches ClosetCorpus topRunRight
    if (kx > lx && kx < rx) kinks.push({ x: kx, y: flatH })
  }

  const edges = [lx, rx].map(x => ({ x, y: tcWallHeightAt(x, p, mainH, closetH) }))

  return [...edges, ...kinks]
    .sort((a, b) => a.x - b.x)
    .map(({ x, y }) => ({ x: x - lx, y }))
}

// ---------------------------------------------------------------------------
// Perpendicular inward offset — identical to offsetProfileInward() in Module.tsx.
// ---------------------------------------------------------------------------
function offsetProfileInward(
  outer: Array<{ x: number; y: number }>,
  thickness: number,
): Array<{ x: number; y: number }> {
  const n = outer.length
  const segs = outer.slice(0, -1).map((pt, i) => {
    const q = outer[i + 1]
    const dx = q.x - pt.x
    const dy = q.y - pt.y
    const len = Math.sqrt(dx * dx + dy * dy)
    if (len < 1e-9) return { dx: 1, dy: 0, nx: 0, ny: -thickness }
    return { dx: dx / len, dy: dy / len, nx: (thickness * dy) / len, ny: (-thickness * dx) / len }
  })
  const inner: Array<{ x: number; y: number }> = []
  inner.push({ x: outer[0].x + segs[0].nx, y: outer[0].y + segs[0].ny })
  for (let i = 1; i < n - 1; i++) {
    const s1 = segs[i - 1], s2 = segs[i]
    const dnx = s1.nx - s2.nx, dny = s1.ny - s2.ny
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

// ---------------------------------------------------------------------------
// Filler panel — covers the triangular/trapezoidal opening in TC slots that are
// too short for a full TopCabinetSlot (side diagonal only). Front face flush with
// TC doors. Top edge follows the inner ceiling face (innerProfile) so the angle
// matches where the diagonal wall ends inside. Includes floor, back wall, and
// side walls to close the full space.
// ---------------------------------------------------------------------------
interface FillerPanelProps {
  slotW: number
  moduleDepth: number
  roofProfile: Array<{ x: number; y: number }>
  diagCutLeft: number   // slot-local x where left diagonal wall hits y=0 (bottom of TC space)
  diagCutRight: number  // slot-local x where right diagonal wall hits y=0
}

function TCFillerPanel({ slotW, moduleDepth, roofProfile, diagCutLeft, diagCutRight }: FillerPanelProps) {
  const leftH  = roofProfile[0].y
  const rightH = roofProfile[roofProfile.length - 1].y

  const innerProfile = useMemo(() => offsetProfileInward(roofProfile, WALL), [roofProfile])

  // Front panel(s) — only the diagonal portion(s) of the profile.
  // When the kink falls within the slot, the profile includes a flat zone at maxY.
  // We skip that flat zone so the panel ends exactly at the diagonal wall intersection.
  const diagPanelGeos = useMemo(() => {
    const maxY = roofProfile.reduce((m, pt) => Math.max(m, pt.y), 0)
    const eps  = 1e-4

    // Index of first / last interior point that has reached maxY (kink points).
    let firstKinkIdx = -1
    for (let i = 1; i < roofProfile.length; i++) {
      if (roofProfile[i].y >= maxY - eps) { firstKinkIdx = i; break }
    }
    let lastKinkIdx = -1
    for (let i = roofProfile.length - 2; i >= 0; i--) {
      if (roofProfile[i].y >= maxY - eps) { lastKinkIdx = i; break }
    }

    const buildGeo = (pts: Array<{ x: number; y: number }>, label: string) => {
      const bLeft  = Math.max(pts[0].x, diagCutLeft)
      const bRight = Math.min(pts[pts.length - 1].x, diagCutRight)
      const leftY  = bLeft  > pts[0].x               ? 0 : pts[0].y
      const rightY = bRight < pts[pts.length - 1].x  ? 0 : pts[pts.length - 1].y
      const shape = new THREE.Shape()
      shape.moveTo(bLeft, -WALL)
      shape.lineTo(bRight, -WALL)
      shape.lineTo(bRight, rightY)
      for (let i = pts.length - 2; i >= 1; i--) {
        if (pts[i].x > bLeft && pts[i].x < bRight) shape.lineTo(pts[i].x, pts[i].y)
      }
      shape.lineTo(bLeft, leftY)
      shape.closePath()
      const geo = new THREE.ExtrudeGeometry(trapShape(shape, label), { depth: DOOR_DEPTH, bevelEnabled: false })
      return trapGeo(geo, label + '-geo')
    }

    const geos: THREE.BufferGeometry[] = []

    // Left diagonal: profile rises from left edge (low) up to firstKinkIdx.
    const hasLeftKink = firstKinkIdx > 0 &&
      firstKinkIdx < roofProfile.length - 1 &&
      roofProfile[0].y < maxY - eps
    // Right diagonal: profile rises from right edge (low) up to lastKinkIdx.
    const hasRightKink = lastKinkIdx > 0 &&
      lastKinkIdx < roofProfile.length - 1 &&
      roofProfile[roofProfile.length - 1].y < maxY - eps

    if (hasLeftKink)  geos.push(buildGeo(roofProfile.slice(0, firstKinkIdx + 1), 'TCFiller-leftDiag'))
    if (hasRightKink) geos.push(buildGeo(roofProfile.slice(lastKinkIdx),          'TCFiller-rightDiag'))
    // No interior kink — full profile (original single-panel behaviour).
    if (!hasLeftKink && !hasRightKink) geos.push(buildGeo(roofProfile, 'TCFiller-full'))

    return geos
  }, [roofProfile])

  // Left wall — only when leftH > WALL (matches TopCabinetSlot logic).
  const leftWallGeo = useMemo(() => {
    if (leftH <= WALL || innerProfile.length < 2) return null
    const denom = innerProfile[1].x - innerProfile[0].x
    if (Math.abs(denom) < 1e-9) return null
    const t = (WALL - innerProfile[0].x) / denom
    const hRight = innerProfile[0].y + t * (innerProfile[1].y - innerProfile[0].y)
    const shape = new THREE.Shape()
    shape.moveTo(0, 0)
    shape.lineTo(WALL, 0)
    shape.lineTo(WALL, hRight)
    shape.lineTo(0, leftH)
    shape.closePath()
    return trapGeo(new THREE.ExtrudeGeometry(trapShape(shape, 'TCFiller-leftWall'), { depth: moduleDepth, bevelEnabled: false }), 'TCFiller-leftWall-geo')
  }, [leftH, innerProfile, moduleDepth])

  // Right wall — only when rightH > WALL.
  const rightWallGeo = useMemo(() => {
    if (rightH <= WALL || innerProfile.length < 2) return null
    const n = innerProfile.length
    const denom = innerProfile[n - 1].x - innerProfile[n - 2].x
    if (Math.abs(denom) < 1e-9) return null
    const t = (slotW - WALL - innerProfile[n - 2].x) / denom
    const hLeft = innerProfile[n - 2].y + t * (innerProfile[n - 1].y - innerProfile[n - 2].y)
    const shape = new THREE.Shape()
    shape.moveTo(slotW - WALL, 0)
    shape.lineTo(slotW, 0)
    shape.lineTo(slotW, rightH)
    shape.lineTo(slotW - WALL, hLeft)
    shape.closePath()
    return trapGeo(new THREE.ExtrudeGeometry(trapShape(shape, 'TCFiller-rightWall'), { depth: moduleDepth, bevelEnabled: false }), 'TCFiller-rightWall-geo')
  }, [rightH, slotW, innerProfile, moduleDepth])

  return (
    <>
      {/* Front panel(s) — buitenkant, flush with TC doors, diagonal portions only */}
      {diagPanelGeos.map((geo, idx) => (
        <mesh key={idx} position={[0, 0, moduleDepth]} castShadow receiveShadow>
          <primitive object={geo} attach="geometry" />
          <ClosetMaterial />
        </mesh>
      ))}
      {leftWallGeo && (
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <primitive object={leftWallGeo} attach="geometry" />
          <ClosetMaterial variant="binnenkant" />
        </mesh>
      )}
      {rightWallGeo && (
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <primitive object={rightWallGeo} attach="geometry" />
          <ClosetMaterial variant="binnenkant" />
        </mesh>
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Per-slot component (side-diagonal / flat case — unchanged)
// ---------------------------------------------------------------------------
interface SlotProps {
  slotW: number
  moduleDepth: number
  roofProfile: Array<{ x: number; y: number }>
  leftH: number    // = roofProfile[0].y — used for left divider height
  rightH: number   // = roofProfile[last].y — used for right divider height
  flatH: number    // full TC interior height (flat zone) — for middle shelf
  doorsOpen: boolean
  mirror: boolean
}

export function TopCabinetSlot({
  slotW, moduleDepth, roofProfile, leftH, rightH, flatH, doorsOpen, mirror,
}: SlotProps) {
  const pivotRef = useRef<any>(null)
  const posRef   = useRef<any>(null)

  const innerProfile = useMemo(
    () => offsetProfileInward(roofProfile, WALL),
    [roofProfile],
  )

  const roofGeo = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(roofProfile[0].x, roofProfile[0].y)
    for (let i = 1; i < roofProfile.length; i++) shape.lineTo(roofProfile[i].x, roofProfile[i].y)
    for (let i = innerProfile.length - 1; i >= 0; i--) shape.lineTo(innerProfile[i].x, innerProfile[i].y)
    shape.closePath()
    return trapGeo(new THREE.ExtrudeGeometry(trapShape(shape, 'TCSlot-roofGeo'), { depth: moduleDepth, bevelEnabled: false }), 'TCSlot-roofGeo-geo')
  }, [roofProfile, innerProfile, moduleDepth])

  const backWallGeo = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(0, 0)
    shape.lineTo(slotW, 0)
    for (let i = roofProfile.length - 1; i >= 0; i--) shape.lineTo(roofProfile[i].x, roofProfile[i].y)
    shape.closePath()
    return trapGeo(new THREE.ExtrudeGeometry(trapShape(shape, 'TCSlot-backWall'), { depth: WALL, bevelEnabled: false }), 'TCSlot-backWall-geo')
  }, [roofProfile, slotW])

  const leftWallGeo = useMemo(() => {
    if (leftH <= WALL) return null
    if (innerProfile.length < 2) return null
    const denom = innerProfile[1].x - innerProfile[0].x
    trapNaN(denom, 'TCSlot-leftWall-denom')
    const t = (WALL - innerProfile[0].x) / denom
    const hRight = innerProfile[0].y + t * (innerProfile[1].y - innerProfile[0].y)
    trapNaN(hRight, 'TCSlot-leftWall-hRight')
    const shape = new THREE.Shape()
    shape.moveTo(0, 0)
    shape.lineTo(WALL, 0)
    shape.lineTo(WALL, hRight)
    shape.lineTo(0, leftH)
    shape.closePath()
    return trapGeo(new THREE.ExtrudeGeometry(trapShape(shape, 'TCSlot-leftWall'), { depth: moduleDepth, bevelEnabled: false }), 'TCSlot-leftWall-geo')
  }, [leftH, innerProfile, moduleDepth])

  const rightWallGeo = useMemo(() => {
    if (rightH <= WALL) return null
    if (innerProfile.length < 2) return null
    const n = innerProfile.length
    const denom = innerProfile[n - 1].x - innerProfile[n - 2].x
    trapNaN(denom, 'TCSlot-rightWall-denom')
    const t = (slotW - WALL - innerProfile[n - 2].x) / denom
    const hLeft = innerProfile[n - 2].y + t * (innerProfile[n - 1].y - innerProfile[n - 2].y)
    trapNaN(hLeft, 'TCSlot-rightWall-hLeft')
    const shape = new THREE.Shape()
    shape.moveTo(slotW - WALL, 0)
    shape.lineTo(slotW, 0)
    shape.lineTo(slotW, rightH)
    shape.lineTo(slotW - WALL, hLeft)
    shape.closePath()
    return trapGeo(new THREE.ExtrudeGeometry(trapShape(shape, 'TCSlot-rightWall'), { depth: moduleDepth, bevelEnabled: false }), 'TCSlot-rightWall-geo')
  }, [rightH, slotW, innerProfile, moduleDepth])

  // Door — polygon whose top edge follows the roofProfile so it matches the module opening
  // exactly: rectangular in the flat zone, trapezoidal in the diagonal zone.
  const usableH = Math.min(leftH, rightH)
  const hasDoor = slotW > WALL * 4 && usableH > WALL * 4

  const doorGeo = useMemo(() => {
    if (!hasDoor) return null
    const shape = new THREE.Shape()
    shape.moveTo(SPACE, -WALL + SPACE)
    shape.lineTo(slotW - SPACE, -WALL + SPACE)
    shape.lineTo(slotW - SPACE, roofProfile[roofProfile.length - 1].y - SPACE)
    for (let i = roofProfile.length - 2; i >= 1; i--) {
      const pt = roofProfile[i]
      const x = Math.max(SPACE, Math.min(slotW - SPACE, pt.x))
      shape.lineTo(x, pt.y - SPACE)
    }
    shape.lineTo(SPACE, roofProfile[0].y - SPACE)
    shape.closePath()
    const geo = new THREE.ExtrudeGeometry(trapShape(shape, 'TCSlot-door'), { depth: DOOR_DEPTH, bevelEnabled: false })
    geo.translate(-slotW / 2, 0, -DOOR_DEPTH / 2)
    return trapGeo(geo, 'TCSlot-door-geo')
  }, [hasDoor, slotW, roofProfile])

  useEffect(() => {
    if (!pivotRef.current || !posRef.current) return
    gsap.to(pivotRef.current.rotation, {
      y: doorsOpen ? (mirror ? Math.PI * 0.475 : -Math.PI * 0.475) : 0,
      duration: 0.6,
      ease: 'power2.inOut',
    })
    gsap.to(posRef.current.position, {
      x: doorsOpen ? (mirror ? -0.005 : 0.005) : 0,
      z: doorsOpen ? -0.025 : 0,
      duration: 0.6,
      ease: 'power2.inOut',
    })
  }, [doorsOpen, mirror])

  const pivotX = mirror ? slotW : 0
  const panelX = mirror ? -slotW / 2 : slotW / 2
  const hingeX = mirror ? slotW - WALL - 0.01 : WALL + 0.01

  // Hinges at the pivot edge — clamped to the height at that edge
  const hingeEdgeH = mirror ? rightH : leftH
  const hingeYs = useMemo(() => {
    const maxH = hingeEdgeH - SPACE
    return [-WALL + HINGE_EDGE_OFFSET, hingeEdgeH - HINGE_EDGE_OFFSET].filter((y) => y > -WALL && y < maxH)
  }, [hingeEdgeH])

  // Flat zone: both edges at full height — add a middle shelf.
  const isFlat = leftH >= flatH - WALL * 0.5 && rightH >= flatH - WALL * 0.5
  const shelfY = flatH / 2

  return (
    <>
      {/* Ceiling — ExtrudeGeometry following the diagonal profile */}
      <mesh position={[0, 0, 0]} geometry={roofGeo} castShadow receiveShadow>
        <ClosetMaterial variant="binnenkant" />
      </mesh>

      {/* Back wall — polygon matching the ceiling profile */}
      <mesh position={[0, 0, 0]} geometry={backWallGeo} castShadow receiveShadow>
        <ClosetMaterial variant="binnenkant" />
      </mesh>

      {/* Left divider — trapezoid matching ceiling inner face */}
      {leftWallGeo && (
        <mesh position={[0, 0, 0]} geometry={leftWallGeo} castShadow receiveShadow>
          <ClosetMaterial variant="binnenkant" />
        </mesh>
      )}

      {/* Right divider — trapezoid matching ceiling inner face */}
      {rightWallGeo && (
        <mesh position={[0, 0, 0]} geometry={rightWallGeo} castShadow receiveShadow>
          <ClosetMaterial variant="binnenkant" />
        </mesh>
      )}

      {/* Floor — lowered by WALL so bottom face meets module roof top face (no gap) */}
      <mesh position={[slotW / 2, -WALL / 2, moduleDepth / 2]} castShadow receiveShadow>
        <boxGeometry args={[slotW, WALL, moduleDepth]} />
        <ClosetMaterial variant="binnenkant" />
      </mesh>

      {/* Middle shelf — only in flat-zone slots */}
      {isFlat && (
        <mesh position={[slotW / 2, shelfY, moduleDepth / 2]} castShadow receiveShadow>
          <boxGeometry args={[slotW, WALL, moduleDepth]} />
          <ClosetMaterial variant="binnenkant" />
        </mesh>
      )}

      {/* Door */}
      {hasDoor && doorGeo && (
        <group ref={pivotRef} position={[pivotX, 0, moduleDepth]}>
          <group ref={posRef}>
            <mesh position={[panelX, 0, DOOR_DEPTH / 2]} castShadow receiveShadow>
              <primitive object={doorGeo} attach="geometry" />
              <ClosetMaterial />
            </mesh>
          </group>
        </group>
      )}

      {/* Hinges */}
      {hasDoor && hingeYs.map((y, i) => (
        <HingeModel
          key={i}
          position={[hingeX, y, moduleDepth - 0.03]}
          doorsOpen={doorsOpen}
        />
      ))}
    </>
  )
}

// ---------------------------------------------------------------------------
// Back-diagonal TC slot interior.
//
// The back diagonal slope is ONE continuous slope shared by main corpus and TC.
// The TC occupies Y from mainH to closetHeight. In TC-local coords (Y=0 = mainH),
// the ceiling follows the slope from Y=0 at tcBack_local up to ceilH-mainH at
// the flat section start, then flat.
//
// Coordinate convention for divider/ceiling geometry:
//   x_shape = -(TC-group-local-z) — NEGATIVE z, matching Module.tsx bdRoofGeo/bdSideWallGeo.
// After rotateY(PI/2): (x_shape, y, z_ext) → (z_ext, y, -x_shape) = (z_ext, y, z_local).
// Left divider at [0, 0, 0] → x ∈ [0, WALL] ✓
// Right divider at [slotW-WALL, 0, 0] → x ∈ [slotW-WALL, slotW] ✓
// ---------------------------------------------------------------------------
interface BackDiagSlotProps {
  slotW: number
  tcBack_local: number  // TC-local z where TC starts (ceiling height = 0)
  tcSlotDepth: number   // usable depth: from tcBack_local to slot front
  doorCeilH: number     // structural ceiling height at slot front (for hasDoor check + hinges)
  doorTopH: number      // door panel top (extended to cover filler + DOOR_TOP_GAP when filler active)
  dividerGeo: THREE.BufferGeometry | null  // shared trapezoid divider geometry
  ceilGeo: THREE.BufferGeometry | null     // shared ceiling panel following the shell
  shellAtHingeZ: number  // TC-local ceiling height at hinge z position (for hinge clearance)
  doorsOpen: boolean
  mirror: boolean
}

function BackDiagTCSlot({
  slotW, tcBack_local, tcSlotDepth, doorCeilH, doorTopH, dividerGeo, ceilGeo, shellAtHingeZ, doorsOpen, mirror,
}: BackDiagSlotProps) {
  const pivotRef = useRef<any>(null)
  const posRef   = useRef<any>(null)

  const z_front = tcBack_local + tcSlotDepth
  const hasDoor = slotW > WALL * 4 && doorCeilH > WALL * 4

  // Rectangular door — ceiling is flat in X for back diagonal.
  const doorGeo = useMemo(() => {
    if (!hasDoor) return null
    trapNaN(doorTopH, 'BackDiagTCSlot-doorTopH')
    const shape = new THREE.Shape()
    shape.moveTo(SPACE, -WALL + SPACE)
    shape.lineTo(slotW - SPACE, -WALL + SPACE)
    shape.lineTo(slotW - SPACE, doorTopH - SPACE)
    shape.lineTo(SPACE, doorTopH - SPACE)
    shape.closePath()
    const geo = new THREE.ExtrudeGeometry(trapShape(shape, 'BackDiagTCSlot-door'), { depth: DOOR_DEPTH, bevelEnabled: false })
    geo.translate(-slotW / 2, 0, -DOOR_DEPTH / 2)
    return trapGeo(geo, 'BackDiagTCSlot-door-geo')
  }, [hasDoor, slotW, doorTopH])

  useEffect(() => {
    if (!pivotRef.current || !posRef.current) return
    gsap.to(pivotRef.current.rotation, {
      y: doorsOpen ? (mirror ? Math.PI * 0.475 : -Math.PI * 0.475) : 0,
      duration: 0.6,
      ease: 'power2.inOut',
    })
    gsap.to(posRef.current.position, {
      x: doorsOpen ? (mirror ? -0.005 : 0.005) : 0,
      z: doorsOpen ? -0.025 : 0,
      duration: 0.6,
      ease: 'power2.inOut',
    })
  }, [doorsOpen, mirror])

  const pivotX = mirror ? slotW : 0
  const panelX = mirror ? -slotW / 2 : slotW / 2
  const hingeX = mirror ? slotW - WALL - 0.01 : WALL + 0.01

  // Bug 3b: top hinge clamped to shell ceiling at hinge Z position (not just doorCeilH at front).
  // The hinge sits 0.03m inside from the door front face, where the shell is slightly lower.
  const topHingeY = Math.min(doorCeilH, shellAtHingeZ) - HINGE_EDGE_OFFSET
  const hingeYs = useMemo(() => {
    const maxH = doorCeilH - SPACE
    return [-WALL + HINGE_EDGE_OFFSET, topHingeY].filter((y) => y > -WALL && y < maxH)
  }, [doorCeilH, topHingeY])

  return (
    <>
      {/* Ceiling panel — Bug 1: interior face of the diagonal shell, binnenkant material */}
      {ceilGeo && (
        <mesh position={[0, 0, 0]} geometry={ceilGeo} castShadow receiveShadow>
          <ClosetMaterial variant="binnenkant" />
        </mesh>
      )}

      {/* Left divider — Bug 2 fix: position [0,0,0] so geo (new_x=z_ext∈[0,WALL]) → x∈[0,WALL] */}
      {dividerGeo && (
        <mesh position={[0, 0, 0]} geometry={dividerGeo} castShadow receiveShadow>
          <ClosetMaterial variant="binnenkant" />
        </mesh>
      )}

      {/* Right divider — Bug 2 fix: position [slotW-WALL,0,0] → x∈[slotW-WALL,slotW] */}
      {dividerGeo && (
        <mesh position={[slotW - WALL, 0, 0]} geometry={dividerGeo} castShadow receiveShadow>
          <ClosetMaterial variant="binnenkant" />
        </mesh>
      )}

      {/* Floor — lowered by WALL so bottom face meets module roof top face (no gap) */}
      <mesh
        position={[slotW / 2, -WALL / 2, tcBack_local + tcSlotDepth / 2]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[slotW, WALL, tcSlotDepth]} />
        <ClosetMaterial variant="binnenkant" />
      </mesh>

      {/* Door */}
      {hasDoor && doorGeo && (
        <group ref={pivotRef} position={[pivotX, 0, z_front]}>
          <group ref={posRef}>
            <mesh position={[panelX, 0, DOOR_DEPTH / 2]} castShadow receiveShadow>
              <primitive object={doorGeo} attach="geometry" />
              <ClosetMaterial />
            </mesh>
          </group>
        </group>
      )}

      {/* Hinges */}
      {hasDoor && hingeYs.map((y, i) => (
        <HingeModel
          key={i}
          position={[hingeX, y, z_front - 0.03]}
          doorsOpen={doorsOpen}
        />
      ))}
    </>
  )
}

// ---------------------------------------------------------------------------
// TC LED strip constants (match _shared/three/LightStrips.tsx)
// ---------------------------------------------------------------------------
const STRIP_DEPTH_FROM_FRONT = 0.10
const STRIP_WIDTH  = 0.015
const STRIP_COLOR  = '#ffad5c'
const WALL_OFFSET  = 0.001
const STRIP_MARGIN = 0.01

interface TCStripInstance {
  position: THREE.Vector3
  rotY: number
  height: number
}

interface TCLightStripsProps {
  moduleCount: number
  slotW: number
  moduleDepth: number
  innerW: number
  p: DiagParams
  mainH: number
  ceilH: number
  doorCeilH: number
  tcBack_local: number
  tcSlotDepth: number
}

function TCLightStrips({
  moduleCount, slotW, moduleDepth, innerW, p, mainH, ceilH,
  doorCeilH, tcBack_local, tcSlotDepth,
}: TCLightStripsProps) {
  const lightStripsEnabled = useClosetStore((s) => s.lightStripsEnabled)
  const doorsOpen          = useClosetStore((s) => s.doorsOpen)
  const meshRef = useRef<THREE.InstancedMesh>(null!)

  const strips = useMemo<TCStripInstance[]>(() => {
    if (!lightStripsEnabled || !doorsOpen) return []

    const stripZ = moduleDepth - STRIP_DEPTH_FROM_FRONT
    const result: TCStripInstance[] = []

    for (let i = 0; i < moduleCount; i++) {
      const x = -innerW / 2 + i * slotW

      let leftH: number
      let rightH: number
      if (p.backDiagonal) {
        if (tcSlotDepth < STRIP_DEPTH_FROM_FRONT + 0.01) continue
        leftH = rightH = doorCeilH
      } else {
        const lx = p.sideWallThickness + i * slotW
        const rx = lx + slotW
        leftH  = tcWallHeightAt(lx, p, mainH, ceilH)
        rightH = tcWallHeightAt(rx, p, mainH, ceilH)
      }

      const leftStripH = leftH - STRIP_MARGIN * 2
      if (leftStripH >= 0.01) {
        result.push({
          position: new THREE.Vector3(x + WALL + WALL_OFFSET, STRIP_MARGIN + leftStripH / 2, stripZ),
          rotY: Math.PI / 2,
          height: leftStripH,
        })
      }
      const rightStripH = rightH - STRIP_MARGIN * 2
      if (rightStripH >= 0.01) {
        result.push({
          position: new THREE.Vector3(x + slotW - WALL - WALL_OFFSET, STRIP_MARGIN + rightStripH / 2, stripZ),
          rotY: -Math.PI / 2,
          height: rightStripH,
        })
      }
    }

    return result
  }, [lightStripsEnabled, doorsOpen, moduleCount, slotW, moduleDepth, innerW, p, mainH, ceilH, doorCeilH, tcBack_local, tcSlotDepth])

  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    const q = new THREE.Quaternion()
    const matrix = new THREE.Matrix4()
    strips.forEach((s, i) => {
      q.setFromEuler(new THREE.Euler(0, s.rotY, 0))
      matrix.compose(s.position, q, new THREE.Vector3(STRIP_WIDTH, s.height, 1))
      mesh.setMatrixAt(i, matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  }, [strips])

  if (strips.length === 0) return null

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, strips.length]}>
      <planeGeometry args={[1, 1]} />
      <meshStandardMaterial
        color={STRIP_COLOR}
        emissive={STRIP_COLOR}
        emissiveIntensity={8}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function TopCabinet() {
  const needsTop    = useClosetStore((s) => s.needsTopCabinet())
  const mainHCm     = useClosetStore((s) => s.mainHeight())
  const mainH       = mainHCm / 100
  const height      = useClosetStore((s) => s.height) / 100
  const width       = useClosetStore((s) => s.width) / 100
  const depth       = useClosetStore((s) => s.depth) / 100
  const moduleCount = useClosetStore((s) => s.moduleCount)
  const doorsOpen   = useClosetStore((s) => s.doorsOpen)

  const sidePanelThickness      = useClosetStore((s) => s.sidePanelThickness)
  const sideWallThicknessM      = sidePanelThickness === '36mm' ? 0.036 : 0.018
  const diagonalSide            = useClosetStore((s) => s.diagonalSide)
  const leftDiagStartHeightCm   = useClosetStore((s) => s.leftDiagStartHeight)
  const rightDiagStartHeightCm  = useClosetStore((s) => s.rightDiagStartHeight)
  const leftDiagTopWidthCm      = useClosetStore((s) => s.leftDiagTopWidth)
  const rightDiagTopWidthCm     = useClosetStore((s) => s.rightDiagTopWidth)
  const backDiagonal            = useClosetStore((s) => s.backDiagonal)
  const backDiagKinkHeightCm    = useClosetStore((s) => s.backDiagKinkHeight)
  const backDiagFlatSectionDepthCm = useClosetStore((s) => s.backDiagFlatSectionDepth)

  // Build DiagParams the same way ClosetCorpus does.
  const p = useMemo<DiagParams>(() => ({
    diagonalSide,
    leftDiagStartHeight:  Math.min(leftDiagStartHeightCm,  mainHCm - 20) / 100,
    rightDiagStartHeight: Math.min(rightDiagStartHeightCm, mainHCm - 20) / 100,
    leftDiagTopWidth:  leftDiagTopWidthCm  / 100,
    rightDiagTopWidth: rightDiagTopWidthCm / 100,
    outerWidth:        width,
    mainHeight:        mainH,
    closetHeight:      height,
    backDiagonal,
    backDiagKinkHeight:        backDiagKinkHeightCm        / 100,
    backDiagFlatSectionDepth:  backDiagFlatSectionDepthCm  / 100,
    outerDepth:                depth,
    moduleCapY:                mainH,
    sideWallThickness:         sideWallThicknessM,
  }), [diagonalSide, leftDiagStartHeightCm, rightDiagStartHeightCm, leftDiagTopWidthCm, rightDiagTopWidthCm, width, mainHCm, mainH, height, backDiagonal, backDiagKinkHeightCm, backDiagFlatSectionDepthCm, depth, sideWallThicknessM])

  // ---------------------------------------------------------------------------
  // All derived values and hooks must be declared BEFORE any early return
  // ---------------------------------------------------------------------------
  const innerW      = width - sideWallThicknessM * 2
  const slotW       = innerW / moduleCount
  const moduleDepth = depth - WALL - CLOSET_INSIDE_INSET

  // Back diagonal derived values
  const kinkH   = p.backDiagKinkHeight
  const flatSec = p.backDiagFlatSectionDepth
  const slopeDepth = depth - flatSec

  // Effective ceiling height for the TC (outer face Y in world space).
  // When filler active (backDiag + flatSec=0), TC modules top at fillerBottomY
  // so the filler panel closes off the wedge above them.
  const fillerActive = backDiagonal && flatSec < FILLER_FLAT_SEC_THRESHOLD
  const ceilH = fillerActive
    ? getBackDiagHeightAtZ(depth - 0.15, p)
    : height - SIDE_WALL_EXTRA

  const worldZ_cross = backDiagonal && height > kinkH && mainH > kinkH
    ? slopeDepth * (mainH - kinkH) / (height - kinkH)
    : 0
  const tcBack_local = Math.max(0, worldZ_cross - WALL)
  const tcSlotDepth = depth - WALL - CLOSET_INSIDE_INSET - tcBack_local
  const innerCeilH = fillerActive ? ceilH - mainH : ceilH - mainH - WALL
  // TC-local z where the diagonal shell crosses ceilH (= fillerBottomY when filler active).
  // Adds a kink to ceiling and divider profiles so they flatten at innerCeilH from that point forward.
  const tcFillerCrossingLZ = fillerActive && (height - kinkH) > 0.001
    ? slopeDepth * (ceilH - kinkH) / (height - kinkH) - WALL
    : -1
  const worldZ_slotFront = depth - CLOSET_INSIDE_INSET
  const doorCeilH = (() => {
    if (!backDiagonal) return innerCeilH
    if (worldZ_slotFront >= depth - flatSec) return innerCeilH
    const Y_outer = kinkH + (height - kinkH) * worldZ_slotFront / slopeDepth
    // Clamp to innerCeilH so filler-active case caps TC module height at fillerBottomY.
    return Math.max(0, Math.min(Y_outer - mainH - WALL, innerCeilH))
  })()

  // tcSlopePanelGeo removed — the unified slope panel in ClosetCorpus covers the full shell
  // from kinkH (back) to closetHeight (flatStart), so no separate TC slope panel is needed.

  const tcDividerGeo = useMemo(() => {
    if (!backDiagonal || tcSlotDepth <= WALL * 2) return null
    if (doorCeilH <= WALL) return null
    // Bug 2 fix: use NEGATIVE x_shape (x_shape = -z_local) so after rotateY(PI/2)
    // new_z = -x_shape = z_local → geometry spans z ∈ [tcBack_local, moduleDepth] ✓
    // (positive x_shape would map to negative z, placing dividers behind the back wall)
    const xBack  = tcBack_local
    const xFront = moduleDepth
    trapNaN(doorCeilH, 'TC-tcDivider-doorCeilH')
    trapNaN(innerCeilH, 'TC-tcDivider-innerCeilH')
    const shape = new THREE.Shape()
    shape.moveTo(-xBack,  0)
    shape.lineTo(-xFront, 0)
    shape.lineTo(-xFront, doorCeilH)
    if (fillerActive) {
      if (tcFillerCrossingLZ > xBack + 0.001 && tcFillerCrossingLZ < xFront - 0.001) {
        shape.lineTo(-tcFillerCrossingLZ, innerCeilH)
      }
    } else if (flatSec > 0) {
      const xFlatStart = depth - flatSec - WALL
      if (xFlatStart > xBack && xFlatStart < xFront) {
        shape.lineTo(-xFlatStart, innerCeilH)
      }
    }
    shape.closePath()
    const geo = new THREE.ExtrudeGeometry(trapShape(shape, 'TC-tcDivider'), { depth: WALL, bevelEnabled: false })
    geo.rotateY(Math.PI / 2)
    return trapGeo(geo, 'TC-tcDivider-geo')
  }, [backDiagonal, tcBack_local, moduleDepth, doorCeilH, innerCeilH, flatSec, depth, tcSlotDepth, tcFillerCrossingLZ])

  // Bug 1: TC back-diagonal ceiling panel — interior face of the shared shell.
  // Profile in TC-local z-y space (outer face), same pattern as Module.tsx bdOuterProfile.
  // x_shape = -z_local so after rotateY(PI/2): new_z = z_local ∈ [tcBack_local, moduleDepth].
  const tcBdOuterProfile = useMemo((): Array<{ x: number; y: number }> => {
    if (!backDiagonal || tcSlotDepth <= WALL * 2 || doorCeilH <= 0) return []
    const pts: Array<{ x: number; y: number }> = [{ x: tcBack_local, y: 0 }]
    if (fillerActive) {
      if (tcFillerCrossingLZ > tcBack_local + 0.001 && tcFillerCrossingLZ < moduleDepth - 0.001) {
        // Filler active: kink where shell crosses fillerBottomY; flatten at innerCeilH from there.
        pts.push({ x: tcFillerCrossingLZ, y: trapNaN(innerCeilH, 'TC-bdCeil-innerCeilH-filler') })
      }
    } else if (flatSec > 0) {
      const xFlatStart = depth - flatSec - WALL
      if (xFlatStart > tcBack_local + 0.001 && xFlatStart < moduleDepth - 0.001) {
        pts.push({ x: xFlatStart, y: trapNaN(innerCeilH, 'TC-bdCeil-innerCeilH') })
      }
    }
    pts.push({ x: moduleDepth, y: trapNaN(doorCeilH, 'TC-bdCeil-doorCeilH') })
    return pts
  }, [backDiagonal, tcBack_local, tcSlotDepth, doorCeilH, flatSec, depth, moduleDepth, innerCeilH, tcFillerCrossingLZ])

  const tcBdInnerProfile = useMemo(
    () => (tcBdOuterProfile.length < 2 ? [] : offsetProfileInward(tcBdOuterProfile, WALL)),
    [tcBdOuterProfile],
  )

  const tcBdCeilGeo = useMemo(() => {
    if (tcBdOuterProfile.length < 2 || tcBdInnerProfile.length < 2) return null
    const shape = new THREE.Shape()
    shape.moveTo(-tcBdOuterProfile[0].x, tcBdOuterProfile[0].y)
    for (let i = 1; i < tcBdOuterProfile.length; i++) {
      shape.lineTo(-tcBdOuterProfile[i].x, tcBdOuterProfile[i].y)
    }
    for (let i = tcBdInnerProfile.length - 1; i >= 0; i--) {
      shape.lineTo(-tcBdInnerProfile[i].x, tcBdInnerProfile[i].y)
    }
    shape.closePath()
    const geo = new THREE.ExtrudeGeometry(trapShape(shape, 'TC-bdCeil'), { depth: slotW, bevelEnabled: false })
    geo.rotateY(Math.PI / 2)
    return trapGeo(geo, 'TC-bdCeil-geo')
  }, [tcBdOuterProfile, tcBdInnerProfile, slotW])

  // Door panel top height.
  // When filler is active (backDiag + no flat section): extend to fillerTopHeight - WALL
  // so the TC door covers the filler panel zone. fillerTopHeight = shell at slot front face.
  // Hinges remain anchored to the structural ceiling (doorCeilH), not doorTopH.
  // When filler is not active: match the structural ceiling (doorCeilH).
  const tcDoorTopH = fillerActive ? getBackDiagHeightAtZ(worldZ_slotFront, p) - WALL - mainH : doorCeilH

  // Bug 3b: shell ceiling height at the hinge's Z position (0.03m inside door front face).
  // The hinge sits slightly behind the door front face where the shell is lower than doorCeilH.
  // Clamped to innerCeilH so filler-active case respects the reduced TC module height.
  const shellAtHingeZ = (() => {
    if (!backDiagonal) return innerCeilH
    const worldZ_hinge = depth - CLOSET_INSIDE_INSET - 0.03
    if (worldZ_hinge >= depth - flatSec) return innerCeilH
    const slopeDepthVal = depth - flatSec
    if (slopeDepthVal <= 0) return innerCeilH
    const Y_outer = kinkH + (height - kinkH) * worldZ_hinge / slopeDepthVal
    return Math.max(0, Math.min(Y_outer - mainH - WALL, innerCeilH))
  })()

  // Non-back-diagonal derived values (side diagonal / flat case)
  const flatH = ceilH - mainH - WALL
  const startX = -innerW / 2

  // Perpendicular WALL correction for filler panels — matches ClosetCorpus inner face geometry.
  // tcWallHeightAt subtracts WALL vertically; ClosetCorpus offsets perpendicular (WALL * sec θ).
  // Delta = WALL * (sec θ − 1) = WALL * (√(1 + slope²) − 1).
  const fillerWallPerpDelta = useMemo(() => {
    let delta = 0
    if ((p.diagonalSide === 'left' || p.diagonalSide === 'both') &&
        p.leftDiagTopWidth > 0 && mainH > p.leftDiagStartHeight) {
      const slope = (mainH - p.leftDiagStartHeight) / (p.sideWallThickness + p.leftDiagTopWidth)
      delta = Math.max(delta, WALL * (Math.sqrt(1 + slope * slope) - 1))
    }
    if ((p.diagonalSide === 'right' || p.diagonalSide === 'both') &&
        p.rightDiagTopWidth > 0 && mainH > p.rightDiagStartHeight) {
      const slope = (mainH - p.rightDiagStartHeight) / (p.sideWallThickness + p.rightDiagTopWidth)
      delta = Math.max(delta, WALL * (Math.sqrt(1 + slope * slope) - 1))
    }
    return delta
  }, [p, mainH])

  // Diagonal-state discriminator — mirrors Module.tsx "-bd" / "-sd-*" suffix convention.
  // Encodes full diagonal + filler state so any structural change (including fillerActive toggle)
  // forces slot group unmount+remount, clearing stale WebGPU RenderObject buffers.
  const diagVariant = backDiagonal
    ? (fillerActive ? 'bd-f' : 'bd-nf')
    : diagonalSide === 'none'
      ? 'flat'
      : diagonalSide  // 'left' | 'right' | 'both'

  if (!needsTop) return null

  return (
    <group position={[0, mainH, WALL]}>
      {/* ── Back diagonal ceiling: slope panel lives in ClosetCorpus (full shell). Flat section cap below. ── */}
      {backDiagonal && flatSec >= FILLER_FLAT_SEC_THRESHOLD && tcSlotDepth > WALL * 2 && (
        <mesh
          key="top-flat-bd"
          position={[0, (ceilH - mainH) - WALL / 2, depth - flatSec / 2 - WALL]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[width, WALL, flatSec]} />
          <ClosetMaterial />
        </mesh>
      )}

      {/* ── Per-slot content ── */}
      {Array.from({ length: moduleCount }, (_, i) => {
        const x = startX + i * slotW

        // ── Back diagonal path ──
        if (backDiagonal) {
          if (tcSlotDepth <= WALL * 2) return null
          const mirror = i % 2 === 1 || i === moduleCount - 1
          return (
            <group key={`${i}-${diagVariant}`} position={[x, 0, 0]}>
              <BackDiagTCSlot
                slotW={slotW}
                tcBack_local={tcBack_local}
                tcSlotDepth={tcSlotDepth}
                doorCeilH={doorCeilH}
                doorTopH={tcDoorTopH}
                dividerGeo={tcDividerGeo}
                ceilGeo={tcBdCeilGeo}
                shellAtHingeZ={shellAtHingeZ}
                doorsOpen={doorsOpen}
                mirror={mirror}
              />
            </group>
          )
        }

        // ── Side diagonal / flat path (existing logic) ──
        const lx = p.sideWallThickness + i * slotW
        const rx = lx + slotW

        const leftH  = tcWallHeightAt(lx, p, mainH, ceilH)
        const rightH = tcWallHeightAt(rx, p, mainH, ceilH)

        if (leftH < WALL * 2 || rightH < WALL * 2) {
          if (Math.max(leftH, rightH) <= WALL) return null
          const rawProfile = computeTCRoofProfile(lx, rx, p, mainH, ceilH)
          const fillerProfile = fillerWallPerpDelta > 0
            ? rawProfile.map(pt => ({ x: pt.x, y: Math.max(0, pt.y - fillerWallPerpDelta) }))
            : rawProfile
          const leftFullRun  = (p.diagonalSide === 'left'  || p.diagonalSide === 'both')
            ? p.sideWallThickness + p.leftDiagTopWidth : 0
          const rightFullRun = (p.diagonalSide === 'right' || p.diagonalSide === 'both')
            ? p.outerWidth - (p.sideWallThickness + p.rightDiagTopWidth) : p.outerWidth
          const diagCutLeft  = Math.max(0, leftFullRun - lx)
          const diagCutRight = Math.min(slotW, rightFullRun - lx)
          return (
            <group key={`${i}-${diagVariant}-filler`} position={[x, 0, 0]}>
              <TCFillerPanel
                slotW={slotW}
                moduleDepth={moduleDepth}
                roofProfile={fillerProfile}
                diagCutLeft={diagCutLeft}
                diagCutRight={diagCutRight}
              />
            </group>
          )
        }

        const roofProfile = computeTCRoofProfile(lx, rx, p, mainH, ceilH)

        const isLast     = i === moduleCount - 1
        const isDiagonal = Math.abs(leftH - rightH) > WALL * 0.5
        const mirror     = isDiagonal ? rightH > leftH : (i % 2 === 1 || isLast)

        return (
          <group key={`${i}-${diagVariant}`} position={[x, 0, 0]}>
            <TopCabinetSlot
              slotW={slotW}
              moduleDepth={moduleDepth}
              roofProfile={roofProfile}
              leftH={leftH}
              rightH={rightH}
              flatH={flatH}
              doorsOpen={doorsOpen}
              mirror={mirror}
            />
          </group>
        )
      })}

      <TCLightStrips
        moduleCount={moduleCount}
        slotW={slotW}
        moduleDepth={moduleDepth}
        innerW={innerW}
        p={p}
        mainH={mainH}
        ceilH={ceilH}
        doorCeilH={doorCeilH}
        tcBack_local={tcBack_local}
        tcSlotDepth={tcSlotDepth}
      />
    </group>
  )
}
