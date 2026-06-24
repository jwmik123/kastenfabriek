import type { DiagParams } from '../../kledingkast/scene/diagonalUtils'
import type { MeasurementSpec } from './types'

const cm = (m: number) => Math.round(m * 100)

/**
 * Build measurement specs for the sloped (schuinte) edges of a kledingkast.
 *
 * All coordinates are world-space (closet centred on X=0, Y=0 at floor). The
 * caller supplies `frontZ` (the Z plane the side slopes are drawn on) and the
 * function reads slope geometry straight from `DiagParams`.
 *
 * Emitted, per active slope:
 *  - the slanted edge itself (labelled with its length),
 *  - the slope's vertical start height (floor → where the slope begins),
 *  - the slope's horizontal reach (top width).
 *
 * Back slope is drawn in the Z–Y plane on the left side.
 * Returns `[]` when no slope is configured.
 */
export function diagonalSegments(p: DiagParams, frontZ: number): MeasurementSpec[] {
  const specs: MeasurementSpec[] = []
  const halfW = p.outerWidth / 2

  if (p.diagonalSide === 'left' || p.diagonalSide === 'both') {
    const xLow = -halfW + p.sideWallThickness
    const xHigh = -halfW + p.sideWallThickness + p.leftDiagTopWidth
    const yLow = p.leftDiagStartHeight
    const yHigh = p.mainHeight
    const len = Math.hypot(p.leftDiagTopWidth, yHigh - yLow)
    specs.push({
      id: 'diag-left-slope',
      p1: { x: xLow, y: yLow, z: frontZ },
      p2: { x: xHigh, y: yHigh, z: frontZ },
      offsetDir: { x: -1, y: 1, z: 0 },
      offsetDist: 0.06,
      label: cm(len),
    })
    specs.push({
      id: 'diag-left-start',
      p1: { x: xLow, y: 0, z: frontZ },
      p2: { x: xLow, y: yLow, z: frontZ },
      offsetDir: { x: -1, y: 0, z: 0 },
      offsetDist: 0.12,
      label: cm(yLow),
    })
    specs.push({
      id: 'diag-left-width',
      p1: { x: xLow, y: yHigh, z: frontZ },
      p2: { x: xHigh, y: yHigh, z: frontZ },
      offsetDir: { x: 0, y: 1, z: 0 },
      offsetDist: 0.06,
      label: cm(p.leftDiagTopWidth),
    })
  }

  if (p.diagonalSide === 'right' || p.diagonalSide === 'both') {
    const xLow = halfW - p.sideWallThickness
    const xHigh = halfW - p.sideWallThickness - p.rightDiagTopWidth
    const yLow = p.rightDiagStartHeight
    const yHigh = p.mainHeight
    const len = Math.hypot(p.rightDiagTopWidth, yHigh - yLow)
    specs.push({
      id: 'diag-right-slope',
      p1: { x: xLow, y: yLow, z: frontZ },
      p2: { x: xHigh, y: yHigh, z: frontZ },
      offsetDir: { x: 1, y: 1, z: 0 },
      offsetDist: 0.06,
      label: cm(len),
    })
    specs.push({
      id: 'diag-right-start',
      p1: { x: xLow, y: 0, z: frontZ },
      p2: { x: xLow, y: yLow, z: frontZ },
      offsetDir: { x: 1, y: 0, z: 0 },
      offsetDist: 0.12,
      label: cm(yLow),
    })
    specs.push({
      id: 'diag-right-width',
      p1: { x: xLow, y: yHigh, z: frontZ },
      p2: { x: xHigh, y: yHigh, z: frontZ },
      offsetDir: { x: 0, y: 1, z: 0 },
      offsetDist: 0.06,
      label: cm(p.rightDiagTopWidth),
    })
  }

  if (p.backDiagonal) {
    // Back slope lives in the Z–Y plane; draw it on the closet's left side.
    const x = -halfW
    const flatStartZ = p.outerDepth - p.backDiagFlatSectionDepth
    const len = Math.hypot(flatStartZ, p.closetHeight - p.backDiagKinkHeight)
    specs.push({
      id: 'diag-back-slope',
      p1: { x, y: p.backDiagKinkHeight, z: 0 },
      p2: { x, y: p.closetHeight, z: flatStartZ },
      offsetDir: { x: -1, y: 0, z: 0 },
      offsetDist: 0.06,
      label: cm(len),
    })
  }

  return specs
}
