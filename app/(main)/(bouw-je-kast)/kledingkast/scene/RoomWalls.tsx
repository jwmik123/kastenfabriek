'use client'

import { useMemo } from 'react'
import * as THREE from 'three/webgpu'
import { useClosetStore } from '../store'
import { getDiagHeightAt, CORPUS_WALL } from './diagonalUtils'
import type { DiagParams } from './diagonalUtils'

export const ROOM_WALL_THICKNESS = 0.10
/** How far the floor and side walls extend in front of the closet (metres). */
export const ROOM_FORWARD = 5.0

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

/**
 * Builds a prism wall whose cross-section in the ZY plane is ptsZY,
 * extruded in the X direction from innerX to outerX.
 * Used for left/right room walls.
 * DoubleSide material is assumed — winding order matters only for normals.
 */
function buildSideWallGeo(
  ptsZY: [number, number][],
  innerX: number,
  outerX: number,
): THREE.BufferGeometry {
  const n = ptsZY.length
  const verts: number[] = []

  // Face fan at a given X value.
  // rev=false → CCW from -X (normal points +X, used for left wall outer / right wall inner).
  // rev=true  → CCW from +X (normal points -X, used for left wall inner / right wall outer).
  // With DoubleSide material both are visible; the flag controls computed normals.
  const face = (x: number, rev: boolean) => {
    for (let i = 1; i < n - 1; i++) {
      const [z0, y0] = ptsZY[0]
      const [za, ya] = ptsZY[rev ? i + 1 : i]
      const [zb, yb] = ptsZY[rev ? i : i + 1]
      verts.push(x, y0, z0, x, ya, za, x, yb, zb)
    }
  }

  // Left wall: inner at -W/2 (room side, normal +X) → rev=true
  //            outer at -W/2-T (wall-back, normal -X) → rev=false
  // Right wall: inner at +W/2 (room side, normal -X) → rev=false
  //             outer at +W/2+T (wall-back, normal +X) → rev=true
  const innerRev = outerX < innerX  // true for left wall
  face(innerX, innerRev)
  face(outerX, !innerRev)

  // Side (cap) faces
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    const [z0, y0] = ptsZY[i]
    const [z1, y1] = ptsZY[j]
    verts.push(innerX, y0, z0, outerX, y0, z0, outerX, y1, z1)
    verts.push(innerX, y0, z0, outerX, y1, z1, innerX, y1, z1)
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3))
  geo.computeVertexNormals()
  return geo
}

/**
 * Builds a prism wall whose cross-section in the XY plane is ptsXY,
 * extruded in the Z direction from innerZ to outerZ.
 * Used for the back room wall.
 * innerZ=0 (flush with closet back face), outerZ=-T (into the wall).
 */
function buildBackWallGeo(
  ptsXY: [number, number][],
  innerZ: number,
  outerZ: number,
): THREE.BufferGeometry {
  const n = ptsXY.length
  const verts: number[] = []

  // Inner face at innerZ: CCW from +Z → normal +Z (faces the room interior)
  const face = (z: number, rev: boolean) => {
    for (let i = 1; i < n - 1; i++) {
      const [x0, y0] = ptsXY[0]
      const [xa, ya] = ptsXY[rev ? i + 1 : i]
      const [xb, yb] = ptsXY[rev ? i : i + 1]
      verts.push(x0, y0, z, xa, ya, z, xb, yb, z)
    }
  }

  // innerZ=0: face room (+Z) → rev=false gives CCW from +Z → normal +Z ✓
  // outerZ=-T: face outside (-Z) → rev=true gives CCW from -Z → normal -Z ✓
  face(innerZ, false)
  face(outerZ, true)

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    const [x0, y0] = ptsXY[i]
    const [x1, y1] = ptsXY[j]
    verts.push(x0, y0, innerZ, x1, y1, innerZ, x1, y1, outerZ)
    verts.push(x0, y0, innerZ, x1, y1, outerZ, x0, y0, outerZ)
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3))
  geo.computeVertexNormals()
  return geo
}

/**
 * Builds the sloped back-diagonal "ceiling" panel.
 * Replaces the corpus backDiagSlopePanelGeo that was removed from ClosetCorpus.
 *
 * The panel inner face runs from (z=0, y=kinkH) to (z=flatStartZ, y=closetH),
 * full closet width ±T extra to cover the side wall zone.
 * Thickness T is applied along the slope's outward normal.
 */
