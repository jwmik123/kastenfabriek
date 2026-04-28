import { describe, it, expect } from 'vitest'
import { getWasmLayoutConfig } from '../moduleLayoutConfigs'

describe('getWasmLayoutConfig — washer variants', () => {
  describe('WASHER_SINGLE (id 11)', () => {
    it('uses real washer GLB path', () => {
      const cfg = getWasmLayoutConfig(11)!
      expect(cfg.specialElement.glbPath).toBe('/objects/washer.glb')
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

    it('fill above is shelves', () => {
      const cfg = getWasmLayoutConfig(11)!
      expect(cfg.fillZone.above.type).toBe('shelves')
    })

    it('fill below is open', () => {
      const cfg = getWasmLayoutConfig(11)!
      expect(cfg.fillZone.below.type).toBe('open')
    })
  })

  describe('WASHER_DOUBLE (id 12)', () => {
    it('uses real washer GLB path', () => {
      const cfg = getWasmLayoutConfig(12)!
      expect(cfg.specialElement.glbPath).toBe('/objects/washer.glb')
    })

    it('uses fixed fromBottom: 0 anchor', () => {
      const cfg = getWasmLayoutConfig(12)!
      expect(cfg.specialElement.anchor).toEqual({ type: 'fixed', fromBottom: 0 })
    })

    it('has centered: true', () => {
      const cfg = getWasmLayoutConfig(12)!
      expect(cfg.specialElement.centered).toBe(true)
    })

    it('does not have stacked flag', () => {
      const cfg = getWasmLayoutConfig(12)!
      expect(cfg.specialElement.stacked).toBeFalsy()
    })

    it('fill above is shelves', () => {
      const cfg = getWasmLayoutConfig(12)!
      expect(cfg.fillZone.above.type).toBe('shelves')
    })

    it('fill below is open', () => {
      const cfg = getWasmLayoutConfig(12)!
      expect(cfg.fillZone.below.type).toBe('open')
    })
  })

  describe('WASHER_STACKED (id 13)', () => {
    it('returns a config', () => {
      expect(getWasmLayoutConfig(13)).toBeDefined()
    })

    it('uses real washer GLB path', () => {
      const cfg = getWasmLayoutConfig(13)!
      expect(cfg.specialElement.glbPath).toBe('/objects/washer.glb')
    })

    it('uses fixed fromBottom: 0 anchor', () => {
      const cfg = getWasmLayoutConfig(13)!
      expect(cfg.specialElement.anchor).toEqual({ type: 'fixed', fromBottom: 0 })
    })

    it('has washer zone height of 1.80m (2 × 0.90m)', () => {
      const cfg = getWasmLayoutConfig(13)!
      expect(cfg.specialElement.height).toBeCloseTo(1.80)
    })

    it('has centered: true', () => {
      const cfg = getWasmLayoutConfig(13)!
      expect(cfg.specialElement.centered).toBe(true)
    })

    it('has stacked: true', () => {
      const cfg = getWasmLayoutConfig(13)!
      expect(cfg.specialElement.stacked).toBe(true)
    })

    it('fill above is shelves', () => {
      const cfg = getWasmLayoutConfig(13)!
      expect(cfg.fillZone.above.type).toBe('shelves')
    })

    it('fill below is open', () => {
      const cfg = getWasmLayoutConfig(13)!
      expect(cfg.fillZone.below.type).toBe('open')
    })
  })
})
