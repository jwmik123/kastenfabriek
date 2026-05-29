import { describe, it, expect } from 'vitest'
import {
  validateHandleMaterial,
  type HandleMaterial,
} from '../validateHandleMaterial'

describe('validateHandleMaterial', () => {
  it('current is in allowed → pass-through', () => {
    expect(validateHandleMaterial('brass', ['chrome', 'brass'])).toBe('brass')
  })

  it('current not in allowed → returns first allowed', () => {
    expect(validateHandleMaterial('brass', ['chrome', 'black'])).toBe('chrome')
  })

  it('current not in allowed → returns first allowed (single-entry list)', () => {
    expect(validateHandleMaterial('chrome', ['brass'])).toBe('brass')
  })

  it('allowed undefined → pass-through current', () => {
    expect(validateHandleMaterial('black', undefined)).toBe('black')
  })

  it('allowed empty → pass-through current', () => {
    expect(validateHandleMaterial('black', [])).toBe('black')
  })

  it('current outside known metal union with allowed list → returns first allowed', () => {
    const bogus = 'bronze' as unknown as HandleMaterial
    expect(validateHandleMaterial(bogus, ['brass', 'chrome'])).toBe('brass')
  })

  it('current outside known metal union with allowed undefined → defensive default chrome', () => {
    const bogus = 'bronze' as unknown as HandleMaterial
    expect(validateHandleMaterial(bogus, undefined)).toBe('chrome')
  })

  it('current outside known metal union with allowed empty → defensive default chrome', () => {
    const bogus = 'bronze' as unknown as HandleMaterial
    expect(validateHandleMaterial(bogus, [])).toBe('chrome')
  })

  it('chrome with chrome-only allowed → chrome', () => {
    expect(validateHandleMaterial('chrome', ['chrome'])).toBe('chrome')
  })
})
