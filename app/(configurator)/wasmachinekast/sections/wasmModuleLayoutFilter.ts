import type { ModuleLayout } from '@/types/configurator-pricing'
import type { SectionType } from './types'

export interface LayoutWithSectionType extends ModuleLayout {
  sectionType?: SectionType
}

export function filterForSection(
  layouts: LayoutWithSectionType[],
  section: 'high' | 'low'
): LayoutWithSectionType[] {
  return layouts.filter((l) => {
    const t = l.sectionType ?? 'both'
    return t === 'both' || t === section
  })
}
