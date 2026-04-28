import { getLayoutById, SHELF_SPACING } from '../kledingkast/scene/moduleLayouts'
import type { ModuleLayoutConfig } from '../kledingkast/scene/moduleLayouts'

const WASHER_HEIGHT = 0.90
const WASHER_STACKED_HEIGHT = 1.80 // 2 × 0.90m

const WASHER_SINGLE_CONFIG: ModuleLayoutConfig = {
  id: 11,
  label: 'Wasmachine (enkel)',
  description: '1 wasmachine — minimaal 65 cm breed',
  specialElement: {
    glbPath: '/objects/washer.glb',
    height: WASHER_HEIGHT,
    anchor: { type: 'fixed', fromBottom: 0 },
  },
  fillZone: {
    above: { type: 'shelves', spacing: SHELF_SPACING },
    below: { type: 'open' },
  },
}

const WASHER_DOUBLE_CONFIG: ModuleLayoutConfig = {
  id: 12,
  label: 'Wasmachine (dubbel naast elkaar)',
  description: '2 wasmachines naast elkaar — minimaal 130 cm breed',
  specialElement: {
    glbPath: '/objects/washer.glb',
    height: WASHER_HEIGHT,
    anchor: { type: 'fixed', fromBottom: 0 },
  },
  fillZone: {
    above: { type: 'shelves', spacing: SHELF_SPACING },
    below: { type: 'open' },
  },
}

const WASHER_STACKED_CONFIG: ModuleLayoutConfig = {
  id: 13,
  label: 'Wasmachine (gestapeld)',
  description: '2 wasmachines op elkaar — minimaal 65 cm breed',
  specialElement: {
    glbPath: '/objects/washer.glb',
    height: WASHER_STACKED_HEIGHT,
    anchor: { type: 'fixed', fromBottom: 0 },
  },
  fillZone: {
    above: { type: 'shelves', spacing: SHELF_SPACING },
    below: { type: 'open' },
  },
}

const WASHER_CONFIGS: Record<number, ModuleLayoutConfig> = {
  11: WASHER_SINGLE_CONFIG,
  12: WASHER_DOUBLE_CONFIG,
  13: WASHER_STACKED_CONFIG,
}

export function getWasmLayoutConfig(layoutId: number): ModuleLayoutConfig | undefined {
  return WASHER_CONFIGS[layoutId] ?? getLayoutById(layoutId)
}
