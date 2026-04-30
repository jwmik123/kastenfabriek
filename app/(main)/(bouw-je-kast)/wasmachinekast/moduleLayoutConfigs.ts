import { getLayoutById } from '../kledingkast/scene/moduleLayouts'
import type { ModuleLayoutConfig } from '../kledingkast/scene/moduleLayouts'
import { MODULE_FLOOR_Y } from '../kledingkast/scene/closetConstants'

const WASHER_HEIGHT = 0.90

const WASHER_SINGLE_CONFIG: ModuleLayoutConfig = {
  id: 11,
  label: 'Wasmachine (enkel)',
  description: '1 wasmachine — minimaal 65 cm breed',
  specialElement: {
    glbPath: '/objects/washermodules/ModuleWasherSingle.glb',
    height: WASHER_HEIGHT,
    anchor: { type: 'fixed', fromBottom: -MODULE_FLOOR_Y },
    centered: true,
    noDoorDepthOffset: 0.031,
    glbMaterialMeshes: ['Plane051_1'],
    chromeMaterialMeshes: ['Plane051_2'],
    glassMaterialMeshes: ['Plane051_5'],
  },
  fillZone: {
    above: { type: 'open' },
    below: { type: 'open' },
  },
}

const WASHER_DOUBLE_GLB_CONFIG: ModuleLayoutConfig = {
  id: 13,
  label: 'Wasmachine (dubbel model)',
  description: '2 wasmachines in één kast — minimaal 65 cm breed',
  specialElement: {
    glbPath: '/objects/washermodules/ModuleWasherDouble.glb',
    height: WASHER_HEIGHT,
    anchor: { type: 'fixed', fromBottom: -MODULE_FLOOR_Y },
    centered: true,
    noDoorDepthOffset: 0.031,
    glbMaterialMeshes: ['Plane005_1'],
    chromeMaterialMeshes: ['Plane005_2'],
    glassMaterialMeshes: ['Plane005_5'],
  },
  fillZone: {
    above: { type: 'open' },
    below: { type: 'open' },
  },
}

const WASHER_PLANK_CONFIG: ModuleLayoutConfig = {
  id: 14,
  label: 'Wasmachine met plank',
  description: 'Wasmachine met een plank erboven — minimaal 65 cm breed',
  specialElement: {
    glbPath: '/objects/washermodules/ModuleWasherPlank.glb',
    height: WASHER_HEIGHT,
    anchor: { type: 'fixed', fromBottom: -MODULE_FLOOR_Y },
    centered: true,
    noDoorDepthOffset: 0.031,
    glbMaterialMeshes: ['Mesh929', 'Mesh928', 'Plane006_1'],
    chromeMaterialMeshes: ['Plane006_2'],
    glassMaterialMeshes: ['Plane006_5'],
  },
  fillZone: {
    above: { type: 'open' },
    below: { type: 'open' },
  },
}

const WASHER_CONFIGS: Record<number, ModuleLayoutConfig> = {
  11: WASHER_SINGLE_CONFIG,
  13: WASHER_DOUBLE_GLB_CONFIG,
  14: WASHER_PLANK_CONFIG,
}

export function getWasmLayoutConfig(layoutId: number): ModuleLayoutConfig | undefined {
  return WASHER_CONFIGS[layoutId] ?? getLayoutById(layoutId)
}
