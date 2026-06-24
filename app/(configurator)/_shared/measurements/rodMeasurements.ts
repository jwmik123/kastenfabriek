import type { ModuleLayoutConfig } from '../../kledingkast/scene/moduleLayouts'

// Path of the hanging-rail (roede) GLB. A module layout can hold one or two of
// these (single rail, double rail, drawer + rail, …).
export const ROD_GLB = '/objects/mainmodules/RodModule.glb'

export function isRodElement(glbPath: string): boolean {
  return glbPath === ROD_GLB
}

export interface RodMeasurement {
  elementIndex: number
  /** Y of the rail's top side in module space (0 = module floor). */
  topY: number
  /**
   * Which half of the module the rail sits in. Drives the measurement
   * orientation: `upper` → measure from the roof down to the rail; `lower` →
   * measure from the floor up to the rail's top side.
   */
  half: 'upper' | 'lower'
}

/**
 * Resolve the rail (roede) measurements for a layout, given the module's
 * interior roof height `roofY` (module space, 0 = floor).
 *
 * The rail's top side is derived purely from its anchor — no GLB bounding box
 * is needed — so this mirrors `resolveElementPositions` without loading meshes:
 *  - `fromTop d`    → top at `roofY - d`
 *  - `bboxTopAt d`  → top at `d`
 *  - `midpoint ref` → top at `topOf(ref) / 2`
 *  - `fromBottom d` → top at `d` (rails never use this; included for totality)
 *
 * A rail is classified `upper`/`lower` by comparing its top against `roofY / 2`.
 */
export function resolveRodMeasurements(
  layout: ModuleLayoutConfig,
  roofY: number,
): RodMeasurement[] {
  const tops = new Array<number>(layout.elements.length).fill(NaN)

  const topOf = (i: number): number => {
    if (!Number.isNaN(tops[i])) return tops[i]
    const a = layout.elements[i].anchor
    let t: number
    switch (a.type) {
      case 'fromTop':
        t = roofY - a.d
        break
      case 'bboxTopAt':
        t = a.d
        break
      case 'midpoint':
        t = topOf(a.refIndex) / 2
        break
      case 'fromBottom':
        t = a.d
        break
    }
    tops[i] = t
    return t
  }

  const out: RodMeasurement[] = []
  layout.elements.forEach((el, i) => {
    if (!isRodElement(el.glbPath)) return
    const topY = topOf(i)
    out.push({ elementIndex: i, topY, half: topY > roofY / 2 ? 'upper' : 'lower' })
  })
  return out
}
