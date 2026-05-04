'use client'

import { useMemo } from 'react'
import * as THREE from 'three/webgpu'
import { useConfiguratorStore } from '../store/context'
import ClosetMaterial from '../materials/ClosetMaterial'
import { getDiagHeightAt, getBackDiagHeightAtZ, CORPUS_WALL, FILLER_FLAT_SEC_THRESHOLD } from '../../kledingkast/scene/diagonalUtils'
import type { DiagParams } from '../../kledingkast/scene/diagonalUtils'
import { trapShape, trapGeo, trapNaN } from '@/utils/debugGeometry'

const WALL = 0.018
const SIDE_WALL_EXTRA = 0.005
const CLOSET_INSIDE_INSET = 0.025

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
    if (p.backDiagonal) {
      // Back wall is a simple rectangle of height kinkHeight
      const kinkH = trapNaN(p.backDiagKinkHeight, 'BackWall-kinkH')
      const shape = new THREE.Shape()
      shape.moveTo(-width / 2, 0)
      shape.lineTo( width / 2, 0)
      shape.lineTo( width / 2, kinkH)
      shape.lineTo(-width / 2, kinkH)
      shape.closePath()
      return trapGeo(new THREE.ExtrudeGeometry(trapShape(shape, 'BackWall-backDiag'), { depth: WALL, bevelEnabled: false }), 'BackWall-backDiag-geo')
    }

    const shape = new THREE.Shape()
    const leftStartH  = trapNaN(getDiagHeightAt(0, p), 'BackWall-leftStartH')
    const leftTopX    = (p.diagonalSide === 'left'  || p.diagonalSide === 'both') ? CORPUS_WALL + p.leftDiagTopWidth  : 0
    const rightStartH = trapNaN(getDiagHeightAt(width, p), 'BackWall-rightStartH')
    const rightTopX   = (p.diagonalSide === 'right' || p.diagonalSide === 'both') ? width - CORPUS_WALL - p.rightDiagTopWidth : width

    shape.moveTo(-width / 2, 0)
    shape.lineTo( width / 2, 0)
    shape.lineTo( width / 2, rightStartH)
    if (p.diagonalSide === 'right' || p.diagonalSide === 'both') {
      shape.lineTo(rightTopX - width / 2, mainH)
    } else if (rightStartH < mainH - 1e-6) {
      shape.lineTo(width / 2, mainH)
    }
    shape.lineTo(leftTopX - width / 2, mainH)
    if (p.diagonalSide === 'left' || p.diagonalSide === 'both') {
      shape.lineTo(-width / 2, leftStartH)
    }
    shape.closePath()

    return trapGeo(new THREE.ExtrudeGeometry(trapShape(shape, 'BackWall-sideDiag'), { depth: WALL, bevelEnabled: false }), 'BackWall-sideDiag-geo')
  }, [width, mainH, p])

  return (
    <mesh
      key={p.backDiagonal ? 'back-diagonal' : 'side-diagonal'}
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
// One side wall assembly: supports both side-diagonal and back-diagonal
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

  // ---- Back diagonal case ----
  const backDiagGeo = useMemo(() => {
    if (!p.backDiagonal) return null
    const topH = needsTop ? height + SIDE_WALL_EXTRA : mainH
    const kinkH = trapNaN(p.backDiagKinkHeight, `SideWall-${side}-kinkH`)
    const flatSectionDepth = trapNaN(p.backDiagFlatSectionDepth, `SideWall-${side}-flatSec`)

    const shape = new THREE.Shape()
    shape.moveTo(depth / 2, 0)
    shape.lineTo(-depth / 2, 0)
    shape.lineTo(-depth / 2, trapNaN(topH, `SideWall-${side}-topH`))
    if (flatSectionDepth > 0) {
      shape.lineTo(flatSectionDepth - depth / 2, topH)
    }
    shape.lineTo(depth / 2, kinkH)
    shape.closePath()

    const geo = new THREE.ExtrudeGeometry(trapShape(shape, `SideWall-${side}-backDiag`), { depth: WALL, bevelEnabled: false })
    geo.rotateY(Math.PI / 2)
    return trapGeo(geo, `SideWall-${side}-backDiag-geo`)
  }, [p.backDiagonal, p.backDiagKinkHeight, p.backDiagFlatSectionDepth, depth, mainH, height, needsTop])

  // ---- Side diagonal case (existing logic) ----
  const diagStartH = hasDiag
    ? (isLeft ? p.leftDiagStartHeight : p.rightDiagStartHeight)
    : height

  const straightH = hasDiag ? diagStartH : height + SIDE_WALL_EXTRA

  const diagExtrudeGeo = useMemo(() => {
    if (p.backDiagonal) return null
    if (!hasDiag) return null
    const topY = needsTop ? height + SIDE_WALL_EXTRA : mainH
    const fullRun = CORPUS_WALL + (isLeft ? p.leftDiagTopWidth : p.rightDiagTopWidth)
    const topX = mainH > diagStartH
      ? fullRun * (topY - diagStartH) / (mainH - diagStartH)
      : fullRun
    const rise = topY - diagStartH
    const len  = Math.sqrt(topX * topX + rise * rise)
    trapNaN(len, `SideWall-${side}-diagExtrude-len`)
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
    return trapGeo(new THREE.ExtrudeGeometry(trapShape(shape, `SideWall-${side}-diagExtrude`), { depth, bevelEnabled: false }), `SideWall-${side}-diagExtrude-geo`)
  }, [hasDiag, isLeft, width, p.leftDiagTopWidth, p.rightDiagTopWidth, diagStartH, mainH, height, needsTop, depth])

  if (p.backDiagonal && backDiagGeo) {
    const meshX = isLeft ? -width / 2 : width / 2 - WALL
    return (
      <group key={needsTop ? 'back-diagonal-tc' : 'back-diagonal'}>
        <mesh position={[meshX, 0, 0]} geometry={backDiagGeo} castShadow receiveShadow>
          <ClosetMaterial />
        </mesh>
      </group>
    )
  }

  return (
    <group key="side-diagonal">
      <mesh position={[outerX, straightH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[WALL, straightH, depth]} />
        <ClosetMaterial />
      </mesh>

      {hasDiag && diagExtrudeGeo && (
        <mesh position={[0, 0, -depth / 2]} geometry={diagExtrudeGeo} castShadow receiveShadow>
          <ClosetMaterial />
        </mesh>
      )}
    </group>
  )
}

// ---------------------------------------------------------------------------
// Filler panel — wedge with sloped top following the back-diagonal shell
// ---------------------------------------------------------------------------
function TopFillerWedge({
  width,
  depth,
  height,
  needsTop,
  p,
}: {
  width: number
  depth: number
  height: number
  needsTop: boolean
  p: DiagParams
}) {
  const geo = useMemo(() => {
    const fillerBottomY = getBackDiagHeightAtZ(depth - 0.15, p)
    const seamY         = needsTop ? fillerBottomY : fillerBottomY - WALL

    const fillerFrontZ = depth - CLOSET_INSIDE_INSET       // world Z of filler front face
    const fillerBackZ  = depth - CLOSET_INSIDE_INSET - WALL // world Z of filler back face
    const frontTopY    = getBackDiagHeightAtZ(fillerFrontZ, p)  // shell height at filler front face
    const backTopY     = getBackDiagHeightAtZ(fillerBackZ, p)

    if (frontTopY - seamY < 0.001) return null

    // Profile in Z-Y, extruded along X.
    // After rotateY(PI/2): shape-x maps to -Z_local, so x_shape = depth/2 - worldZ.
    const xFront = depth / 2 - fillerFrontZ  // = CLOSET_INSIDE_INSET - depth/2
    const xBack  = depth / 2 - fillerBackZ   // = CLOSET_INSIDE_INSET + WALL - depth/2

    const shape = new THREE.Shape()
    shape.moveTo(xBack,  seamY)
    shape.lineTo(xFront, seamY)
    shape.lineTo(xFront, frontTopY)
    shape.lineTo(xBack,  backTopY)
    shape.closePath()

    const extruded = new THREE.ExtrudeGeometry(
      trapShape(shape, 'FillerWedge'),
      { depth: width, bevelEnabled: false },
    )
    extruded.rotateY(Math.PI / 2)
    return trapGeo(extruded, 'FillerWedge-geo')
  }, [width, depth, height, needsTop, p])

  if (!geo) return null

  return (
    <mesh position={[-width / 2, 0, 0]} castShadow receiveShadow geometry={geo}>
      <ClosetMaterial />
    </mesh>
  )
}

// ---------------------------------------------------------------------------
// Main corpus
// ---------------------------------------------------------------------------
export default function ClosetCorpus({ diagParams: p }: { diagParams: DiagParams }) {
  const needsTop = useConfiguratorStore((s) => s.needsTopCabinet())

  // Dimensions are sourced from diagParams (already in metres, pre-clamped by scene compositor)
  const width  = p.outerWidth
  const height = p.closetHeight
  const depth  = p.outerDepth
  const mainH  = p.mainHeight

  const hasLeft  = p.diagonalSide === 'left'  || p.diagonalSide === 'both'
  const hasRight = p.diagonalSide === 'right' || p.diagonalSide === 'both'

  // ---- Back diagonal top panels ----
  const kinkHm    = p.backDiagKinkHeight
  const flatSecM  = p.backDiagFlatSectionDepth
  const depthRunM = depth - flatSecM
  const heightDropFull = height - kinkHm
  const crossingWorldZ = (p.backDiagonal && heightDropFull > 0.001)
    ? depthRunM * (mainH - kinkHm) / heightDropFull
    : 0

  // ---- Side diagonal top panel trimming ----
  const topPanelY = needsTop
    ? (height - SIDE_WALL_EXTRA) - WALL / 2
    : mainH - WALL / 2

  const topPanelWorldY = topPanelY + WALL / 2
  const topRunLeft  = hasLeft  && mainH > p.leftDiagStartHeight
    ? (CORPUS_WALL + p.leftDiagTopWidth) * (topPanelWorldY - p.leftDiagStartHeight) / (mainH - p.leftDiagStartHeight)
    : (CORPUS_WALL + p.leftDiagTopWidth)
  const topRunRight = hasRight && mainH > p.rightDiagStartHeight
    ? (CORPUS_WALL + p.rightDiagTopWidth) * (topPanelWorldY - p.rightDiagStartHeight) / (mainH - p.rightDiagStartHeight)
    : (CORPUS_WALL + p.rightDiagTopWidth)
  const topOffsetLeft   = hasLeft  ? topRunLeft  : 0
  const topOffsetRight  = hasRight ? topRunRight : 0
  const topPanelW       = width - topOffsetLeft - topOffsetRight
  const topPanelCenterX = (topOffsetLeft - topOffsetRight) / 2

  return (
    <group position={[0, 0, depth / 2]}>
      {/* Back wall */}
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

      {/* Top panels */}
      {p.backDiagonal ? (
        <>
          {/* Flat top panel: covers from crossingWorldZ to depth at Y=mainH.
              For non-TC closets this is approximately the flat section only.
              For TC closets this also covers the zone where the slope is above mainH.
              Skip when filler is active (flatSec=0): filler panel is the only top element. */}
          {!needsTop && flatSecM >= 0.001 && (() => {
            const panelDepth = depth - crossingWorldZ
            if (panelDepth < 0.001) return null
            // Center in group-local Z: (crossingWorldZ + depth)/2 - depth/2 = crossingWorldZ/2
            const groupLocalZ = crossingWorldZ / 2
            return (
              <mesh key="top-flat-bd" position={[0, mainH - WALL / 2, groupLocalZ]} castShadow receiveShadow>
                <boxGeometry args={[width, WALL, panelDepth]} />
                <ClosetMaterial />
              </mesh>
            )
          })()}

          {/* Top-front filler panel: closes off open top wedge whenever flatSec is below the
              filler threshold (10cm). For flatSec in (0, 10cm) it coexists with the flat top
              panel — the wedge degenerates into a slab inside the flat zone. */}
          {flatSecM < FILLER_FLAT_SEC_THRESHOLD && (
            <TopFillerWedge
              key={needsTop ? "top-filler-wedge-bd-tc" : "top-filler-wedge-bd"}
              width={width}
              depth={depth}
              height={height}
              needsTop={needsTop}
              p={p}
            />
          )}
        </>
      ) : (
        <mesh key="top-sd" position={[topPanelCenterX, topPanelY, 0]} castShadow receiveShadow>
          <boxGeometry args={[topPanelW, WALL, depth]} />
          <ClosetMaterial />
        </mesh>
      )}

    </group>
  )
}
