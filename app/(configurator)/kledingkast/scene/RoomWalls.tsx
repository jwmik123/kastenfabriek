'use client'

import { useMemo } from 'react'
import * as THREE from 'three/webgpu'
import { useClosetStore } from '../store'
import { getDiagHeightAt, CORPUS_WALL } from './diagonalUtils'
import type { DiagParams } from './diagonalUtils'

export const ROOM_WALL_THICKNESS = 0.01
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
  // Inner face only — no outer face, no caps. Invisible from outside with FrontSide.
  // Left wall (outerX < innerX): rev=true → normal +X (faces room interior)
  // Right wall (outerX > innerX): rev=false → normal -X (faces room interior)
  const rev = outerX < innerX
  for (let i = 1; i < n - 1; i++) {
    const [z0, y0] = ptsZY[0]
    const [za, ya] = ptsZY[rev ? i + 1 : i]
    const [zb, yb] = ptsZY[rev ? i : i + 1]
    verts.push(innerX, y0, z0, innerX, ya, za, innerX, yb, zb)
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
): THREE.BufferGeometry {
  const n = ptsXY.length
  const verts: number[] = []
  // Inner face only — normal +Z (faces room interior). Invisible from behind with FrontSide.
  for (let i = 1; i < n - 1; i++) {
    const [x0, y0] = ptsXY[0]
    const [xa, ya] = ptsXY[i]
    const [xb, yb] = ptsXY[i + 1]
    verts.push(x0, y0, innerZ, xa, ya, innerZ, xb, yb, innerZ)
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
/**
 * Inner face only — vertical strip from y=0→diagStartH + sloped strip from diagStartH→height.
 * Both faces visible from the room interior (left wall: normal +X, right wall: normal −X).
 * Winding verified by cross-product so FrontSide material renders the correct side.
 */
function buildDiagSideWallInnerFace(
  diagStartH: number,
  slopeTopX: number,
  height: number,
  xInner: number,
  zBack: number,
  zFront: number,
  isLeft: boolean,
): THREE.BufferGeometry {
  const zB = zBack
  const zF = zFront
  const xS = isLeft ? xInner + slopeTopX : xInner - slopeTopX

  const v: number[] = []

  if (isLeft) {
    // Vertical face: normal +X — triangles [P1,P3,P2] and [P1,P4,P3]
    v.push(
      xInner, 0,          zB,
      xInner, diagStartH, zF,
      xInner, 0,          zF,
      xInner, 0,          zB,
      xInner, diagStartH, zB,
      xInner, diagStartH, zF,
    )
    // Slope face: normal (rise,−topX,0) — triangles [S1,S3,S2] and [S1,S4,S3]
    v.push(
      xInner, diagStartH, zB,
      xS,     height,     zF,
      xInner, diagStartH, zF,
      xInner, diagStartH, zB,
      xS,     height,     zB,
      xS,     height,     zF,
    )
  } else {
    // Vertical face: normal −X — triangles [P1,P2,P3] and [P1,P3,P4]
    v.push(
      xInner, 0,          zB,
      xInner, 0,          zF,
      xInner, diagStartH, zF,
      xInner, 0,          zB,
      xInner, diagStartH, zF,
      xInner, diagStartH, zB,
    )
    // Slope face: normal (−rise,−topX,0) — triangles [R1,R2,R3] and [R1,R3,R4]
    v.push(
      xInner, diagStartH, zB,
      xInner, diagStartH, zF,
      xS,     height,     zF,
      xInner, diagStartH, zB,
      xS,     height,     zF,
      xS,     height,     zB,
    )
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(v), 3))
  geo.computeVertexNormals()
  return geo
}

function buildBackDiagSlopePanelGeo(
  W: number,
  kinkH: number,
  closetH: number,
  flatStartZ: number,
): THREE.BufferGeometry {
  const xL = -W / 2
  const xR =  W / 2

  // Inner face vertices (4)
  // Winding flipped so the surface normal points down-and-forward into the room
  // interior (visible from inside the closet looking up-and-back with FrontSide).
  const v = [
    xL, kinkH,   0,
    xR, kinkH,   0,
    xR, closetH, flatStartZ,
    xL, closetH, flatStartZ,
  ]
  const idx = [0, 1, 2,  0, 2, 3]

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
  // Forward extension: 4× closet width — always exceeds max camera distance (3.5× W)
  // regardless of aspect ratio or closet size. Negligible render cost for simple boxes.
  const RF    = W * 4

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
    moduleCapY:                mainH,
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
  // Side walls are absent; surfaces span 3× closet width sideways so edges never appear in view.
  const vrijstaandSideExt = W * 3
  const sceneHalfW = isVrijstaand ? W / 2 + vrijstaandSideExt : W / 2
  const floorW     = isVrijstaand ? W + 2 * vrijstaandSideExt  : W + 2 * T

  const kinkH      = p.backDiagKinkHeight
  const flatSec    = p.backDiagFlatSectionDepth
  // flatStartZ: world Z where the slope reaches full closet height.
  // Matches getBackDiagHeightAtZ: flatStartZ = outerDepth - backDiagFlatSectionDepth.
  const flatStartZ = D - flatSec

  // Horizontal reach of each diagonal slope when extrapolated to y=H (ceiling height).
  // Uses the same slope angle as the corpus (defined by mainH and stored topWidth).
  // Shared by wall shapes and ceiling trim so they meet exactly.
  const leftSlopeTopX = useMemo(() => {
    if (!hasLeft || backDiagonal) return 0
    const dSH = p.leftDiagStartHeight
    const fullRun = CORPUS_WALL + p.leftDiagTopWidth
    return mainH > dSH ? fullRun * (H - dSH) / (mainH - dSH) : fullRun
  }, [hasLeft, backDiagonal, p.leftDiagStartHeight, p.leftDiagTopWidth, H, mainH])

  const rightSlopeTopX = useMemo(() => {
    if (!hasRight || backDiagonal) return 0
    const dSH = p.rightDiagStartHeight
    const fullRun = CORPUS_WALL + p.rightDiagTopWidth
    return mainH > dSH ? fullRun * (H - dSH) / (mainH - dSH) : fullRun
  }, [hasRight, backDiagonal, p.rightDiagStartHeight, p.rightDiagTopWidth, H, mainH])

  // ── Left wall ─────────────────────────────────────────────────────────────
  // When a side diagonal is active: XY-plane shape (width × height) extruded
  // along Z. Slope ends at y=H so it meets the ceiling flush.
  // Otherwise: ZY-plane rectangle extruded at x = -W/2.
  const leftWallGeo = useMemo(() => {
    if (backDiagonal) {
      const pts: [number, number][] = [
        [-T, 0], [D + RF, 0], [D + RF, H], [flatStartZ, H],
        [0, kinkH],
        [-T, kinkH],
      ]
      return buildSideWallGeo(pts, -W / 2, -W / 2 - T)
    }
    if (hasLeft) {
      return buildDiagSideWallInnerFace(
        p.leftDiagStartHeight, leftSlopeTopX, H, -W / 2, -T, D + RF, true,
      )
    }
    const pts: [number, number][] = [[-T, 0], [D + RF, 0], [D + RF, H], [-T, H]]
    return buildSideWallGeo(pts, -W / 2, -W / 2 - T)
  }, [backDiagonal, hasLeft, W, H, D, T, RF, kinkH, flatStartZ, p.leftDiagStartHeight, leftSlopeTopX])

  // ── Right wall ────────────────────────────────────────────────────────────
  const rightWallGeo = useMemo(() => {
    if (backDiagonal) {
      const pts: [number, number][] = [
        [-T, 0], [D + RF, 0], [D + RF, H], [flatStartZ, H],
        [0, kinkH],
        [-T, kinkH],
      ]
      return buildSideWallGeo(pts, W / 2, W / 2 + T)
    }
    if (hasRight) {
      return buildDiagSideWallInnerFace(
        p.rightDiagStartHeight, rightSlopeTopX, H, W / 2, -T, D + RF, false,
      )
    }
    const pts: [number, number][] = [[-T, 0], [D + RF, 0], [D + RF, H], [-T, H]]
    return buildSideWallGeo(pts, W / 2, W / 2 + T)
  }, [backDiagonal, hasRight, W, H, D, T, RF, kinkH, flatStartZ, p.rightDiagStartHeight, rightSlopeTopX])

  // ── Back wall ──────────────────────────────────────────────────────────────
  // XY cross-section polygon (world X = width axis, Y = height axis).
  // Inner face at z=0 (flush with closet outer back face), outer at z=-T.
  // Spans x from -W/2 to W/2 (inner gap between side walls — no double overlap).
  const backWallGeo = useMemo(() => {
    if (backDiagonal) {
      // Straight rectangle at kinkH: the slope panel covers the upper portion.
      return buildBackWallGeo(
        [[-sceneHalfW, 0], [sceneHalfW, 0], [sceneHalfW, kinkH], [-sceneHalfW, kinkH]],
        0,
      )
    }

    // vrijstaand always has no side diagonals — simple wide rectangle.
    if (isVrijstaand) {
      return buildBackWallGeo(
        [[-sceneHalfW, 0], [sceneHalfW, 0], [sceneHalfW, H], [-sceneHalfW, H]],
        0,
      )
    }

    // No side diagonals — simple rectangle to full closet height.
    if (!hasLeft && !hasRight) {
      return buildBackWallGeo(
        [[-W / 2, 0], [W / 2, 0], [W / 2, H], [-W / 2, H]],
        0,
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

    return buildBackWallGeo(pts, 0)
  }, [backDiagonal, isVrijstaand, sceneHalfW, W, H, mainH, kinkH, p, hasLeft, hasRight])

  // ── Back diagonal slope panel ──────────────────────────────────────────────
  // Replaces the corpus backDiagSlopePanelGeo that was removed from ClosetCorpus.
  // Connects the top of the back room wall (z=0, y=kinkH) to the full-height
  // ceiling (z=flatStartZ, y=H). This is the sloped attic ceiling visible from
  // inside the closet when looking toward the back wall.
  const backDiagSlopeGeo = useMemo(() => {
    if (!backDiagonal) return null
    const dy = H - kinkH
    if (dy < 0.001 || flatStartZ < 0.001) return null
    const slopeW = isVrijstaand ? W + 2 * vrijstaandSideExt : W
    return buildBackDiagSlopePanelGeo(slopeW, kinkH, H, flatStartZ)
  }, [backDiagonal, isVrijstaand, W, H, kinkH, flatStartZ, T, RF])

  // ── Ceiling ────────────────────────────────────────────────────────────────
  // Trimmed so it starts where each diagonal slope ends (x = ±W/2 ± slopeTopX).
  // With no diagonals: full-width box identical to the old static geometry.
  const ceilingGeo = useMemo(() => {
    const xLeft  = hasLeft  && !backDiagonal && !isVrijstaand ? -W / 2 + leftSlopeTopX  : -floorW / 2
    const xRight = hasRight && !backDiagonal && !isVrijstaand ? W / 2 - rightSlopeTopX  :  floorW / 2
    const ceilW = Math.max(0.001, xRight - xLeft)
    const geo = new THREE.BoxGeometry(ceilW, T, D + T + RF)
    geo.translate((xLeft + xRight) / 2, 0, 0)
    return geo
  }, [hasLeft, hasRight, backDiagonal, isVrijstaand, W, T, D, RF, floorW, leftSlopeTopX, rightSlopeTopX])

  // ── Materials ──────────────────────────────────────────────────────────────
  // DoubleSide ensures correct visibility regardless of polygon winding,
  // which differs between left/right walls. Cost is negligible for 4 panels.
  const wallMat = useMemo(
    () => new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 0.9,
      metalness: 0,
      side: THREE.FrontSide,
    }),
    [],
  )
  const floorMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9, metalness: 0 }),
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

      {/* Ceiling — trimmed where side diagonals are active */}
      <mesh
        key={`ceil-${diagKey}`}
        position={[0, H + T / 2, (D + RF - T) / 2]}
        geometry={ceilingGeo}
        material={wallMat}
        receiveShadow
        castShadow={false}
      />
    </group>
  )
}
