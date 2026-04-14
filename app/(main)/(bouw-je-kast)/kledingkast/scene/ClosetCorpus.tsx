'use client'

import { useMemo } from 'react'
import * as THREE from 'three/webgpu'
import { useClosetStore } from '../store'
import ClosetMaterial from '../../_shared/materials/ClosetMaterial'
import { getDiagHeightAt, CORPUS_WALL } from './diagonalUtils'
import type { DiagParams } from './diagonalUtils'
import { trapShape, trapGeo, trapNaN } from '@/utils/debugGeometry'

const WALL = 0.018
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
      <group key="back-diagonal">
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
  const leftDiagTopWidthCm   = useClosetStore((s) => s.leftDiagTopWidth)
  const rightDiagTopWidthCm  = useClosetStore((s) => s.rightDiagTopWidth)
  const widthCm              = useClosetStore((s) => s.width)
  const backDiagonal         = useClosetStore((s) => s.backDiagonal)
  const backDiagKinkHeightCm = useClosetStore((s) => s.backDiagKinkHeight)
  const backDiagFlatSectionDepthCm = useClosetStore((s) => s.backDiagFlatSectionDepth)

  const p = useMemo(() => ({
    diagonalSide,
    leftDiagStartHeight:  Math.min(leftDiagStartHeight,  mainHCm - 20) / 100,
    rightDiagStartHeight: Math.min(rightDiagStartHeight, mainHCm - 20) / 100,
    leftDiagTopWidth:  leftDiagTopWidthCm  / 100,
    rightDiagTopWidth: rightDiagTopWidthCm / 100,
    outerWidth:        widthCm             / 100,
    mainHeight:        mainH,
    closetHeight:      height,
    backDiagonal,
    backDiagKinkHeight:        backDiagKinkHeightCm        / 100,
    backDiagFlatSectionDepth:  backDiagFlatSectionDepthCm  / 100,
    outerDepth:                depth,
  }), [diagonalSide, leftDiagStartHeight, rightDiagStartHeight, leftDiagTopWidthCm, rightDiagTopWidthCm, widthCm, mainHCm, mainH, height, backDiagonal, backDiagKinkHeightCm, backDiagFlatSectionDepthCm, depth])

  const hasLeft  = p.diagonalSide === 'left'  || p.diagonalSide === 'both'
  const hasRight = p.diagonalSide === 'right' || p.diagonalSide === 'both'

  // ---- Back diagonal top panels ----
  // The full slope is defined by closetHeight (the actual outer closet height), NOT mainH.
  // Corpus portion: clipped at Y=mainH. crossingWorldZ is where the full slope crosses mainH.
  const kinkHm   = backDiagKinkHeightCm        / 100
  const flatSecM = backDiagFlatSectionDepthCm  / 100
  const depthRunM = depth - flatSecM
  const heightDropFull = height - kinkHm
  const crossingWorldZ = (backDiagonal && heightDropFull > 0.001)
    ? depthRunM * (mainH - kinkHm) / heightDropFull
    : 0

  // Slope panel: ExtrudeGeometry with Y-Z profile extruded by width, using rotateY(PI/2).
  // x_shape = -z_group_local, so after rotation: vertex(x,y,z_ext) → (z_ext, y, -x).
  // One unified slope panel covering the full shell: worldZ=0 (kinkH) → worldZ=depth-flatSecM (closetHeight).
  // x_shape maps to worldZ via: worldZ = depth/2 - x_shape (group sits at z=depth/2).
  const backDiagSlopePanelGeo = useMemo(() => {
    if (!backDiagonal) return null
    const slopeLen = Math.sqrt(depthRunM * depthRunM + heightDropFull * heightDropFull)
    if (slopeLen < 0.001) return null

    trapNaN(depthRunM, 'CorpusSlopePanel-depthRunM')
    trapNaN(heightDropFull, 'CorpusSlopePanel-heightDropFull')

    const nx = -WALL * heightDropFull / slopeLen
    const ny = -WALL * depthRunM      / slopeLen

    const xBack      = depth / 2              // → worldZ = 0 (back wall)
    const xFlatStart = flatSecM - depth / 2   // → worldZ = depth - flatSecM (flat section start)

    const shape = new THREE.Shape()
    shape.moveTo(xFlatStart, height)
    shape.lineTo(xBack,  kinkHm)
    shape.lineTo(xBack      + nx, kinkHm + ny)
    shape.lineTo(xFlatStart + nx, height  + ny)
    shape.closePath()

    const geo = new THREE.ExtrudeGeometry(trapShape(shape, 'CorpusSlopePanel'), { depth: width, bevelEnabled: false })
    geo.rotateY(Math.PI / 2)
    return trapGeo(geo, 'CorpusSlopePanel-geo')
  }, [backDiagonal, kinkHm, flatSecM, depthRunM, heightDropFull, depth, height, width])

  // ---- Side diagonal top panel trimming (existing logic) ----
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

  const sepOffsetLeft   = hasLeft  ? WALL + p.leftDiagTopWidth  : 0
  const sepOffsetRight  = hasRight ? WALL + p.rightDiagTopWidth : 0
  const sepPanelW       = width - sepOffsetLeft - sepOffsetRight
  const sepPanelCenterX = (sepOffsetLeft - sepOffsetRight) / 2

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
      {backDiagonal ? (
        <>
          {/* Flat top panel: covers from crossingWorldZ to depth at Y=mainH.
              For non-TC closets this is approximately the flat section only.
              For TC closets this also covers the zone where the slope is above mainH. */}
          {(() => {
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
          {/* Slope panel — full shell from kinkH at back to closetHeight at flatStart */}
          {backDiagSlopePanelGeo && (
            <mesh key="slope-bd" position={[-width / 2, 0, 0]} geometry={backDiagSlopePanelGeo} castShadow receiveShadow>
              <ClosetMaterial />
            </mesh>
          )}
        </>
      ) : (
        <mesh key="top-sd" position={[topPanelCenterX, topPanelY, 0]} castShadow receiveShadow>
          <boxGeometry args={[topPanelW, WALL, depth]} />
          <ClosetMaterial />
        </mesh>
      )}

      {/* Separator panel between main closet and top cabinet */}
      {needsTop && !backDiagonal && (
        <mesh position={[sepPanelCenterX, mainH - WALL / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[sepPanelW, WALL, depth]} />
          <ClosetMaterial />
        </mesh>
      )}
    </group>
  )
}
