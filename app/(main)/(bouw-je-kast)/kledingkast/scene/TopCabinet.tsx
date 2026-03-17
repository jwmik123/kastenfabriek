'use client'

import { useRef, useEffect, useMemo } from 'react'
import * as THREE from 'three/webgpu'
import gsap from 'gsap'
import { useClosetStore } from '../store'
import ClosetMaterial from '../../_shared/materials/ClosetMaterial'
import { Model as HingeModel } from '../../_shared/objects/Hinge'
import { CORPUS_WALL } from './diagonalUtils'
import type { DiagParams } from './diagonalUtils'

const WALL = 0.018
const DOOR_DEPTH = 0.018
const SPACE = 0.001
const CLOSET_INSIDE_INSET = 0.025
const SIDE_WALL_EXTRA = 0.005  // must match ClosetCorpus.tsx
const HINGE_EDGE_OFFSET = 0.08

// ---------------------------------------------------------------------------
// Height of the TC ceiling outer face at x (from outer left).
// Uses the OUTER face formula — same geometry as ClosetCorpus's diagonal
// panel outer face and topRunLeft calculation — so the kink point lands at
// exactly the same X as the corpus top panel left edge.
// ---------------------------------------------------------------------------
function getFullDiagHeightAt(x: number, p: DiagParams, closetH: number): number {
  let h = closetH

  if (p.diagonalSide === 'left' || p.diagonalSide === 'both') {
    if (p.leftDiagTopWidth > 0 && p.mainHeight > p.leftDiagStartHeight) {
      const fullRun = CORPUS_WALL + p.leftDiagTopWidth   // outer face runs from x=0 to fullRun at mainH
      const t = x / fullRun
      const hDiag = p.leftDiagStartHeight + (p.mainHeight - p.leftDiagStartHeight) * Math.max(0, t)
      if (hDiag < closetH) h = Math.min(h, hDiag)
    }
  }

  if (p.diagonalSide === 'right' || p.diagonalSide === 'both') {
    if (p.rightDiagTopWidth > 0 && p.mainHeight > p.rightDiagStartHeight) {
      const xFromRight = p.outerWidth - x
      const fullRun = CORPUS_WALL + p.rightDiagTopWidth
      const t = xFromRight / fullRun
      const hDiag = p.rightDiagStartHeight + (p.mainHeight - p.rightDiagStartHeight) * Math.max(0, t)
      if (hDiag < closetH) h = Math.min(h, hDiag)
    }
  }

  return h
}

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
    const kx = (CORPUS_WALL + p.leftDiagTopWidth) * scale   // matches ClosetCorpus topRunLeft
    if (kx > lx && kx < rx) kinks.push({ x: kx, y: flatH })
  }

  if ((p.diagonalSide === 'right' || p.diagonalSide === 'both') &&
      p.rightDiagTopWidth > 0 && p.mainHeight > p.rightDiagStartHeight) {
    const scale = (closetH - p.rightDiagStartHeight) / (p.mainHeight - p.rightDiagStartHeight)
    const kx = p.outerWidth - (CORPUS_WALL + p.rightDiagTopWidth) * scale   // matches ClosetCorpus topRunRight
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
// Per-slot component
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

function TopCabinetSlot({
  slotW, moduleDepth, roofProfile, leftH, rightH, flatH, doorsOpen, mirror,
}: SlotProps) {
  const pivotRef = useRef<any>(null)
  const posRef   = useRef<any>(null)

  const innerProfile = useMemo(
    () => offsetProfileInward(roofProfile, WALL),
    [roofProfile],
  )

  // Ceiling panel — ExtrudeGeometry following the profile. Same construction as
  // Module.tsx roofGeo: outer face first, then inner face reversed, then close.
  const roofGeo = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(roofProfile[0].x, roofProfile[0].y)
    for (let i = 1; i < roofProfile.length; i++) shape.lineTo(roofProfile[i].x, roofProfile[i].y)
    for (let i = innerProfile.length - 1; i >= 0; i--) shape.lineTo(innerProfile[i].x, innerProfile[i].y)
    shape.closePath()
    return new THREE.ExtrudeGeometry(shape, { depth: moduleDepth, bevelEnabled: false })
  }, [roofProfile, innerProfile, moduleDepth])

  // Back wall — polygon following the ceiling profile, extruded by WALL.
  // Same construction as Module.tsx backWallGeo.
  const backWallGeo = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(0, 0)
    shape.lineTo(slotW, 0)
    for (let i = roofProfile.length - 1; i >= 0; i--) shape.lineTo(roofProfile[i].x, roofProfile[i].y)
    shape.closePath()
    return new THREE.ExtrudeGeometry(shape, { depth: WALL, bevelEnabled: false })
  }, [roofProfile, slotW])

  // Left divider — trapezoid: outer (left) face at ceiling outer-top height, inner (right)
  // face interpolated from innerProfile so the top meets the sloped ceiling with no gap.
  // Same approach as Module.tsx leftWallGeo.
  const leftWallGeo = useMemo(() => {
    if (leftH <= WALL) return null
    if (innerProfile.length < 2) return null
    const t = (WALL - innerProfile[0].x) / (innerProfile[1].x - innerProfile[0].x)
    const hRight = innerProfile[0].y + t * (innerProfile[1].y - innerProfile[0].y)
    const shape = new THREE.Shape()
    shape.moveTo(0, 0)
    shape.lineTo(WALL, 0)
    shape.lineTo(WALL, hRight)
    shape.lineTo(0, leftH)
    shape.closePath()
    return new THREE.ExtrudeGeometry(shape, { depth: moduleDepth, bevelEnabled: false })
  }, [leftH, innerProfile, moduleDepth])

  // Right divider — trapezoid: outer (right) face at ceiling outer-top height, inner (left)
  // face interpolated from innerProfile.
  const rightWallGeo = useMemo(() => {
    if (rightH <= WALL) return null
    if (innerProfile.length < 2) return null
    const n = innerProfile.length
    const t = (slotW - WALL - innerProfile[n - 2].x) / (innerProfile[n - 1].x - innerProfile[n - 2].x)
    const hLeft = innerProfile[n - 2].y + t * (innerProfile[n - 1].y - innerProfile[n - 2].y)
    const shape = new THREE.Shape()
    shape.moveTo(slotW - WALL, 0)
    shape.lineTo(slotW, 0)
    shape.lineTo(slotW, rightH)
    shape.lineTo(slotW - WALL, hLeft)
    shape.closePath()
    return new THREE.ExtrudeGeometry(shape, { depth: moduleDepth, bevelEnabled: false })
  }, [rightH, slotW, innerProfile, moduleDepth])

  // Door — polygon whose top edge follows the roofProfile so it matches the module opening
  // exactly: rectangular in the flat zone, trapezoidal in the diagonal zone.
  const usableH = Math.min(leftH, rightH)
  const hasDoor = slotW > WALL * 4 && usableH > WALL * 4

  const doorGeo = useMemo(() => {
    if (!hasDoor) return null
    const shape = new THREE.Shape()

    // Bottom edge (flat)
    shape.moveTo(SPACE, SPACE)
    shape.lineTo(slotW - SPACE, SPACE)

    // Top-right corner — ceiling height at right edge
    shape.lineTo(slotW - SPACE, roofProfile[roofProfile.length - 1].y - SPACE)

    // Interior kink points (right to left) — present when the diagonal→flat transition
    // falls inside the slot width.
    for (let i = roofProfile.length - 2; i >= 1; i--) {
      const pt = roofProfile[i]
      const x = Math.max(SPACE, Math.min(slotW - SPACE, pt.x))
      shape.lineTo(x, pt.y - SPACE)
    }

    // Top-left corner — ceiling height at left edge
    shape.lineTo(SPACE, roofProfile[0].y - SPACE)

    shape.closePath()
    const geo = new THREE.ExtrudeGeometry(shape, { depth: DOOR_DEPTH, bevelEnabled: false })
    geo.translate(-slotW / 2, 0, -DOOR_DEPTH / 2)
    return geo
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
    return [HINGE_EDGE_OFFSET, hingeEdgeH - HINGE_EDGE_OFFSET].filter((y) => y > 0 && y < maxH)
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

      {/* Floor */}
      <mesh position={[slotW / 2, WALL / 2, moduleDepth / 2]} castShadow receiveShadow>
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
        <HingeModel key={i} position={[hingeX, y, moduleDepth - 0.03]} doorsOpen={doorsOpen} />
      ))}
    </>
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

  const diagonalSide            = useClosetStore((s) => s.diagonalSide)
  const leftDiagStartHeightCm   = useClosetStore((s) => s.leftDiagStartHeight)
  const rightDiagStartHeightCm  = useClosetStore((s) => s.rightDiagStartHeight)
  const leftDiagTopWidthCm      = useClosetStore((s) => s.leftDiagTopWidth)
  const rightDiagTopWidthCm     = useClosetStore((s) => s.rightDiagTopWidth)

  // Build DiagParams the same way ClosetCorpus does.
  const p = useMemo<DiagParams>(() => ({
    diagonalSide,
    leftDiagStartHeight:  Math.min(leftDiagStartHeightCm,  mainHCm - 20) / 100,
    rightDiagStartHeight: Math.min(rightDiagStartHeightCm, mainHCm - 20) / 100,
    leftDiagTopWidth:  leftDiagTopWidthCm  / 100,
    rightDiagTopWidth: rightDiagTopWidthCm / 100,
    outerWidth:        width,
    mainHeight:        mainH,
  }), [diagonalSide, leftDiagStartHeightCm, rightDiagStartHeightCm, leftDiagTopWidthCm, rightDiagTopWidthCm, width, mainHCm, mainH])

  if (!needsTop) return null

  const innerW      = width - WALL * 2
  const slotW       = innerW / moduleCount
  const moduleDepth = depth - WALL - CLOSET_INSIDE_INSET

  // Effective ceiling height for the TC — matches ClosetCorpus top panel position.
  const ceilH = height - SIDE_WALL_EXTRA

  // Flat-zone ceiling outer-face height in TC-local coords.
  const flatH = ceilH - mainH - WALL

  // TC slots align with main corpus slots: slot i spans from
  // x=CORPUS_WALL + i*slotW to x=CORPUS_WALL + (i+1)*slotW (from outer left).
  // Group position: startX = -innerW/2 from world center.
  const startX = -innerW / 2

  return (
    <group position={[0, mainH, WALL]}>
      {Array.from({ length: moduleCount }, (_, i) => {
        const lx = CORPUS_WALL + i * slotW        // left x from outer left
        const rx = lx + slotW                     // right x from outer left

        const leftH  = tcWallHeightAt(lx, p, mainH, ceilH)
        const rightH = tcWallHeightAt(rx, p, mainH, ceilH)

        // Skip slots where either edge lacks sufficient TC height.
        // This prevents rendering modules that start in the void below the diagonal,
        // where the extended slope hasn't yet risen far enough above mainHeight.
        if (leftH < WALL * 2 || rightH < WALL * 2) return null

        const roofProfile = computeTCRoofProfile(lx, rx, p, mainH, ceilH)

        const x      = startX + i * slotW         // x from world center (TC group-local)
        const isLast = i === moduleCount - 1
        // Diagonal slots: pivot at the tallest side. Flat slots: alternate.
        const isDiagonal = Math.abs(leftH - rightH) > WALL * 0.5
        const mirror = isDiagonal ? rightH > leftH : (i % 2 === 1 || isLast)

        return (
          <group key={i} position={[x, 0, 0]}>
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
    </group>
  )
}
