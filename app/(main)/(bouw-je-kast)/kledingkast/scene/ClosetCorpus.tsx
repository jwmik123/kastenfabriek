'use client'

import { useMemo } from 'react'
import * as THREE from 'three/webgpu'
import { useClosetStore } from '../store'
import ClosetMaterial from '../../_shared/materials/ClosetMaterial'
import { getDiagHeightAt, CORPUS_WALL } from './diagonalUtils'
import type { DiagParams } from './diagonalUtils'

const WALL = 0.018
// Side walls always extend 15mm above the corpus top panel to prevent doors hitting the ceiling
const SIDE_WALL_EXTRA = 0.005

// ---------------------------------------------------------------------------
// Back wall — pentagon/hexagon shape following the diagonal silhouette
// ---------------------------------------------------------------------------
function BackWall({ width, mainH, depth, p }: {
  width: number
  mainH: number
  depth: number
  p: DiagParams
}) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape()
    const leftStartH  = getDiagHeightAt(0, p)
    const leftTopX    = (p.diagonalSide === 'left'  || p.diagonalSide === 'both') ? CORPUS_WALL + p.diagTopWidth : 0
    const rightStartH = getDiagHeightAt(width, p)
    const rightTopX   = (p.diagonalSide === 'right' || p.diagonalSide === 'both') ? width - CORPUS_WALL - p.diagTopWidth : width

    // Bottom-left → bottom-right (in XY, extruded along Z = depth)
    shape.moveTo(-width / 2, 0)
    shape.lineTo( width / 2, 0)
    // Up right side
    shape.lineTo( width / 2, rightStartH)
    // Right diagonal (if any)
    if (p.diagonalSide === 'right' || p.diagonalSide === 'both') {
      shape.lineTo(rightTopX - width / 2, mainH)
    } else {
      shape.lineTo(width / 2, mainH)
    }
    // Top flat section
    shape.lineTo(leftTopX - width / 2, mainH)
    // Left diagonal (if any)
    if (p.diagonalSide === 'left' || p.diagonalSide === 'both') {
      shape.lineTo(-width / 2, leftStartH)
    } else {
      shape.lineTo(-width / 2, mainH)
    }
    shape.closePath()

    return new THREE.ExtrudeGeometry(shape, { depth: WALL, bevelEnabled: false })
  }, [width, mainH, p])

  // ExtrudeGeometry starts at Z=0 and extrudes to Z=WALL.
  // Position at -depth/2 so the wall spans from -depth/2 to -depth/2+WALL (back of closet).
  return (
    <mesh
      position={[0, 0, -depth / 2]}
      geometry={geometry}
      castShadow
      receiveShadow
    >
      <ClosetMaterial />
    </mesh>
  )
}

