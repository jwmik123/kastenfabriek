import { describe, it, expect } from 'vitest'
import {
  METALS,
  HANDLE_MATERIAL_IDS,
  DEFAULT_HANDLE_MATERIAL,
  getMetal,
  LEATHERS,
  LEATHER_COLOR_IDS,
  getLeather,
  type HandleMaterial,
  type LeatherColor,
} from '../handleMaterials'

const EXPECTED_IDS: HandleMaterial[] = [
  'chrome',
  'black',
  'brass',
  'copper',
  'rose-gold',
  'silver',
  'old-silver',
  'stainless',
  'aluminium',
  'gray-blue',
  'gray',
  'white',
]

describe('METALS registry', () => {
  it('exposes all 12 metals in declared order', () => {
    expect(METALS.map((m) => m.id)).toEqual(EXPECTED_IDS)
    expect(HANDLE_MATERIAL_IDS).toEqual(EXPECTED_IDS)
  })

  it('every entry has id, label, swatch hex, and PBR config', () => {
    for (const m of METALS) {
      expect(m.id).toBeTruthy()
      expect(m.label).toBeTruthy()
      expect(m.swatch).toMatch(/^#[0-9a-f]{6}$/i)
      expect(typeof m.pbr.color).toBe('number')
      expect(m.pbr.metalness).toBeGreaterThanOrEqual(0)
      expect(m.pbr.metalness).toBeLessThanOrEqual(1)
      expect(m.pbr.roughness).toBeGreaterThanOrEqual(0)
      expect(m.pbr.roughness).toBeLessThanOrEqual(1)
      expect(m.pbr.envMapIntensity).toBeGreaterThan(0)
    }
  })

  it('default handle material is chrome', () => {
    expect(DEFAULT_HANDLE_MATERIAL).toBe('chrome')
  })

  it('getMetal returns matching entry; falls back to first on unknown', () => {
    expect(getMetal('brass').id).toBe('brass')
    expect(getMetal('white').label).toBe('Wit')
    // @ts-expect-error — defensive fallback for an out-of-band id
    expect(getMetal('not-a-metal').id).toBe('chrome')
  })

  it('labels are unique', () => {
    const labels = METALS.map((m) => m.label)
    expect(new Set(labels).size).toBe(labels.length)
  })
})

const EXPECTED_LEATHER_IDS: LeatherColor[] = [
  'leather-pink',
  'leather-beige',
  'leather-brown',
  'leather-light-gray',
  'leather-black',
]

describe('LEATHERS registry', () => {
  it('exposes all 4 leathers in declared order', () => {
    expect(LEATHERS.map((l) => l.id)).toEqual(EXPECTED_LEATHER_IDS)
    expect(LEATHER_COLOR_IDS).toEqual(EXPECTED_LEATHER_IDS)
  })

  it('every entry has id, label and hex', () => {
    for (const l of LEATHERS) {
      expect(l.id).toBeTruthy()
      expect(l.label).toBeTruthy()
      expect(l.hex).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })

  it('getLeather returns matching entry; falls back to first on unknown', () => {
    expect(getLeather('leather-beige').id).toBe('leather-beige')
    expect(getLeather('leather-black').label).toBe('Zwart')
    // @ts-expect-error — defensive fallback for an out-of-band id
    expect(getLeather('not-a-leather').id).toBe('leather-pink')
  })

  it('labels are unique', () => {
    const labels = LEATHERS.map((l) => l.label)
    expect(new Set(labels).size).toBe(labels.length)
  })
})
