import { describe, it, expect } from 'vitest'
import { getWasmLayoutConfig } from '../moduleLayoutConfigs'

describe('getWasmLayoutConfig — high-section washer variants', () => {
  describe.each([
    {
      id: 11,
      glb: '/objects/washermodules/ModuleWasherSingle.glb',
    },
    {
      id: 13,
      glb: '/objects/washermodules/ModuleWasherDouble.glb',
    },
    {
      id: 14,
      glb: '/objects/washermodules/ModuleWasherPlank.glb',
    },
  ])('washer id $id', ({ id, glb }) => {
    it('exposes a single element with the expected GLB', () => {
      const cfg = getWasmLayoutConfig(id)!
      expect(cfg.elements).toHaveLength(1)
      expect(cfg.elements[0].glbPath).toBe(glb)
    })

    it('element is centered', () => {
      const cfg = getWasmLayoutConfig(id)!
      expect(cfg.elements[0].centered).toBe(true)
    })

    it('uses fromBottom anchor at 0 (sits on module floor panel)', () => {
      const cfg = getWasmLayoutConfig(id)!
      expect(cfg.elements[0].anchor).toEqual({ type: 'fromBottom', d: 0 })
    })

    it('preserves noDoorDepthOffset on the element', () => {
      const cfg = getWasmLayoutConfig(id)!
      expect(cfg.elements[0].noDoorDepthOffset).toBe(0.031)
    })

    it('fill zones are both open', () => {
      const cfg = getWasmLayoutConfig(id)!
      expect(cfg.fillZone.above.type).toBe('open')
      expect(cfg.fillZone.below.type).toBe('open')
    })
  })
})

describe('getWasmLayoutConfig — lage kast variants', () => {
  describe.each([
    {
      id: 20,
      glb: '/objects/washermodules/12_WMPlankLow.glb',
    },
    {
      id: 21,
      glb: '/objects/washermodules/13_WMSingleLow.glb',
    },
    {
      id: 22,
      glb: '/objects/washermodules/14_WMDoubleLow.glb',
    },
    {
      id: 23,
      glb: '/objects/washermodules/WMWasherOnlyLow.glb',
    },
  ])('lage kast id $id', ({ id, glb }) => {
    it('exposes a single element with the expected GLB', () => {
      const cfg = getWasmLayoutConfig(id)!
      expect(cfg.elements).toHaveLength(1)
      expect(cfg.elements[0].glbPath).toBe(glb)
    })

    it('element is centered', () => {
      const cfg = getWasmLayoutConfig(id)!
      expect(cfg.elements[0].centered).toBe(true)
    })

    it('uses fromBottom anchor at 0', () => {
      const cfg = getWasmLayoutConfig(id)!
      expect(cfg.elements[0].anchor).toEqual({ type: 'fromBottom', d: 0 })
    })

    it('fill zones are both open (GLB fills the slot)', () => {
      const cfg = getWasmLayoutConfig(id)!
      expect(cfg.fillZone.above.type).toBe('open')
      expect(cfg.fillZone.below.type).toBe('open')
    })

    it('minSlotHeight is the lage kast height (0.90)', () => {
      const cfg = getWasmLayoutConfig(id)!
      expect(cfg.minSlotHeight).toBe(0.90)
    })
  })
})
