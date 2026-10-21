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
      drawerMeshes: [
        'WMSingleFront_extend', 'WMSingleLeft1_ds', 'WMSingleRight1_ds', 'WMSingleBottom1_ds', 'WMSingleBack',
      ],
      insetFronts: { between: ['WMSinglePanel3Left_ds', 'WMSinglePanel3Right_ds'], top: 'WMSingleShelf1_ds' },
    },
  ],
  fillZone: {
    above: { type: 'open' },
    below: { type: 'open' },
  },
  minSlotHeight: WASHER_HEIGHT,
  // WMSingleFront_extend — one drawer under the machine.
  drawerFrontCount: 1,
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
      drawerMeshes: [
        'WMDoubleFront1_extend', 'WMDoubleFront2', 'WMDoubleBack1', 'WMDoubleBack2',
        'WMDoubleBottom1_ds', 'WMDoubleBottom2_ds', 'WMDoubleLeft1_ds', 'WMDoubleLeft2_ds',
        'WMDoubleRight1_ds', 'WMDoubleRight2_ds', 'WMDoubleFixedLeft', 'WMDoubleFixedRight',
      ],
      insetFronts: { between: ['WMDoublePanel3Left_ds', 'WMDoublePanel3Right_ds'], top: 'WMDoubleShelf1_ds' },
    },
  ],
  fillZone: {
    above: { type: 'open' },
    below: { type: 'open' },
  },
  minSlotHeight: WASHER_HEIGHT,
  // WMDoubleFront1_extend + WMDoubleFront2 — two drawers under the machine.
  drawerFrontCount: 2,
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
      // The pull-out plank (with its own front) and its runners move with the drawers.
      drawerMeshes: [
        'WMPlankFront1_extend', 'WMPlankFront2', 'WMPlankPlank', 'WMPlankBack', 'WMPlankBottom_ds',
        'WMPlankLeft_ds', 'WMPlankRight_ds', 'WMPlankFixedLeft1', 'WMPlankFixedLeft2',
        'WMPlankFixedRight1', 'WMPlankFixedRight2',
      ],
      insetFronts: { between: ['WMPlankPanel3Left_ds', 'WMPlankPanel3Right_ds'], top: 'WMPlankShelf1_ds' },
    },
  ],
  fillZone: {
    above: { type: 'open' },
    below: { type: 'open' },
  },
  minSlotHeight: WASHER_HEIGHT,
  // WMPlankFront1_extend + WMPlankFront2 — two drawers under the machine.
  drawerFrontCount: 2,
}

const WASHER_WMOPEN_CONFIG: ModuleLayoutConfig = {
  id: 23,
  label: 'Wasmachine (lage kast)',
  description: 'Wasmachine onder werkblad — minimaal 68.6 cm breed',
  elements: [
    {
      glbPath: '/objects/washermodules/WMWasherOnlyLow.glb',
      anchor: { type: 'fromBottom', d: 0 },
      centered: true,
      glbMaterialMeshes: ['Plane005_1'],
      chromeMaterialMeshes: ['Plane005_2'],
      glassMaterialMeshes: ['Plane005_5'],
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
      noDoorDepthOffset: 0.031,
      // Modelled for a 68.6 cm slot; fronts span the slot, not the opening.
      nativeSlotWidth: 0.686,
      // Cabinet-mounted halves of the drawer runners: hardware, not panelwork.
      chromeMaterialMeshes: ['WMPlankLowFixedLeft', 'WMPlankLowFixedRight'],
      widthScaleMeshes: [
        'WMPlankLowBack',
        'WMPlankLowBottom_ds',
        'WMPlankLowFront1_extend',
        'WMPlankLowFront2',
        'WMPlankLowPlank',
      ],
    },
  ],
  fillZone: {
    above: { type: 'open' },
    below: { type: 'open' },
  },
  minSlotHeight: LOW_MODULE_HEIGHT,
  lowFronts: true,
  drawerFrontCount: 2,
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
      noDoorDepthOffset: 0.031,
      // Modelled for a 68.6 cm slot; fronts span the slot, not the opening.
      nativeSlotWidth: 0.686,
      chromeMaterialMeshes: ['WMSingleLowFixedLeft', 'WMSingleLowFixedRight'],
      widthScaleMeshes: [
        'WMSingleLowBack',
        'WMSingleLowBottom_ds',
        'WMSingleLowFront_extend',
      ],
    },
  ],
  fillZone: {
    above: { type: 'open' },
    below: { type: 'open' },
  },
  minSlotHeight: LOW_MODULE_HEIGHT,
  lowFronts: true,
  drawerFrontCount: 1,
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
      noDoorDepthOffset: 0.031,
      // Modelled for a 68.6 cm slot; fronts span the slot, not the opening.
      nativeSlotWidth: 0.686,
      chromeMaterialMeshes: ['WMDoubleLowFixedLeft', 'WMDoubleLowFixedRight'],
      widthScaleMeshes: [
        'WMDoubleLowBack1',
        'WMDoubleLowBack2',
        'WMDoubleLowBottom1_ds',
        'WMDoubleLowBottom2_ds',
        'WMDoubleLowFront1_extend',
        'WMDoubleLowFront2',
      ],
    },
  ],
  fillZone: {
    above: { type: 'open' },
    below: { type: 'open' },
  },
  minSlotHeight: LOW_MODULE_HEIGHT,
  lowFronts: true,
  drawerFrontCount: 2,
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

/** Every wasm-specific config, for tooling that walks all GLB references. */
export const WASM_MODULE_LAYOUT_CONFIGS: ModuleLayoutConfig[] =
  Object.values(WASM_HARDCODED_CONFIGS)
