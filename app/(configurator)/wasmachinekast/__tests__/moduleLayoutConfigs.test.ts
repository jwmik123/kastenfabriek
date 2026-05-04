import { describe, it, expect } from 'vitest'
import { getWasmLayoutConfig } from '../moduleLayoutConfigs'
import { MODULE_FLOOR_Y } from '../../kledingkast/scene/closetConstants'

describe('getWasmLayoutConfig — washer variants', () => {
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

    it('uses fromBottom anchor at -MODULE_FLOOR_Y (world floor)', () => {
      const cfg = getWasmLayoutConfig(id)!
      expect(cfg.elements[0].anchor).toEqual({ type: 'fromBottom', d: -MODULE_FLOOR_Y })
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
