'use client'

import { useMemo } from 'react'
import { useWasmachinekastStore } from '../store'
import { WALL, MODULE_WALL, MODULE_FLOOR_Y } from '../../kledingkast/scene/closetConstants'
import { computeSlotWidthsM } from '../../_shared/store/slotWidths'
import {
  MeasurementProjector,
  MeasurementsOverlay,
  type ProjectedMap,
} from '../../_shared/measurements/MeasurementShell'
import type { MeasurementSpec } from '../../_shared/measurements/types'
import type { BaseModuleSlot } from '../../_shared/store/types'

export type { ProjectedMap }

interface SectionInput {
  kind: 'high' | 'low'
  widthCm: number
  heightCm: number
  modules: BaseModuleSlot[]
  xOffsetM: number
  /**
   * The side this section has no panel of its own on, because it shares the
   * neighbouring section's at the seam. Mirrors `sharedSideWall` in the scene —
   * without it the interior, and so every module width, comes out too narrow.
   */
  sharedSideWall?: 'left' | 'right' | null
}

/**
 * Pure: build wasmachinekast measurement specs. Walks the resolved sections in
 * the same X-order and offsets the scene uses, so module-width lines land on the
 * actual modules in every layout (high-only, low-only, low-left, low-right).
 *
 * `sideWallM` is the chosen panel thickness, not a constant: an 18 mm reading on
 * a cabinet built with 36 mm panels is off by 1.8 cm on every module.
 */
export function buildWasmSpecs(
  sections: SectionInput[],
  depthCm: number,
  sideWallM: number = WALL,
): MeasurementSpec[] {
  const depthM = depthCm / 100
  const frontZ = depthM + 0.02
  const specs: MeasurementSpec[] = []
  let rightMostX = -Infinity

  for (const section of sections) {
    const widthM = section.widthCm / 100
    const heightM = section.heightCm / 100
    const leftWallM = section.sharedSideWall === 'left' ? 0 : sideWallM
    const rightWallM = section.sharedSideWall === 'right' ? 0 : sideWallM
    const innerW = widthM - leftWallM - rightWallM
    const leftEdge = section.xOffsetM - widthM / 2
    rightMostX = Math.max(rightMostX, section.xOffsetM + widthM / 2)

    // Section total width — below the floor.
    specs.push({
      id: `section-width-${section.kind}`,
      p1: { x: leftEdge, y: 0, z: frontZ },
      p2: { x: section.xOffsetM + widthM / 2, y: 0, z: frontZ },
      offsetDir: { x: 0, y: -1, z: 0 },
      offsetDist: 0.14,
      label: section.widthCm,
    })

    // Section height — left edge.
    specs.push({
      id: `section-height-${section.kind}`,
      p1: { x: leftEdge, y: 0, z: frontZ },
      p2: { x: leftEdge, y: heightM, z: frontZ },
      offsetDir: { x: -1, y: 0, z: 0 },
      offsetDist: 0.18,
      label: section.heightCm,
    })

    // Per-module clear widths.
    const slotWidthsM = computeSlotWidthsM(section.modules, innerW)
    const interiorLeft = leftEdge + leftWallM
    let xOffset = 0
    for (let i = 0; i < section.modules.length; i++) {
      const slotW = slotWidthsM[i]
      const slotLeft = interiorLeft + xOffset
      const x1 = slotLeft + MODULE_WALL
      const x2 = slotLeft + slotW - MODULE_WALL
      specs.push({
        id: `module-width-${section.kind}-${i}`,
        p1: { x: x1, y: MODULE_FLOOR_Y, z: frontZ },
        p2: { x: x2, y: MODULE_FLOOR_Y, z: frontZ },
        offsetDir: { x: 0, y: -1, z: 0 },
        offsetDist: 0.06,
        label: ((x2 - x1) * 100).toFixed(1),
      })
      xOffset += slotW
    }
  }

  // Shared depth — along Z on the right of the whole assembly, at the floor.
  if (Number.isFinite(rightMostX)) {
    specs.push({
      id: 'total-depth',
      p1: { x: rightMostX, y: 0, z: 0 },
      p2: { x: rightMostX, y: 0, z: depthM },
      offsetDir: { x: 1, y: 0, z: 0 },
      offsetDist: 0.06,
      label: depthCm,
    })
  }

  return specs
}