// ---------------------------------------------------------------------------
// One side wall assembly: shortened straight section + optional diagonal panel
// ---------------------------------------------------------------------------
function SideWallAssembly({ side, width, mainH, height, depth, p, needsTop }: {
  side: 'left' | 'right'
  width: number
  mainH: number
  height: number
  depth: number
  p: DiagParams
  needsTop: boolean
}) {
  const isLeft = side === 'left'
  const hasDiag = p.diagonalSide === side || p.diagonalSide === 'both'
  const outerX = isLeft ? -width / 2 + WALL / 2 : width / 2 - WALL / 2

  const diagStartH = hasDiag
    ? (isLeft ? p.leftDiagStartHeight : p.rightDiagStartHeight)
    : height

  // Straight section height (with SIDE_WALL_EXTRA only when no diagonal above)
  const straightH = hasDiag ? diagStartH : height + SIDE_WALL_EXTRA

  // Diagonal panel — miter-cut ExtrudeGeometry so ends align flush with side wall and top panel.
  // Shape in XY (extruded through full Z = depth), positioned at z = -depth/2 in corpus group.
  // Outer face follows the diagonal; bottom end is vertical (butts inner face of side wall);
  // top end is vertical (butts underside of top panel).
  const diagExtrudeGeo = useMemo(() => {
    if (!hasDiag) return null
    // When a top cabinet is present, extend the diagonal at the same slope all the way
    // to the full closet height so it reads as one continuous wall.
    const topY = needsTop ? height + SIDE_WALL_EXTRA : mainH
    // The outer face runs from x=0 (outer left) to x=CORPUS_WALL+diagTopWidth at mainH.
    // Scale proportionally when topY differs from mainH (top cabinet case).
    const fullRun = CORPUS_WALL + p.diagTopWidth
    const topX = mainH > diagStartH
      ? fullRun * (topY - diagStartH) / (mainH - diagStartH)
      : fullRun
    const rise = topY - diagStartH
    const len  = Math.sqrt(topX * topX + rise * rise)
    const sinT = rise / len
    const cosT = topX / len
    const shape = new THREE.Shape()
    if (isLeft) {
      const xL = -width / 2
      const xR = -width / 2 + topX
      shape.moveTo(xL, diagStartH)
      shape.lineTo(xR, topY)
      shape.lineTo(xR + WALL * sinT, topY - WALL * cosT)
      shape.lineTo(xL + WALL * sinT, diagStartH - WALL * cosT)
    } else {
      const xL = width / 2 - topX
      const xR = width / 2
      shape.moveTo(xL, topY)
      shape.lineTo(xR, diagStartH)
      shape.lineTo(xR - WALL * sinT, diagStartH - WALL * cosT)
      shape.lineTo(xL - WALL * sinT, topY - WALL * cosT)
    }
    shape.closePath()
    return new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false })
  }, [hasDiag, isLeft, width, p.diagTopWidth, diagStartH, mainH, height, needsTop, depth])

  return (
    <>
      {/* Straight section */}
      <mesh position={[outerX, straightH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[WALL, straightH, depth]} />
        <ClosetMaterial />
      </mesh>

      {/* Diagonal panel — extends to full height when top cabinet is present */}
      {hasDiag && diagExtrudeGeo && (
        <mesh position={[0, 0, -depth / 2]} geometry={diagExtrudeGeo} castShadow receiveShadow>
          <ClosetMaterial />
        </mesh>
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Main corpus
// ---------------------------------------------------------------------------
export default function ClosetCorpus() {
  const width    = useClosetStore((s) => s.width)  / 100
  const height   = useClosetStore((s) => s.height) / 100
  const depth    = useClosetStore((s) => s.depth)  / 100
  const mainHCm  = useClosetStore((s) => s.mainHeight())
  const mainH    = mainHCm / 100
  const needsTop = useClosetStore((s) => s.needsTopCabinet())

  const diagonalSide         = useClosetStore((s) => s.diagonalSide)
  const leftDiagStartHeight  = useClosetStore((s) => s.leftDiagStartHeight)
  const rightDiagStartHeight = useClosetStore((s) => s.rightDiagStartHeight)
  const diagTopWidth         = useClosetStore((s) => s.diagTopWidth)
  const widthCm              = useClosetStore((s) => s.width)

  const p = useMemo(() => ({
    diagonalSide,
    leftDiagStartHeight:  Math.min(leftDiagStartHeight,  mainHCm - 20) / 100,
    rightDiagStartHeight: Math.min(rightDiagStartHeight, mainHCm - 20) / 100,
    diagTopWidth:  diagTopWidth / 100,
    outerWidth:    widthCm     / 100,
    mainHeight:    mainH,
  }), [diagonalSide, leftDiagStartHeight, rightDiagStartHeight, diagTopWidth, widthCm, mainHCm, mainH])

  const hasLeft  = p.diagonalSide === 'left'  || p.diagonalSide === 'both'
  const hasRight = p.diagonalSide === 'right' || p.diagonalSide === 'both'

  // When top cabinet is present, outer top panel goes to full height like a normal closet.
  // Without top cabinet (diagonal or not), panel sits flush with module roof tops at mainH.
  const topPanelY = needsTop
    ? (height - SIDE_WALL_EXTRA) - WALL / 2
    : mainH - WALL / 2

  // Top panel: trimmed by the diagonal run at the panel's actual world height.
  // Without top cabinet the run equals diagTopWidth (by definition at mainH).
  // With top cabinet the diagonal has extended further, so compute the run at topPanelWorldY.
  const topPanelWorldY = topPanelY + WALL / 2
  const topRunLeft  = hasLeft  && mainH > p.leftDiagStartHeight
    ? (CORPUS_WALL + p.diagTopWidth) * (topPanelWorldY - p.leftDiagStartHeight) / (mainH - p.leftDiagStartHeight)
    : (CORPUS_WALL + p.diagTopWidth)
  const topRunRight = hasRight && mainH > p.rightDiagStartHeight
    ? (CORPUS_WALL + p.diagTopWidth) * (topPanelWorldY - p.rightDiagStartHeight) / (mainH - p.rightDiagStartHeight)
    : (CORPUS_WALL + p.diagTopWidth)
  const topOffsetLeft   = hasLeft  ? topRunLeft  : 0
  const topOffsetRight  = hasRight ? topRunRight : 0
  const topPanelW       = width - topOffsetLeft - topOffsetRight
  const topPanelCenterX = (topOffsetLeft - topOffsetRight) / 2

  // Separator panel trimming: at mainH the diagonal inner face is at WALL + diagTopWidth from outer edge
  const sepOffsetLeft   = hasLeft  ? WALL + p.diagTopWidth : 0
  const sepOffsetRight  = hasRight ? WALL + p.diagTopWidth : 0
  const sepPanelW       = width - sepOffsetLeft - sepOffsetRight
  const sepPanelCenterX = (sepOffsetLeft - sepOffsetRight) / 2

  return (
    <group position={[0, 0, depth / 2]}>
      {/* Back wall — custom shaped */}
      <BackWall width={width} mainH={mainH} depth={depth} p={p} />

      {/* Left wall assembly */}
      <SideWallAssembly
        side="left"
        width={width}
        mainH={mainH}
        height={height}
        depth={depth}
        p={p}
        needsTop={needsTop}
      />

      {/* Right wall assembly */}
      <SideWallAssembly
        side="right"
        width={width}
        mainH={mainH}
        height={height}
        depth={depth}
        p={p}
        needsTop={needsTop}
      />

      {/* Outer top panel */}
      <mesh position={[topPanelCenterX, topPanelY, 0]} castShadow receiveShadow>
        <boxGeometry args={[topPanelW, WALL, depth]} />
        <ClosetMaterial />
      </mesh>

      {/* Separator panel between main closet and top cabinet — trimmed by diagonal at mainH */}
      {needsTop && (
        <mesh position={[sepPanelCenterX, mainH - WALL / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[sepPanelW, WALL, depth]} />
          <ClosetMaterial />
        </mesh>
      )}
    </group>
  )
}
