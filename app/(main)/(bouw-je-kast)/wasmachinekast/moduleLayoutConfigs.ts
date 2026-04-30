import { getLayoutById } from '../kledingkast/scene/moduleLayouts'
import type { ModuleLayoutConfig } from '../kledingkast/scene/moduleLayouts'

const WASHER_HEIGHT = 0.90

const WASHER_SINGLE_CONFIG: ModuleLayoutConfig = {
  id: 11,
  label: 'Wasmachine (enkel)',
  description: '1 wasmachine — minimaal 65 cm breed',
  specialElement: {
    glbPath: '/objects/washermodules/ModuleWasherSingle.glb',
    height: WASHER_HEIGHT,
    anchor: { type: 'fixed', fromBottom: 0 },
    centered: true,
  },
  fillZone: {
    above: { type: 'open' },
    below: { type: 'open' },
  },
}

const WASHER_DOUBLE_CONFIG: ModuleLayoutConfig = {
  id: 12,
  label: 'Wasmachine (dubbel naast elkaar)',
  description: '2 wasmachines naast elkaar — minimaal 65 cm per vak',
  specialElement: {
    glbPath: '/objects/washermodules/ModuleWasherSingle.glb',
    height: WASHER_HEIGHT,
    anchor: { type: 'fixed', fromBottom: 0 },
    centered: true,
    double: true,
  },
  fillZone: {
    above: { type: 'open' },
    below: { type: 'open' },
  },
}

const WASHER_CONFIGS: Record<number, ModuleLayoutConfig> = {
  11: WASHER_SINGLE_CONFIG,
  12: WASHER_DOUBLE_CONFIG,
}

export function getWasmLayoutConfig(layoutId: number): ModuleLayoutConfig | undefined {
  return WASHER_CONFIGS[layoutId] ?? getLayoutById(layoutId)
}