function useWasmMeasurementSpecs(): MeasurementSpec[] {
  const layout = useWasmachinekastStore((s) => s.layout)
  const topWidth = useWasmachinekastStore((s) => s.width)
  const topHeight = useWasmachinekastStore((s) => s.height)
  const topModules = useWasmachinekastStore((s) => s.modules)
  const depthCm = useWasmachinekastStore((s) => s.depth)
  const lowSection = useWasmachinekastStore((s) => s.lowSection)
  const sidePanelThickness = useWasmachinekastStore((s) => s.sidePanelThickness)

  return useMemo(() => {
    const sideWallM = sidePanelThickness === '36mm' ? 0.036 : WALL
    const isLowOnly = layout === 'low-only'
    const isDual = layout === 'low-left' || layout === 'low-right'

    // Resolve sections (mirrors WasmachinekastScene).
    const highSection: SectionInput | null = isLowOnly
      ? null
      : { kind: 'high', widthCm: topWidth, heightCm: topHeight, modules: topModules, xOffsetM: 0 }
    const lowSectionInput: SectionInput | null = isLowOnly
      ? { kind: 'low', widthCm: topWidth, heightCm: topHeight, modules: topModules, xOffsetM: 0 }
      : lowSection
        ? { kind: 'low', widthCm: lowSection.width, heightCm: lowSection.height, modules: lowSection.modules, xOffsetM: 0 }
        : null

    const highW = highSection ? highSection.widthCm / 100 : 0
    const lowW = lowSectionInput ? lowSectionInput.widthCm / 100 : 0
    const totalW = isDual ? highW + lowW : isLowOnly ? lowW : highW

    if (layout === 'low-left' && highSection && lowSectionInput) {
      lowSectionInput.xOffsetM = -totalW / 2 + lowW / 2
      highSection.xOffsetM = -totalW / 2 + lowW + highW / 2
    } else if (layout === 'low-right' && highSection && lowSectionInput) {
      highSection.xOffsetM = -totalW / 2 + highW / 2
      lowSectionInput.xOffsetM = -totalW / 2 + highW + lowW / 2
    }

    // The high section keeps its panel at the seam; the low one drops the panel
    // facing it and widens into the freed space (WasmachinekastScene).
    if (isDual && lowSectionInput) {
      lowSectionInput.sharedSideWall = layout === 'low-left' ? 'right' : 'left'
    }

    const sections: SectionInput[] = []
    if (highSection) sections.push(highSection)
    if (lowSectionInput && !isLowOnly) sections.push(lowSectionInput)
    if (isLowOnly && lowSectionInput) sections.push(lowSectionInput)

    return buildWasmSpecs(sections, depthCm, sideWallM)
  }, [layout, topWidth, topHeight, topModules, depthCm, lowSection, sidePanelThickness])
}

export function WasmMeasurementProjectorLayer({
  projectedRef,
}: {
  projectedRef: React.MutableRefObject<ProjectedMap>
}) {
  const show = useWasmachinekastStore((s) => s.showMeasurements)
  const specs = useWasmMeasurementSpecs()
  if (!show) return null
  return <MeasurementProjector projectedRef={projectedRef} specs={specs} />
}

export function WasmMeasurementsOverlayLayer({
  projectedRef,
}: {
  projectedRef: React.MutableRefObject<ProjectedMap>
}) {
  const show = useWasmachinekastStore((s) => s.showMeasurements)
  const specs = useWasmMeasurementSpecs()
  if (!show) return null
  return <MeasurementsOverlay projectedRef={projectedRef} specs={specs} />
}
