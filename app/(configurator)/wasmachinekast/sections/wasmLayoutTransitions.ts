import type { BaseModuleSlot } from '../../_shared/store/types'
import { defaultLowSection } from './wasmSectionDefaults'
import type {
  Section,
  SharedMaterials,
  WasmLayout,
  WasmSectionsState,
} from './types'

const HIGH_DEFAULT_WIDTH_CM = 120
const HIGH_DEFAULT_HEIGHT_CM = 240
const HIGH_DEFAULT_MODULE_COUNT = 2

function emptyModules(count: number): BaseModuleSlot[] {
  return Array.from({ length: count }, (_, i) => ({
    slotIndex: i,
    layoutId: null,
    hasDoor: true,
    span: 1 as 1,
    hasPowerHole: false,
  }))
}

function defaultHighSection(lowSection: Section | null): Section {
  const width = lowSection?.width ?? HIGH_DEFAULT_WIDTH_CM
  return {
    width,
    height: HIGH_DEFAULT_HEIGHT_CM,
    moduleCount: HIGH_DEFAULT_MODULE_COUNT,
    modules: emptyModules(HIGH_DEFAULT_MODULE_COUNT),
  }
}

function layoutHasHigh(layout: WasmLayout): boolean {
  return layout !== 'low-only'
}
function layoutHasLow(layout: WasmLayout): boolean {
  return layout !== 'high-only'
}

export interface TransitionResult {
  nextState: WasmSectionsState
  requiresConfirm: boolean
}

export function transition(
  state: WasmSectionsState,
  nextLayout: WasmLayout,
  shared: SharedMaterials
): TransitionResult {
  if (state.layout === nextLayout) {
    return { nextState: state, requiresConfirm: false }
  }

  const willHaveHigh = layoutHasHigh(nextLayout)
  const willHaveLow = layoutHasLow(nextLayout)

  const droppingHigh = state.highSection !== null && !willHaveHigh
  const droppingLow = state.lowSection !== null && !willHaveLow
  const requiresConfirm = droppingHigh || droppingLow

  const nextHigh: Section | null = willHaveHigh
    ? state.highSection ?? defaultHighSection(state.lowSection)
    : null
  const nextLow: Section | null = willHaveLow
    ? state.lowSection ?? defaultLowSection(state.highSection, shared)
    : null

  // Washers ride along with their own section; the store drops the placements
  // of a section that disappears here.
  return {
    nextState: {
      layout: nextLayout,
      highSection: nextHigh,
      lowSection: nextLow,
    },
    requiresConfirm,
  }
}
