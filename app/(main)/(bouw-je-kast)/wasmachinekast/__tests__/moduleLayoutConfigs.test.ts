import { describe, it, expect } from 'vitest'
import { getWasmLayoutConfig } from '../moduleLayoutConfigs'
import { MODULE_FLOOR_Y } from '../../kledingkast/scene/closetConstants'

describe('getWasmLayoutConfig — washer variants', () => {
  describe('WASHER_SINGLE (id 11)', () => {
    it('uses real washer GLB path', () => {
      const cfg = getWasmLayoutConfig(11)!
      expect(cfg.specialElement.glbPath).toBe('/objects/washermodules/ModuleWasherSingle.glb')
    })

    it('has centered: true', () => {
      const cfg = getWasmLayoutConfig(11)!
      expect(cfg.specialElement.centered).toBe(true)
    })

    it('does not have stacked flag', () => {
      const cfg = getWasmLayoutConfig(11)!
      expect(cfg.specialElement.stacked).toBeFalsy()
    })

    it('uses fixed fromBottom: 0 anchor', () => {
      const cfg = getWasmLayoutConfig(11)!
      expect(cfg.specialElement.anchor).toEqual({ type: 'fixed', fromBottom: -MODULE_FLOOR_Y })
    })

    it('fill above is open', () => {
      const cfg = getWasmLayoutConfig(11)!
      expect(cfg.fillZone.above.type).toBe('open')
    })

    it('fill below is open', () => {
      const cfg = getWasmLayoutConfig(11)!
      expect(cfg.fillZone.below.type).toBe('open')
    })
  })

  describe('WASHER_DOUBLE_GLB (id 13)', () => {
    it('returns a config', () => {
      expect(getWasmLayoutConfig(13)).toBeDefined()
    })

    it('uses double GLB path', () => {
      const cfg = getWasmLayoutConfig(13)!
      expect(cfg.specialElement.glbPath).toBe('/objects/washermodules/ModuleWasherDouble.glb')
    })

    it('has centered: true', () => {
      const cfg = getWasmLayoutConfig(13)!
      expect(cfg.specialElement.centered).toBe(true)
    })

    it('uses fixed fromBottom: 0 anchor', () => {
      const cfg = getWasmLayoutConfig(13)!
      expect(cfg.specialElement.anchor).toEqual({ type: 'fixed', fromBottom: -MODULE_FLOOR_Y })
    })

    it('fill above is open', () => {
      const cfg = getWasmLayoutConfig(13)!
      expect(cfg.fillZone.above.type).toBe('open')
    })

    it('fill below is open', () => {
      const cfg = getWasmLayoutConfig(13)!
      expect(cfg.fillZone.below.type).toBe('open')
    })
  })

  describe('WASHER_PLANK (id 14)', () => {
    it('returns a config', () => {
      expect(getWasmLayoutConfig(14)).toBeDefined()
    })

    it('uses plank GLB path', () => {
      const cfg = getWasmLayoutConfig(14)!
      expect(cfg.specialElement.glbPath).toBe('/objects/washermodules/ModuleWasherPlank.glb')
    })

    it('has centered: true', () => {
      const cfg = getWasmLayoutConfig(14)!
      expect(cfg.specialElement.centered).toBe(true)
    })

    it('uses fixed fromBottom: 0 anchor', () => {
      const cfg = getWasmLayoutConfig(14)!
      expect(cfg.specialElement.anchor).toEqual({ type: 'fixed', fromBottom: -MODULE_FLOOR_Y })
    })

    it('fill above is open', () => {
      const cfg = getWasmLayoutConfig(14)!
      expect(cfg.fillZone.above.type).toBe('open')
    })

    it('fill below is open', () => {
      const cfg = getWasmLayoutConfig(14)!
      expect(cfg.fillZone.below.type).toBe('open')
    })
  })
})
