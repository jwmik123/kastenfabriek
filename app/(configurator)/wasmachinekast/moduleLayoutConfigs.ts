import { getLayoutById } from '../kledingkast/scene/moduleLayouts'
import type { ModuleLayoutConfig } from '../kledingkast/scene/moduleLayouts'

const WASHER_HEIGHT = 0.90
const LOW_MODULE_HEIGHT = 0.90

const WASHER_SINGLE_CONFIG: ModuleLayoutConfig = {
  id: 11,
  label: 'Wasmachine (enkel)',
  description: '1 wasmachine — minimaal 65 cm breed',
  elements: [
    {
      glbPath: '/objects/washermodules/ModuleWasherSingle.glb',
      anchor: { type: 'fromBottom', d: 0 },
      centered: true,
      noDoorDepthOffset: 0.031,
      glbMaterialMeshes: ['Plane051_1'],
      chromeMaterialMeshes: ['Plane051_2'],
      glassMaterialMeshes: ['Plane051_5'],
    },
  ],
  fillZone: {
    above: { type: 'open' },
    below: { type: 'open' },
  },
  minSlotHeight: WASHER_HEIGHT,
}

const WASHER_DOUBLE_GLB_CONFIG: ModuleLayoutConfig = {
  id: 13,
  label: 'Wasmachine (dubbel model)',
  description: '2 wasmachines in één kast — minimaal 65 cm breed',
  elements: [
    {
      glbPath: '/objects/washermodules/ModuleWasherDouble.glb',
      anchor: { type: 'fromBottom', d: 0 },
      centered: true,
      noDoorDepthOffset: 0.031,
      glbMaterialMeshes: ['Plane005_1'],
      chromeMaterialMeshes: ['Plane005_2'],
      glassMaterialMeshes: ['Plane005_5'],
    },
  ],
  fillZone: {
    above: { type: 'open' },
    below: { type: 'open' },
  },
  minSlotHeight: WASHER_HEIGHT,
}

const WASHER_PLANK_CONFIG: ModuleLayoutConfig = {
  id: 14,
  label: 'Wasmachine met plank',
  description: 'Wasmachine met een plank erboven — minimaal 65 cm breed',
  elements: [
    {
      glbPath: '/objects/washermodules/ModuleWasherPlank.glb',
      anchor: { type: 'fromBottom', d: 0 },
      centered: true,
      noDoorDepthOffset: 0.031,
      glbMaterialMeshes: ['Mesh929', 'Mesh928', 'Plane006_1'],
      chromeMaterialMeshes: ['Plane006_2'],
      glassMaterialMeshes: ['Plane006_5'],
    },
  ],
  fillZone: {
    above: { type: 'open' },
    below: { type: 'open' },
  },
  minSlotHeight: WASHER_HEIGHT,
}

const WASHER_WMOPEN_CONFIG: ModuleLayoutConfig = {
  id: 23,
  label: 'Wasmachine (lage kast)',
  description: 'Open vak voor wasmachine onder werkblad — minimaal 68.6 cm breed',
  elements: [
    {
      glbPath: '/objects/washermodules/15_WMOpen.glb',
      anchor: { type: 'fromBottom', d: 0 },
      centered: true,
    },
  ],
  fillZone: {
    above: { type: 'open' },
    below: { type: 'open' },
  },
  minSlotHeight: LOW_MODULE_HEIGHT,
  floorMount: true,
}

const WASM_LOW_PLANK_CONFIG: ModuleLayoutConfig = {
  id: 20,
  label: 'Lage kast — plank',
  description: 'Lage kast module met plank',
  elements: [
    {
      glbPath: '/objects/washermodules/12_WMPlankLow.glb',
      anchor: { type: 'fromBottom', d: 0 },
      centered: true,
    },
  ],
  fillZone: {
    above: { type: 'open' },
    below: { type: 'open' },
  },
  minSlotHeight: LOW_MODULE_HEIGHT,
}

const WASM_LOW_SINGLE_CONFIG: ModuleLayoutConfig = {
  id: 21,
  label: 'Lage kast — enkel vak',
  description: 'Lage kast module met één vak',
  elements: [
    {
      glbPath: '/objects/washermodules/13_WMSingleLow.glb',
      anchor: { type: 'fromBottom', d: 0 },
      centered: true,
    },
  ],
  fillZone: {
    above: { type: 'open' },
    below: { type: 'open' },
  },
  minSlotHeight: LOW_MODULE_HEIGHT,
}

const WASM_LOW_DOUBLE_CONFIG: ModuleLayoutConfig = {
  id: 22,
  label: 'Lage kast — dubbel vak',
  description: 'Lage kast module met twee vakken',
  elements: [
    {
      glbPath: '/objects/washermodules/14_WMDoubleLow.glb',
      anchor: { type: 'fromBottom', d: 0 },
      centered: true,
    },
  ],
  fillZone: {
    above: { type: 'open' },
    below: { type: 'open' },
  },
  minSlotHeight: LOW_MODULE_HEIGHT,
}

const WASM_HARDCODED_CONFIGS: Record<number, ModuleLayoutConfig> = {
  11: WASHER_SINGLE_CONFIG,
  13: WASHER_DOUBLE_GLB_CONFIG,
  14: WASHER_PLANK_CONFIG,
  20: WASM_LOW_PLANK_CONFIG,
  21: WASM_LOW_SINGLE_CONFIG,
  22: WASM_LOW_DOUBLE_CONFIG,
  23: WASHER_WMOPEN_CONFIG,
}

export function getWasmLayoutConfig(layoutId: number): ModuleLayoutConfig | undefined {
  return WASM_HARDCODED_CONFIGS[layoutId] ?? getLayoutById(layoutId)
}
