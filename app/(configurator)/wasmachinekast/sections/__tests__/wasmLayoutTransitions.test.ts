import { describe, it, expect } from 'vitest'
import { transition } from '../wasmLayoutTransitions'
import type {
  Section,
  SharedMaterials,
  WasmLayout,
  WasmSectionsState,
} from '../types'

const shared: SharedMaterials = {
  buitenkantMaterialId: 'antraciet',
  binnenkantMaterialId: 'wit',
}

const mkModules = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    slotIndex: i,
    layoutId: null,
    hasDoor: true,
    span: 1 as 1,
    hasPowerHole: false,
  }))

const high: Section = {
  width: 160,
  height: 240,
  moduleCount: 2,
  modules: mkModules(2),
}

const low: Section = {
  width: 160,
  height: 90,
  moduleCount: 2,
  modules: mkModules(2),
  topPanelThicknessMm: 18,
  countertopMaterialId: 'antraciet',
}

const HIGH_ONLY: WasmSectionsState = {
  layout: 'high-only',
  highSection: high,
  lowSection: null,
}
const LOW_ONLY: WasmSectionsState = {
  layout: 'low-only',
  highSection: null,
  lowSection: low,
}
const LOW_LEFT: WasmSectionsState = {
  layout: 'low-left',
  highSection: high,
  lowSection: low,
}
const LOW_RIGHT: WasmSectionsState = {
  layout: 'low-right',
  highSection: high,
  lowSection: low,
}

interface Case {
  name: string
  from: WasmSectionsState
  to: WasmLayout
  expectConfirm: boolean
  assertNext: (s: WasmSectionsState) => void
}

const cases: Case[] = [
  // ── from high-only ───────────────────────────────────────────────────────
  {
    name: 'high-only → high-only (noop)',
    from: HIGH_ONLY,
    to: 'high-only',
    expectConfirm: false,
    assertNext: (s) => expect(s).toEqual(HIGH_ONLY),
  },
  {
    name: 'high-only → low-only (drop high, create default low)',
    from: HIGH_ONLY,
    to: 'low-only',
    expectConfirm: true,
    assertNext: (s) => {
      expect(s.layout).toBe('low-only')
      expect(s.highSection).toBeNull()
      expect(s.lowSection).not.toBeNull()
      expect(s.lowSection?.height).toBe(90)
      expect(s.lowSection?.width).toBe(high.width)
    },
  },
  {
    name: 'high-only → low-left (preserve high, add default low, no confirm)',
    from: HIGH_ONLY,
    to: 'low-left',
    expectConfirm: false,
    assertNext: (s) => {
      expect(s.layout).toBe('low-left')
      expect(s.highSection).toEqual(high)
      expect(s.lowSection?.width).toBe(high.width)
    },
  },
  {
    name: 'high-only → low-right (preserve high, add default low, no confirm)',
    from: HIGH_ONLY,
    to: 'low-right',
    expectConfirm: false,
    assertNext: (s) => {
      expect(s.layout).toBe('low-right')
      expect(s.highSection).toEqual(high)
      expect(s.lowSection).not.toBeNull()
    },
  },

  // ── from low-only ────────────────────────────────────────────────────────
  {
    name: 'low-only → high-only (drop low, create default high)',
    from: LOW_ONLY,
    to: 'high-only',
    expectConfirm: true,
    assertNext: (s) => {
      expect(s.layout).toBe('high-only')
      expect(s.lowSection).toBeNull()
      expect(s.highSection).not.toBeNull()
    },
  },
  {
    name: 'low-only → low-only (noop)',
    from: LOW_ONLY,
    to: 'low-only',
    expectConfirm: false,
    assertNext: (s) => expect(s).toEqual(LOW_ONLY),
  },
  {
    name: 'low-only → low-left (preserve low, add default high, no confirm)',
    from: LOW_ONLY,
    to: 'low-left',
    expectConfirm: false,
    assertNext: (s) => {
      expect(s.layout).toBe('low-left')
      expect(s.lowSection).toEqual(low)
      expect(s.highSection?.width).toBe(low.width)
    },
  },
  {
    name: 'low-only → low-right (preserve low, add default high, no confirm)',
    from: LOW_ONLY,
    to: 'low-right',
    expectConfirm: false,
    assertNext: (s) => {
      expect(s.layout).toBe('low-right')
      expect(s.lowSection).toEqual(low)
      expect(s.highSection).not.toBeNull()
    },
  },

  // ── from low-left ────────────────────────────────────────────────────────
  {
    name: 'low-left → high-only (drop low, requires confirm)',
    from: LOW_LEFT,
    to: 'high-only',
    expectConfirm: true,
    assertNext: (s) => {
      expect(s.layout).toBe('high-only')
      expect(s.highSection).toEqual(high)
      expect(s.lowSection).toBeNull()
    },
  },
  {
    name: 'low-left → low-only (drop high, requires confirm)',
    from: LOW_LEFT,
    to: 'low-only',
    expectConfirm: true,
    assertNext: (s) => {
      expect(s.layout).toBe('low-only')
      expect(s.lowSection).toEqual(low)
      expect(s.highSection).toBeNull()
    },
  },
  {
    name: 'low-left → low-left (noop)',
    from: LOW_LEFT,
    to: 'low-left',
    expectConfirm: false,
    assertNext: (s) => expect(s).toEqual(LOW_LEFT),
  },
  {
    name: 'low-left → low-right (mirror swap, preserve both, no confirm)',
    from: LOW_LEFT,
    to: 'low-right',
    expectConfirm: false,
    assertNext: (s) => {
      expect(s.layout).toBe('low-right')
      expect(s.highSection).toEqual(high)
      expect(s.lowSection).toEqual(low)
    },
  },

  // ── from low-right ───────────────────────────────────────────────────────
  {
    name: 'low-right → high-only (drop low, requires confirm)',
    from: LOW_RIGHT,
    to: 'high-only',
    expectConfirm: true,
    assertNext: (s) => {
      expect(s.layout).toBe('high-only')
      expect(s.highSection).toEqual(high)
      expect(s.lowSection).toBeNull()
    },
  },
  {
    name: 'low-right → low-only (drop high, requires confirm)',
    from: LOW_RIGHT,
    to: 'low-only',
    expectConfirm: true,
    assertNext: (s) => {
      expect(s.layout).toBe('low-only')
      expect(s.lowSection).toEqual(low)
      expect(s.highSection).toBeNull()
    },
  },
  {
    name: 'low-right → low-left (mirror swap, preserve both, no confirm)',
    from: LOW_RIGHT,
    to: 'low-left',
    expectConfirm: false,
    assertNext: (s) => {
      expect(s.layout).toBe('low-left')
      expect(s.highSection).toEqual(high)
      expect(s.lowSection).toEqual(low)
    },
  },
  {
    name: 'low-right → low-right (noop)',
    from: LOW_RIGHT,
    to: 'low-right',
    expectConfirm: false,
    assertNext: (s) => expect(s).toEqual(LOW_RIGHT),
  },
]

describe('wasmLayoutTransitions — all 16 layout-pair transitions', () => {
  for (const c of cases) {
    it(c.name, () => {
      const result = transition(c.from, c.to, shared)
      expect(result.requiresConfirm).toBe(c.expectConfirm)
      c.assertNext(result.nextState)
    })
  }
})
