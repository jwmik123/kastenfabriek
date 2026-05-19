import { describe, it, expect } from 'vitest'
import {
  resolveElementPositions,
  computeShelfPositions,
  SHELF_THICKNESS,
  MIN_TOP_CLEARANCE,
  MODULE_LAYOUTS,
  getLayoutById,
  type ModuleLayoutConfig,
  type ElementBbox,
  type FillZoneConfig,
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

  it('bboxTopAt anchor: bbox top sits at d', () => {
    const layout = layoutWith([
      { glbPath: '/x.glb', anchor: { type: 'bboxTopAt', d: 1.4 } },
    ])
    const bboxes: ElementBbox[] = [{ minY: 0, maxY: 0.5 }]
    const r = resolveElementPositions(layout, 2.0, bboxes)
    // bbox top at 1.4 → elementY (bbox bottom) = 1.4 - 0.5 = 0.9
    expect(r.elementYs[0]).toBeCloseTo(0.9, 5)
    expect(r.fillAbove.start).toBeCloseTo(1.4, 5)
    expect(r.fillAbove.end).toBe(2.0)
    expect(r.fillBelow.start).toBe(0)
    expect(r.fillBelow.end).toBeCloseTo(0.9, 5)
  })

  it('midpoint anchor referencing a fromTop sibling', () => {
    const layout = layoutWith([
      { glbPath: '/top.glb', anchor: { type: 'fromTop', d: 0.35 } },
      { glbPath: '/bot.glb', anchor: { type: 'midpoint', refIndex: 0 } },
    ])
    const bboxes: ElementBbox[] = [
      { minY: 0, maxY: 0.05 }, // top rod, height 0.05
      { minY: 0, maxY: 0.05 }, // bottom rod, height 0.05
    ]
    const roofY = 2.0
    const r = resolveElementPositions(layout, roofY, bboxes)
    // top rod bbox top = roofY - 0.35 = 1.65; elementY = 1.6
    expect(r.elementYs[0]).toBeCloseTo(1.6, 5)
    // midpoint(0, 1.65) = 0.825 → bottom rod bbox top = 0.825; elementY = 0.825 - 0.05 = 0.775
    expect(r.elementYs[1]).toBeCloseTo(0.775, 5)
  })

  it('FillShelves explicit startY overrides fillAbove.start', () => {
    const layout = layoutWith(
      [{ glbPath: '/desk.glb', anchor: { type: 'fromBottom', d: 0 } }],
      {
        above: { type: 'shelves', spacing: 0.35, startY: 1.75 },
        below: { type: 'open' },
      },
    )
    const bboxes: ElementBbox[] = [{ minY: 0, maxY: 0.7 }]
    const r = resolveElementPositions(layout, 2.4, bboxes)
    // Default fillAbove.start would be 0.7 (bbox top); override pushes to 1.75.
    expect(r.fillAbove.start).toBe(1.75)
    expect(r.fillAbove.end).toBe(2.4)
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

describe('computeShelfPositions', () => {
  const open: FillZoneConfig = { type: 'open' }

  it('open returns []', () => {
    expect(computeShelfPositions(open, 0, 2, false)).toEqual([])
  })

  it('fixedShelves returns positions verbatim', () => {
    const cfg: FillZoneConfig = { type: 'fixedShelves', positions: [0.35, 1.05] }
    expect(computeShelfPositions(cfg, 0, 2, false)).toEqual([0.35, 1.05])
  })

  it('shelves without explicit startY: shelf TOPS snap to multiples of spacing strictly above startY', () => {
    const cfg: FillZoneConfig = { type: 'shelves', spacing: 0.35 }
    // startY = 0.7 (drawer top) → first shelf top strictly above = 1.05
    const out = computeShelfPositions(cfg, 0.7, 2.4, true)
    expect(out[0]).toBeCloseTo(1.05, 5)
    expect(out[1]).toBeCloseTo(1.4, 5)
  })

  it('shelves: top at 70cm aligns with a 70cm drawer (full-shelves L1 case)', () => {
    const cfg: FillZoneConfig = { type: 'shelves', spacing: 0.35 }
    // startY = 0 (module floor) → shelf tops at 0.35, 0.70, 1.05 ...
    const out = computeShelfPositions(cfg, 0, 2.4, true)
    expect(out[0]).toBeCloseTo(0.35, 5)
    expect(out[1]).toBeCloseTo(0.70, 5)
    expect(out[2]).toBeCloseTo(1.05, 5)
  })

  it('shelves with explicit startY: first shelf at exactly startY', () => {
    const cfg: FillZoneConfig = { type: 'shelves', spacing: 0.35, startY: 1.75 }
    const out = computeShelfPositions(cfg, 1.75, 2.4, true)
    expect(out[0]).toBe(1.75)
    expect(out[1]).toBeCloseTo(2.1, 5)
  })

  it('shelves: !fillToTop keeps last when gap to endY >= MIN_TOP_CLEARANCE', () => {
    const cfg: FillZoneConfig = { type: 'shelves', spacing: 0.35 }
    // endY = 1.75; positions: [0.35, 0.7, 1.05, 1.4]; gap above 1.4 = 0.35 >= 0.30 → kept.
    const out = computeShelfPositions(cfg, 0, 1.75, false)
    expect(out[out.length - 1]).toBeCloseTo(1.4, 5)
  })

  it('shelves: !fillToTop drops last when gap to endY < MIN_TOP_CLEARANCE', () => {
    const cfg: FillZoneConfig = { type: 'shelves', spacing: 0.35 }
    // endY = 1.5; positions before drop: [0.35, 0.7, 1.05, 1.4]; gap = 0.1 < 0.30 → drop.
    const out = computeShelfPositions(cfg, 0, 1.5, false)
    expect(out[out.length - 1]).toBeCloseTo(1.05, 5)
  })

  it('MIN_TOP_CLEARANCE constant is 0.30', () => {
    expect(MIN_TOP_CLEARANCE).toBe(0.30)
  })

  it('shelves: zone height below 2*SHELF_THICKNESS returns []', () => {
    const cfg: FillZoneConfig = { type: 'shelves', spacing: 0.35 }
    expect(computeShelfPositions(cfg, 0, SHELF_THICKNESS, false)).toEqual([])
  })
})

describe('MODULE_LAYOUTS (slice 3)', () => {
  it('exposes ids 1..8 in order', () => {
    expect(MODULE_LAYOUTS.map((l) => l.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  })

  it('all element glb paths point to mainmodules/', () => {
    for (const layout of MODULE_LAYOUTS) {
      for (const el of layout.elements) {
        expect(el.glbPath.startsWith('/objects/mainmodules/')).toBe(true)
      }
    }
  })

  it('L1 has no elements and shelves above', () => {
    const l = getLayoutById(1)!
    expect(l.elements).toEqual([])
    expect(l.fillZone.above.type).toBe('shelves')
  })

  it('L3 double-rod: top fromTop(0.35), bottom midpoint(0)', () => {
    const l = getLayoutById(3)!
    expect(l.elements).toHaveLength(2)
    expect(l.elements[0].anchor).toEqual({ type: 'fromTop', d: 0.35 })
    expect(l.elements[1].anchor).toEqual({ type: 'midpoint', refIndex: 0 })
    expect(l.fillZone.above.type).toBe('open')
    expect(l.fillZone.below.type).toBe('open')
  })

  it('L4 split: fromBottom(0) (sits on module floor; GLB sized to 1.40m)', () => {
    const l = getLayoutById(4)!
    expect(l.elements[0].anchor).toEqual({ type: 'fromBottom', d: 0 })
  })

  it('L6 rod+shelf: fromTop(0.35) and fixedShelves [0.35] below', () => {
    const l = getLayoutById(6)!
    expect(l.elements[0].anchor).toEqual({ type: 'fromTop', d: 0.35 })
    expect(l.fillZone.below).toEqual({ type: 'fixedShelves', positions: [0.35] })
  })

  it('L7 drawer+rod: two elements with fromBottom(0) and fromTop(0.35)', () => {
    const l = getLayoutById(7)!
    expect(l.elements).toHaveLength(2)
    expect(l.elements[0].anchor).toEqual({ type: 'fromBottom', d: 0 })
    expect(l.elements[1].anchor).toEqual({ type: 'fromTop', d: 0.35 })
  })

  it('L8 desk: shelves with explicit startY 1.75 above', () => {
    const l = getLayoutById(8)!
    expect(l.fillZone.above).toMatchObject({ type: 'shelves', startY: 1.75 })
  })
})