function buildBackDiagSlopePanelGeo(
  W: number,
  kinkH: number,
  closetH: number,
  flatStartZ: number,
  T: number,
): THREE.BufferGeometry {
  const dz = flatStartZ
  const dy = closetH - kinkH
  const len = Math.sqrt(dz * dz + dy * dy)

  // Outward normal (away from room interior, perpendicular to slope in ZY):
  // Slope direction = (+dz, +dy). Rotate +90° in ZY = (-dy, +dz) / len.
  const nZ = -dy / len  // points backward (−Z)
  const nY =  dz / len  // points upward  (+Y)

  // Extend panel T beyond the closet width on each side so it fills the
  // gap in the upper corners between the side room walls and the slope panel.
  const xL = -W / 2 - T
  const xR =  W / 2 + T

  // Inner face vertices (4)
  const v = [
    xL, kinkH,         0,
    xR, kinkH,         0,
    xR, closetH, flatStartZ,
    xL, closetH, flatStartZ,
    // Outer face (offset by T along outward normal)
    xL, kinkH  + T * nY,  T * nZ,
    xR, kinkH  + T * nY,  T * nZ,
    xR, closetH + T * nY, flatStartZ + T * nZ,
    xL, closetH + T * nY, flatStartZ + T * nZ,
  ]

  const idx = [
    // inner face (CCW from below — room-interior side)
    0, 2, 1,  0, 3, 2,
    // outer face (CCW from above)
    4, 5, 6,  4, 6, 7,
    // left cap
    0, 4, 7,  0, 7, 3,
    // right cap
    1, 2, 6,  1, 6, 5,
    // back edge (z≈0)
    0, 1, 5,  0, 5, 4,
    // front edge (z≈flatStartZ)
    3, 7, 6,  3, 6, 2,
  ]

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(v), 3))
  geo.setIndex(new THREE.BufferAttribute(new Uint16Array(idx), 1))
  geo.computeVertexNormals()
  return geo
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Renders a tight room shell (left wall, right wall, back wall, floor) that
 * hugs the closet's outer corpus and mirrors any active diagonal on the
 * appropriate wall, exactly matching the slope profile the corpus uses.
 *
 * Camera clamping is the primary mechanism for keeping the user inside the
 * room (see KledingkastCanvas). This component only provides the visual shell.
 *
 * Key props per diagonal-state branch force unmount+remount on geometry-type
 * changes to avoid the WebGPU stale-RenderObject bug (cached GPU buffers
 * pointing to old geometry → "Vertex attribute position not found" errors).
 */
