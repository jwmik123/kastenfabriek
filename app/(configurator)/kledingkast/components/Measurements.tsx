'use client'

import { useMemo } from 'react'
import { useClosetStore } from '../store'
import { getLayoutById } from '../scene/moduleLayouts'
import {
  getDiagHeightAt,
  getBackDiagHeightAtZ,
  computeModuleCapY,
  type DiagParams,
} from '../scene/diagonalUtils'
import { WALL, MODULE_WALL, MODULE_FLOOR_Y } from '../scene/closetConstants'
import {
  MeasurementProjector,
  MeasurementsOverlay,
  type ProjectedMap,
} from '../../_shared/measurements/MeasurementShell'
import type { MeasurementSpec } from '../../_shared/measurements/types'
import { resolveRodMeasurements } from '../../_shared/measurements/rodMeasurements'
import { diagonalSegments } from '../../_shared/measurements/diagonalSegments'

export type { ProjectedMap }

interface BuilderInput {
  widthM: number
  heightM: number
  depthM: number
  widthCm: number
  heightCm: number
  depthCm: number
  moduleCount: number
  modules: { slotIndex: number; layoutId: number | null; span: 1 | 2 }[]
  diag: DiagParams
  sideWallM: number
}

/** Per-module interior roof height (module space, 0 = floor), mirroring Module.tsx. */
function moduleRoofY(diag: DiagParams, leftXOuter: number, rightXOuter: number): number {
  if (diag.backDiagonal) {
    const hBack = Math.min(getBackDiagHeightAtZ(WALL, diag), diag.moduleCapY) - MODULE_FLOOR_Y - WALL
    return Math.max(0, hBack)
  }
  const lh = getDiagHeightAt(leftXOuter, diag) - MODULE_FLOOR_Y - WALL
  const rh = getDiagHeightAt(rightXOuter, diag) - MODULE_FLOOR_Y - WALL
  return Math.max(0, Math.min(lh, rh))
}

/** Pure: build the full kledingkast measurement spec list. */
export function buildKledingkastSpecs(input: BuilderInput): MeasurementSpec[] {
  const { widthM, heightM, depthM, widthCm, heightCm, depthCm, moduleCount, modules, diag, sideWallM } = input
  const innerW = widthM - sideWallM * 2
  const slotW = moduleCount > 0 ? innerW / moduleCount : innerW
  const frontZ = depthM + 0.02

  const specs: MeasurementSpec[] = []

  // 1. Total width — below the floor.
  specs.push({
    id: 'total-width',
    p1: { x: -widthM / 2, y: 0, z: frontZ },
    p2: { x: widthM / 2, y: 0, z: frontZ },
    offsetDir: { x: 0, y: -1, z: 0 },
    offsetDist: 0.14,
    label: widthCm,
  })

  // 2. Total height — left of the closet.
  specs.push({
    id: 'total-height',
    p1: { x: -widthM / 2, y: 0, z: frontZ },
    p2: { x: -widthM / 2, y: heightM, z: frontZ },
    offsetDir: { x: -1, y: 0, z: 0 },
    offsetDist: 0.22,
    label: heightCm,
  })

  // 3. Depth — along Z on the right side, at the floor.
  specs.push({
    id: 'total-depth',
    p1: { x: widthM / 2, y: 0, z: 0 },
    p2: { x: widthM / 2, y: 0, z: depthM },
    offsetDir: { x: 1, y: 0, z: 0 },
    offsetDist: 0.06,
    label: depthCm,
  })

  // 4. Per-module inner clear widths — at MODULE_FLOOR_Y.
  for (let i = 0; i < moduleCount; i++) {
    const x1 = -innerW / 2 + i * slotW + MODULE_WALL
    const x2 = -innerW / 2 + (i + 1) * slotW - MODULE_WALL
    specs.push({
      id: `module-width-${i}`,
      p1: { x: x1, y: MODULE_FLOOR_Y, z: frontZ },
      p2: { x: x2, y: MODULE_FLOOR_Y, z: frontZ },
      offsetDir: { x: 0, y: -1, z: 0 },
      offsetDist: 0.06,
      label: ((x2 - x1) * 100).toFixed(1),
    })
  }

  // 5. Rail (roede) measurements — per module that hosts a rail.
  for (const mod of modules) {
    if (mod.layoutId === null) continue
    const layout = getLayoutById(mod.layoutId)
    if (!layout) continue

    const leftXOuter = sideWallM + mod.slotIndex * slotW
    const moduleWidth = mod.span * slotW
    const rightXOuter = leftXOuter + moduleWidth
    const roofY = moduleRoofY(diag, leftXOuter, rightXOuter)
    if (roofY <= 0) continue

    const rods = resolveRodMeasurements(layout, roofY)
    if (rods.length === 0) continue

    const cx = -innerW / 2 + mod.slotIndex * slotW + moduleWidth / 2
    const roofWorldY = MODULE_FLOOR_Y + roofY

    for (const rod of rods) {
      const railWorldY = MODULE_FLOOR_Y + rod.topY
      if (rod.half === 'upper') {
        // Roof → rail (hanging clearance).
        specs.push({
          id: `rod-${mod.slotIndex}-${rod.elementIndex}`,
          p1: { x: cx, y: roofWorldY, z: frontZ },
          p2: { x: cx, y: railWorldY, z: frontZ },
          offsetDir: { x: 0, y: 0, z: 0 },
          offsetDist: 0,
          label: Math.round((roofY - rod.topY) * 100),
        })
      } else {
        // Floor → rail top side.
        specs.push({
          id: `rod-${mod.slotIndex}-${rod.elementIndex}`,
          p1: { x: cx, y: MODULE_FLOOR_Y, z: frontZ },
          p2: { x: cx, y: railWorldY, z: frontZ },
          offsetDir: { x: 0, y: 0, z: 0 },
          offsetDist: 0,
          label: Math.round(rod.topY * 100),
        })
      }
    }
  }

  // 6. Slope (schuinte) edges.
  specs.push(...diagonalSegments(diag, frontZ))

  return specs
}

