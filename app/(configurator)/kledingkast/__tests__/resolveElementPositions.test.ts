import { describe, it, expect } from 'vitest'
import {
  resolveElementPositions,
  type ModuleLayoutConfig,
  type ElementBbox,
} from '../scene/moduleLayouts'

const layoutWith = (
  elements: ModuleLayoutConfig['elements'],
  fillZone: ModuleLayoutConfig['fillZone'] = {
    above: { type: 'shelves', spacing: 0.35 },
    below: { type: 'open' },
  }
): ModuleLayoutConfig => ({
  id: 99,
  label: 'test',
  description: 'test',
  elements,
  fillZone,
})

describe('resolveElementPositions', () => {
  it('empty elements: fillAbove spans floor → roofY, fillBelow empty', () => {
    const layout = layoutWith([])
    const r = resolveElementPositions(layout, 2.0, [])
    expect(r.elementYs).toEqual([])
    expect(r.fillAbove).toEqual({ start: 0, end: 2.0 })
    expect(r.fillBelow).toEqual({ start: 0, end: 0 })
  })

  it('fromBottom anchor: bbox bottom at d, fillAbove starts at bbox top', () => {
    const layout = layoutWith([
      { glbPath: '/x.glb', anchor: { type: 'fromBottom', d: 0 } },
    ])
    const bboxes: ElementBbox[] = [{ minY: 0, maxY: 0.7 }]
    const r = resolveElementPositions(layout, 2.0, bboxes)
    expect(r.elementYs).toEqual([0])
    expect(r.fillAbove).toEqual({ start: 0.7, end: 2.0 })
    expect(r.fillBelow).toEqual({ start: 0, end: 0 })
  })

  it('fromBottom with negative d (legacy world-floor anchor)', () => {
    const layout = layoutWith([
      { glbPath: '/x.glb', anchor: { type: 'fromBottom', d: -0.118 } },
    ])
    const bboxes: ElementBbox[] = [{ minY: 0, maxY: 0.7 }]
    const r = resolveElementPositions(layout, 2.0, bboxes)
    expect(r.elementYs).toEqual([-0.118])
    // fillAbove starts at bbox top in module space = -0.118 + 0.7 = 0.582
    expect(r.fillAbove.start).toBeCloseTo(0.582, 5)
    expect(r.fillAbove.end).toBe(2.0)
    // fillBelow.end = min(bbox bottom) = -0.118 → empty (clamped to 0)
    expect(r.fillBelow.end).toBeLessThanOrEqual(0)
  })

  it('fromTop anchor: bbox top at roofY - d', () => {
    const layout = layoutWith([
      { glbPath: '/x.glb', anchor: { type: 'fromTop', d: 0.35 } },
    ])
    const bboxes: ElementBbox[] = [{ minY: 0, maxY: 0.05 }]
    const roofY = 2.0
    const r = resolveElementPositions(layout, roofY, bboxes)
    // bbox top sits at roofY - d = 1.65; elementY (bbox bottom) = 1.65 - 0.05 = 1.60
    expect(r.elementYs[0]).toBeCloseTo(1.6, 5)
    // fillAbove.start = max bbox top = 1.65, end = roofY
    expect(r.fillAbove.start).toBeCloseTo(1.65, 5)
    expect(r.fillAbove.end).toBe(2.0)
    // fillBelow: floor → bbox bottom = 1.60
    expect(r.fillBelow.start).toBe(0)
    expect(r.fillBelow.end).toBeCloseTo(1.6, 5)
  })

  it('uses bbox.minY offset (non-zero origin GLB)', () => {
    const layout = layoutWith([
      { glbPath: '/x.glb', anchor: { type: 'fromBottom', d: 0.1 } },
    ])
    // bbox spans minY=0.05..maxY=0.55 → height 0.5
    const bboxes: ElementBbox[] = [{ minY: 0.05, maxY: 0.55 }]
    const r = resolveElementPositions(layout, 2.0, bboxes)
    expect(r.elementYs[0]).toBe(0.1)
    // bbox top in module space = elementY + (maxY - minY) = 0.1 + 0.5 = 0.6
    expect(r.fillAbove.start).toBeCloseTo(0.6, 5)
  })

  it('two elements (slice 1 not used yet, but resolver supports it)', () => {
    const layout = layoutWith([
      { glbPath: '/a.glb', anchor: { type: 'fromBottom', d: 0 } },
      { glbPath: '/b.glb', anchor: { type: 'fromBottom', d: 1.0 } },
    ])
    const bboxes: ElementBbox[] = [
      { minY: 0, maxY: 0.7 },
      { minY: 0, maxY: 0.05 },
    ]
    const r = resolveElementPositions(layout, 2.0, bboxes)
    expect(r.elementYs).toEqual([0, 1.0])
    // fillAbove.start = max(0.7, 1.05) = 1.05
    expect(r.fillAbove.start).toBeCloseTo(1.05, 5)
    // fillBelow.end = min(0, 1.0) = 0 → empty
    expect(r.fillBelow.end).toBe(0)
  })
})