export default function RoomWalls() {
  const widthCm   = useClosetStore(s => s.width)
  const heightCm  = useClosetStore(s => s.height)
  const depthCm   = useClosetStore(s => s.depth)
  const mainHCm   = useClosetStore(s => s.mainHeight())
  const needsTop  = useClosetStore(s => s.needsTopCabinet())

  const diagonalSide           = useClosetStore(s => s.diagonalSide)
  const leftDiagStartHeightCm  = useClosetStore(s => s.leftDiagStartHeight)
  const rightDiagStartHeightCm = useClosetStore(s => s.rightDiagStartHeight)
  const leftDiagTopWidthCm     = useClosetStore(s => s.leftDiagTopWidth)
  const rightDiagTopWidthCm    = useClosetStore(s => s.rightDiagTopWidth)
  const placementType          = useClosetStore(s => s.placementType)
  const backDiagonal           = useClosetStore(s => s.backDiagonal)
  const backDiagKinkHeightCm   = useClosetStore(s => s.backDiagKinkHeight)
  const backDiagFlatSecCm      = useClosetStore(s => s.backDiagFlatSectionDepth)

  const W     = widthCm  / 100
  const H     = heightCm / 100
  const D     = depthCm  / 100
  const mainH = mainHCm  / 100
  const T     = ROOM_WALL_THICKNESS
  const RF    = ROOM_FORWARD

  // SIDE_WALL_EXTRA matches the corpus constant (1.5 mm → 0.005 m in corpus
  // but stored as SIDE_WALL_EXTRA_CM = 1.5 in store). Corpus uses 0.005 in metres.
  const SIDE_WALL_EXTRA = 0.005
  const topH = needsTop ? H + SIDE_WALL_EXTRA : mainH

  const p = useMemo<DiagParams>(() => ({
    diagonalSide,
    leftDiagStartHeight:  Math.min(leftDiagStartHeightCm,  mainHCm - 20) / 100,
    rightDiagStartHeight: Math.min(rightDiagStartHeightCm, mainHCm - 20) / 100,
    leftDiagTopWidth:  leftDiagTopWidthCm  / 100,
    rightDiagTopWidth: rightDiagTopWidthCm / 100,
    outerWidth:        W,
    mainHeight:        mainH,
    closetHeight:      H,
    backDiagonal,
    backDiagKinkHeight:        backDiagKinkHeightCm / 100,
    backDiagFlatSectionDepth:  backDiagFlatSecCm    / 100,
    outerDepth:                D,
  }), [
    diagonalSide, leftDiagStartHeightCm, rightDiagStartHeightCm,
    leftDiagTopWidthCm, rightDiagTopWidthCm,
    mainHCm, W, H, D, mainH,
    backDiagonal, backDiagKinkHeightCm, backDiagFlatSecCm,
  ])

  const isVrijstaand = placementType === 'vrijstaand'

  const hasLeft  = diagonalSide === 'left'  || diagonalSide === 'both'
  const hasRight = diagonalSide === 'right' || diagonalSide === 'both'

  // In vrijstaand, extend floor/ceiling/back-wall to the full scene width.
  // Side walls are absent, so the remaining surfaces span RF on each side.
  const sceneHalfW = isVrijstaand ? W / 2 + RF : W / 2
  const floorW     = isVrijstaand ? W + 2 * RF  : W + 2 * T

  const kinkH      = p.backDiagKinkHeight
  const flatSec    = p.backDiagFlatSectionDepth
  // flatStartZ: world Z where the slope reaches full closet height.
  // Matches getBackDiagHeightAtZ: flatStartZ = outerDepth - backDiagFlatSectionDepth.
  const flatStartZ = D - flatSec

  // ── Left wall ─────────────────────────────────────────────────────────────
  // ZY cross-section polygon for the left room wall.
  // World: back of closet = z=0, front = z=D, floor = y=0.
  // Extends to z=-T to fill the back-left corner behind the back room wall.
  const leftWallGeo = useMemo(() => {
    if (backDiagonal) {
      // Closet zone follows diagonal profile; room extension adds flat strip at H
      // from z=D out to z=D+RF before the profile starts.
      const pts: [number, number][] = [
        [-T, 0], [D + RF, 0], [D + RF, H], [D, topH],
        ...(flatSec > 0.001 ? [[flatStartZ, topH] as [number, number]] : []),
        [0, kinkH],
        [-T, kinkH],
      ]
      return buildSideWallGeo(pts, -W / 2, -W / 2 - T)
    }
    // Side diagonal or straight: rectangle with room extension at full height H.
    const h = hasLeft ? p.leftDiagStartHeight : H
    const pts: [number, number][] = [[-T, 0], [D + RF, 0], [D + RF, H], [D, h], [-T, h]]
    return buildSideWallGeo(pts, -W / 2, -W / 2 - T)
  }, [backDiagonal, hasLeft, W, H, D, T, RF, kinkH, flatSec, flatStartZ, topH, p.leftDiagStartHeight])

  // ── Right wall ────────────────────────────────────────────────────────────
  const rightWallGeo = useMemo(() => {
    if (backDiagonal) {
      const pts: [number, number][] = [
        [-T, 0], [D + RF, 0], [D + RF, H], [D, topH],
        ...(flatSec > 0.001 ? [[flatStartZ, topH] as [number, number]] : []),
        [0, kinkH],
        [-T, kinkH],
      ]
      return buildSideWallGeo(pts, W / 2, W / 2 + T)
    }
    const h = hasRight ? p.rightDiagStartHeight : H
    const pts: [number, number][] = [[-T, 0], [D + RF, 0], [D + RF, H], [D, h], [-T, h]]
    return buildSideWallGeo(pts, W / 2, W / 2 + T)
  }, [backDiagonal, hasRight, W, H, D, T, RF, kinkH, flatSec, flatStartZ, topH, p.rightDiagStartHeight])

  // ── Back wall ──────────────────────────────────────────────────────────────
  // XY cross-section polygon (world X = width axis, Y = height axis).
  // Inner face at z=0 (flush with closet outer back face), outer at z=-T.
  // Spans x from -W/2 to W/2 (inner gap between side walls — no double overlap).
  const backWallGeo = useMemo(() => {
    if (backDiagonal) {
      // Straight rectangle at kinkH: the slope panel covers the upper portion.
      return buildBackWallGeo(
        [[-sceneHalfW, 0], [sceneHalfW, 0], [sceneHalfW, kinkH], [-sceneHalfW, kinkH]],
        0, -T,
      )
    }

    // vrijstaand always has no side diagonals — simple wide rectangle.
    if (isVrijstaand) {
      return buildBackWallGeo(
        [[-sceneHalfW, 0], [sceneHalfW, 0], [sceneHalfW, mainH], [-sceneHalfW, mainH]],
        0, -T,
      )
    }

    // Mirror corpus BackWall shape exactly (same logic as ClosetCorpus BackWall).
    const leftStartH  = getDiagHeightAt(0, p)
    const rightStartH = getDiagHeightAt(W, p)
    const leftTopX    = hasLeft  ? CORPUS_WALL + p.leftDiagTopWidth  : 0
    const rightTopX   = hasRight ? W - CORPUS_WALL - p.rightDiagTopWidth : W

    const pts: [number, number][] = [[-W / 2, 0], [W / 2, 0], [W / 2, rightStartH]]
    if (hasRight) {
      pts.push([rightTopX - W / 2, mainH])
    } else if (rightStartH < mainH - 1e-6) {
      pts.push([W / 2, mainH])
    }
    pts.push([leftTopX - W / 2, mainH])
    if (hasLeft) {
      pts.push([-W / 2, leftStartH])
    }

    return buildBackWallGeo(pts, 0, -T)
  }, [backDiagonal, isVrijstaand, sceneHalfW, W, mainH, kinkH, p, hasLeft, hasRight, T])

  // ── Back diagonal slope panel ──────────────────────────────────────────────
  // Replaces the corpus backDiagSlopePanelGeo that was removed from ClosetCorpus.
  // Connects the top of the back room wall (z=0, y=kinkH) to the full-height
  // ceiling (z=flatStartZ, y=H). This is the sloped attic ceiling visible from
  // inside the closet when looking toward the back wall.
  const backDiagSlopeGeo = useMemo(() => {
    if (!backDiagonal) return null
    const dy = H - kinkH
    if (dy < 0.001 || flatStartZ < 0.001) return null
    const slopeW = isVrijstaand ? W + 2 * RF : W
    return buildBackDiagSlopePanelGeo(slopeW, kinkH, H, flatStartZ, T)
  }, [backDiagonal, isVrijstaand, W, H, kinkH, flatStartZ, T, RF])

  // ── Materials ──────────────────────────────────────────────────────────────
  // DoubleSide ensures correct visibility regardless of polygon winding,
  // which differs between left/right walls. Cost is negligible for 4 panels.
  const wallMat = useMemo(
    () => new THREE.MeshStandardMaterial({
      color: '#f5f0e8',
      roughness: 0.9,
      metalness: 0,
      side: THREE.DoubleSide,
    }),
    [],
  )
  const floorMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#efe9d7', roughness: 0.9, metalness: 0 }),
    [],
  )

  // Key strings encode the geometry-type branch so React unmounts + remounts
  // the mesh when the branch changes. This is required to avoid the WebGPU
  // stale-RenderObject bug where cached GPU buffers point to old geometry.
  const diagKey = `${diagonalSide}-${backDiagonal ? 'bd' : 'sd'}`

  return (
    <group>
      {/* Left room wall — hidden when vrijstaand */}
      {placementType === 'ingebouwd' && (
        <mesh
          key={`left-${diagKey}`}
          geometry={leftWallGeo}
          material={wallMat}
          receiveShadow
          castShadow={false}
        />
      )}

      {/* Right room wall — hidden when vrijstaand */}
      {placementType === 'ingebouwd' && (
        <mesh
          key={`right-${diagKey}`}
          geometry={rightWallGeo}
          material={wallMat}
          receiveShadow
          castShadow={false}
        />
      )}

      {/* Back room wall (vertical portion) */}
      <mesh
        key={`back-${diagKey}`}
        geometry={backWallGeo}
        material={wallMat}
        receiveShadow
        castShadow={false}
      />

      {/* Back diagonal slope panel — replaces removed corpus backDiagSlopePanelGeo */}
      {backDiagonal && backDiagSlopeGeo && (
        <mesh
          key={`slope-${diagKey}`}
          geometry={backDiagSlopeGeo}
          material={wallMat}
          receiveShadow
          castShadow={false}
        />
      )}

      {/* Floor — spans z[-T … D+RF], x[-floorW/2 … floorW/2] */}
      <mesh
        position={[0, -T / 2, (D + RF - T) / 2]}
        receiveShadow
        castShadow={false}
      >
        <boxGeometry args={[floorW, T, D + T + RF]} />
        <primitive object={floorMat} attach="material" />
      </mesh>

      {/* Ceiling — inner face at y=H, spans same footprint as floor */}
      <mesh
        position={[0, H + T / 2, (D + RF - T) / 2]}
        receiveShadow
        castShadow={false}
      >
        <boxGeometry args={[floorW, T, D + T + RF]} />
        <primitive object={wallMat} attach="material" />
      </mesh>
    </group>
  )
}
