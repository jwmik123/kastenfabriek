import { describe, it, expect } from 'vitest'
import { defaultLowSection } from '../wasmSectionDefaults'
import type { Section, SharedMaterials } from '../types'

const shared: SharedMaterials = {
  buitenkantMaterialId: 'antraciet',
  binnenkantMaterialId: 'wit',
}

const highSection = (width: number): Section => ({
  width,
  height: 240,
  moduleCount: 2,
  modules: [],
})

describe('defaultLowSection', () => {
  it('mirrors width from existing high section', () => {
    expect(defaultLowSection(highSection(180), shared).width).toBe(180)
  })

  it('defaults width to 120cm when no high section', () => {
    expect(defaultLowSection(null, shared).width).toBe(120)
  })

  it('sets height to 90cm', () => {
    expect(defaultLowSection(null, shared).height).toBe(90)
  })

  it('sets moduleCount to 2', () => {
    expect(defaultLowSection(null, shared).moduleCount).toBe(2)
  })

  it('defaults topPanelThicknessMm to 18', () => {
    expect(defaultLowSection(null, shared).topPanelThicknessMm).toBe(18)
  })

  it('copies countertopMaterialId from buitenkant', () => {
    expect(defaultLowSection(null, shared).countertopMaterialId).toBe('antraciet')
  })

  it('creates empty modules with hasDoor:true and layoutId:null', () => {
    const low = defaultLowSection(null, shared)
    expect(low.modules).toHaveLength(2)
    expect(low.modules.every((m) => m.hasDoor)).toBe(true)
    expect(low.modules.every((m) => m.layoutId === null)).toBe(true)
    expect(low.modules.every((m) => m.hasPowerHole === false)).toBe(true)
  })
})
