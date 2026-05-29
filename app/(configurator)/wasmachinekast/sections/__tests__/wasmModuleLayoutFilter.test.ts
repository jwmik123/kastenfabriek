import { describe, it, expect } from 'vitest'
import { filterForSection, type LayoutWithSectionType } from '../wasmModuleLayoutFilter'

const mk = (
  layoutId: number,
  sectionType: LayoutWithSectionType['sectionType']
): LayoutWithSectionType => ({
  layoutId,
  name: `L${layoutId}`,
  description: '',
  contents: { shelves: 0, rods: 0, drawers: 0 },
  priceSingle: 0,
  priceDouble: 0,
  availableForTopCabinet: true,
  sectionType,
})

const layouts: LayoutWithSectionType[] = [
  mk(1, 'high'),
  mk(2, 'low'),
  mk(3, 'both'),
  mk(4, undefined), // missing sectionType → treated as 'both'
]

describe('filterForSection', () => {
  it("high section yields high + both (and missing sectionType)", () => {
    const ids = filterForSection(layouts, 'high').map((l) => l.layoutId).sort()
    expect(ids).toEqual([1, 3, 4])
  })

  it("low section yields low + both (and missing sectionType)", () => {
    const ids = filterForSection(layouts, 'low').map((l) => l.layoutId).sort()
    expect(ids).toEqual([2, 3, 4])
  })

  it('never returns layouts from the wrong section', () => {
    const high = filterForSection(layouts, 'high')
    const low = filterForSection(layouts, 'low')
    expect(high.find((l) => l.sectionType === 'low')).toBeUndefined()
    expect(low.find((l) => l.sectionType === 'high')).toBeUndefined()
  })
})
