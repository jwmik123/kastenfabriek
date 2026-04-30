import { describe, it, expect } from 'vitest'
import { getWasmLayoutConfig } from '../moduleLayoutConfigs'

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
      expect(cfg.specialElement.anchor).toEqual({ type: 'fixed', fromBottom: 0 })
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

  describe('WASHER_DOUBLE (id 12)', () => {
    it('returns a config', () => {
      expect(getWasmLayoutConfig(12)).toBeDefined()
    })

    it('uses real washer GLB path', () => {
      const cfg = getWasmLayoutConfig(12)!
      expect(cfg.specialElement.glbPath).toBe('/objects/washermodules/ModuleWasherSingle.glb')
    })

    it('uses fixed fromBottom: 0 anchor', () => {
      const cfg = getWasmLayoutConfig(12)!
      expect(cfg.specialElement.anchor).toEqual({ type: 'fixed', fromBottom: 0 })
    })

    it('has centered: true', () => {
      const cfg = getWasmLayoutConfig(12)!
      expect(cfg.specialElement.centered).toBe(true)
    })

    it('has double: true', () => {
      const cfg = getWasmLayoutConfig(12)!
      expect(cfg.specialElement.double).toBe(true)
    })

    it('does not have stacked flag', () => {
      const cfg = getWasmLayoutConfig(12)!
      expect(cfg.specialElement.stacked).toBeFalsy()
    })

    it('fill above is open', () => {
      const cfg = getWasmLayoutConfig(12)!
      expect(cfg.fillZone.above.type).toBe('open')
    })

    it('fill below is open', () => {
      const cfg = getWasmLayoutConfig(12)!
      expect(cfg.fillZone.below.type).toBe('open')
    })
  })

  describe('stacked washer (id 13) — removed', () => {
    it('returns undefined for removed stacked variant', () => {
      expect(getWasmLayoutConfig(13)).toBeUndefined()
    })
  })
})
