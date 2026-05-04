import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { VENEERS } from '../../_shared/materials/veneers'

const PUBLIC = join(process.cwd(), 'public')

describe('veneer registry', () => {
  it('declares all five veneers with required fields', () => {
    const ids = VENEERS.map((v) => v.id)
    expect(ids).toEqual([
      'h1199-thermo-eik',
      'h1714-lincoln-notelaar',
      'h3158-vicenza-eik-grijs',
      'h3165-vicenza-eik-licht',
      'h3190-fineline-antraciet',
    ])
  })

  it('every entry has a non-empty label and colorPath', () => {
    for (const v of VENEERS) {
      expect(v.label.length).toBeGreaterThan(0)
      expect(v.colorPath.length).toBeGreaterThan(0)
    }
  })

  it('declared colorPath files exist on disk', () => {
    for (const v of VENEERS) {
      expect(existsSync(join(PUBLIC, v.colorPath))).toBe(true)
    }
  })

  it('declared optional normalPath / roughnessPath files exist on disk when set', () => {
    for (const v of VENEERS) {
      if (v.normalPath) {
        expect(existsSync(join(PUBLIC, v.normalPath))).toBe(true)
      }
      if (v.roughnessPath) {
        expect(existsSync(join(PUBLIC, v.roughnessPath))).toBe(true)
      }
    }
  })
})
