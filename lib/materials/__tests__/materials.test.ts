import { afterEach, describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import {
  DEFAULT_MATERIALS,
  findMaterial,
  getAllMaterials,
  getMaterialName,
  isTextureMaterial,
  selectableMaterials,
  setMaterials,
  type Material,
} from '..'

const PUBLIC = join(process.cwd(), 'public')

afterEach(() => setMaterials(DEFAULT_MATERIALS))

describe('built-in materials', () => {
  it('have unique ids', () => {
    const ids = DEFAULT_MATERIALS.map((m) => m.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('texture files exist on disk', () => {
    for (const m of DEFAULT_MATERIALS) {
      if (m.type !== 'texture') continue
      expect(existsSync(join(PUBLIC, m.preview))).toBe(true)
      expect(existsSync(join(PUBLIC, m.maps.color))).toBe(true)
    }
  })

  it('room renders exist on disk', () => {
    for (const m of DEFAULT_MATERIALS) {
      for (const src of m.roomImages ?? []) expect(existsSync(join(PUBLIC, src))).toBe(true)
    }
  })
})

describe('material registry', () => {
  const sanityList: Material[] = [
    { id: 'saliegroen', name: 'Saliegroen', type: 'color', color: '#9CAF88', active: true },
    { id: 'zwart', name: 'Diepzwart', type: 'color', color: '#000000', active: false },
  ]

  it('serves the built-in list until filled', () => {
    expect(getAllMaterials()).toBe(DEFAULT_MATERIALS)
  })

  it('serves the Sanity list once set', () => {
    setMaterials(sanityList)
    expect(getAllMaterials()).toBe(sanityList)
    expect(getMaterialName('saliegroen')).toBe('Saliegroen')
    expect(getMaterialName('zwart')).toBe('Diepzwart')
  })

  it('keeps the built-in list when Sanity returns nothing', () => {
    setMaterials([])
    expect(getAllMaterials()).toBe(DEFAULT_MATERIALS)
  })

  it('still resolves ids removed from Sanity via the built-in list', () => {
    setMaterials(sanityList)
    expect(getMaterialName('h1714-lincoln-notelaar')).toBe('Lincoln Notelaar')
    expect(isTextureMaterial('h1714-lincoln-notelaar')).toBe(true)
  })

  it('falls back to the id for unknown materials', () => {
    expect(getMaterialName('bestaat-niet')).toBe('bestaat-niet')
    expect(findMaterial(undefined)).toBeUndefined()
  })

  it('hides inactive materials from pickers', () => {
    expect(selectableMaterials(sanityList).map((m) => m.id)).toEqual(['saliegroen'])
  })
})