function useMeasurementSpecs(): MeasurementSpec[] {
  const widthCm = useClosetStore((s) => s.width)
  const heightCm = useClosetStore((s) => s.height)
  const depthCm = useClosetStore((s) => s.depth)
  const moduleCount = useClosetStore((s) => s.moduleCount)
  const modules = useClosetStore((s) => s.modules)
  const diagonalSide = useClosetStore((s) => s.diagonalSide)
  const leftDiagStartHeight = useClosetStore((s) => s.leftDiagStartHeight)
  const rightDiagStartHeight = useClosetStore((s) => s.rightDiagStartHeight)
  const leftDiagTopWidth = useClosetStore((s) => s.leftDiagTopWidth)
  const rightDiagTopWidth = useClosetStore((s) => s.rightDiagTopWidth)
  const backDiagonal = useClosetStore((s) => s.backDiagonal)
  const backDiagKinkHeight = useClosetStore((s) => s.backDiagKinkHeight)
  const backDiagFlatSectionDepth = useClosetStore((s) => s.backDiagFlatSectionDepth)
  const sidePanelThickness = useClosetStore((s) => s.sidePanelThickness)
  const mainHeightCm = useClosetStore((s) => s.mainHeight())
  const needsTop = useClosetStore((s) => s.needsTopCabinet())

  return useMemo(() => {
    const widthM = widthCm / 100
    const heightM = heightCm / 100
    const depthM = depthCm / 100
    const sideWallM = sidePanelThickness === '36mm' ? 0.036 : 0.018

    const base: DiagParams = {
      diagonalSide,
      leftDiagStartHeight: Math.min(leftDiagStartHeight, mainHeightCm - 20) / 100,
      rightDiagStartHeight: Math.min(rightDiagStartHeight, mainHeightCm - 20) / 100,
      leftDiagTopWidth: leftDiagTopWidth / 100,
      rightDiagTopWidth: rightDiagTopWidth / 100,
      outerWidth: widthM,
      mainHeight: mainHeightCm / 100,
      closetHeight: heightM,
      backDiagonal,
      backDiagKinkHeight: backDiagKinkHeight / 100,
      backDiagFlatSectionDepth: backDiagFlatSectionDepth / 100,
      outerDepth: depthM,
      moduleCapY: mainHeightCm / 100,
      sideWallThickness: sideWallM,
    }
    const diag: DiagParams = { ...base, moduleCapY: computeModuleCapY(base, needsTop) }

    return buildKledingkastSpecs({
      widthM, heightM, depthM, widthCm, heightCm, depthCm,
      moduleCount, modules, diag, sideWallM,
    })
  }, [
    widthCm, heightCm, depthCm, moduleCount, modules, diagonalSide,
    leftDiagStartHeight, rightDiagStartHeight, leftDiagTopWidth, rightDiagTopWidth,
    backDiagonal, backDiagKinkHeight, backDiagFlatSectionDepth, sidePanelThickness,
    mainHeightCm, needsTop,
  ])
}

export function MeasurementProjectorLayer({
  projectedRef,
}: {
  projectedRef: React.MutableRefObject<ProjectedMap>
}) {
  const show = useClosetStore((s) => s.showMeasurements)
  const specs = useMeasurementSpecs()
  if (!show) return null
  return <MeasurementProjector projectedRef={projectedRef} specs={specs} />
}

export function MeasurementsOverlayLayer({
  projectedRef,
}: {
  projectedRef: React.MutableRefObject<ProjectedMap>
}) {
  const show = useClosetStore((s) => s.showMeasurements)
  const specs = useMeasurementSpecs()
  if (!show) return null
  return <MeasurementsOverlay projectedRef={projectedRef} specs={specs} />
}
