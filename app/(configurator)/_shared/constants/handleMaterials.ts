export type HandleMaterial =
  | 'chrome'
  | 'black'
  | 'gold'
  | 'rose-gold'
  | 'silver'
  | 'old-silver'
  | 'gray-blue'
  | 'gray'
  | 'white'

export interface MetalPbr {
  color: number
  metalness: number
  roughness: number
  envMapIntensity: number
  clearcoat?: number
  clearcoatRoughness?: number
}

export interface MetalEntry {
  id: HandleMaterial
  label: string
  swatch: string
  pbr: MetalPbr
}

export const METALS: readonly MetalEntry[] = [
  {
    id: 'chrome',
    label: 'Chrome',
    swatch: '#d3d3d3',
    pbr: {
      color: 0xd3d3d3,
      metalness: 0.9,
      roughness: 0.2,
      envMapIntensity: 2,
      clearcoat: 1,
      clearcoatRoughness: 0,
    },
  },
  {
    id: 'black',
    label: 'Zwart',
    swatch: '#1a1a1a',
    pbr: {
      color: 0x1a1a1a,
      metalness: 0.9,
      roughness: 0.35,
      envMapIntensity: 2,
    },
  },
  {
    id: 'gold',
    label: 'Goud',
    swatch: '#c9a84c',
    pbr: {
      color: 0xc9a84c,
      metalness: 0.9,
      roughness: 0.3,
      envMapIntensity: 2,
    },
  },
  {
    id: 'rose-gold',
    label: 'Rosé goud',
    swatch: '#c98c7a',
    pbr: {
      color: 0xc98c7a,
      metalness: 0.9,
      roughness: 0.3,
      envMapIntensity: 2,
    },
  },
  {
    id: 'silver',
    label: 'Zilver',
    swatch: '#c0c0c0',
    pbr: {
      color: 0xc0c0c0,
      metalness: 0.95,
      roughness: 0.18,
      envMapIntensity: 2,
      clearcoat: 0.6,
      clearcoatRoughness: 0.05,
    },
  },
  {
    id: 'old-silver',
    label: 'Oud zilver',
    swatch: '#9a9690',
    pbr: {
      color: 0x9a9690,
      metalness: 0.85,
      roughness: 0.55,
      envMapIntensity: 1.5,
    },
  },
  {
    id: 'gray-blue',
    label: 'Grijsblauw',
    swatch: '#5d6e7a',
    pbr: {
      color: 0x5d6e7a,
      metalness: 0.85,
      roughness: 0.4,
      envMapIntensity: 1.6,
    },
  },
  {
    id: 'gray',
    label: 'Grijs',
    swatch: '#7a7a7a',
    pbr: {
      color: 0x7a7a7a,
      metalness: 0.85,
      roughness: 0.45,
      envMapIntensity: 1.6,
    },
  },
  {
    id: 'white',
    label: 'Wit',
    swatch: '#ececec',
    pbr: {
      color: 0xececec,
      metalness: 0.5,
      roughness: 0.45,
      envMapIntensity: 1.5,
      clearcoat: 0.4,
      clearcoatRoughness: 0.1,
    },
  },
] as const

export const HANDLE_MATERIAL_IDS: readonly HandleMaterial[] = METALS.map((m) => m.id)

export const DEFAULT_HANDLE_MATERIAL: HandleMaterial = 'chrome'

export function getMetal(id: HandleMaterial): MetalEntry {
  return METALS.find((m) => m.id === id) ?? METALS[0]
}

export type LeatherColor =
  | 'leather-pink'
  | 'leather-beige'
  | 'leather-light-gray'
  | 'leather-black'

export interface LeatherEntry {
  id: LeatherColor
  label: string
  hex: string
}

export const LEATHERS: readonly LeatherEntry[] = [
  { id: 'leather-pink', label: 'Huidskleur roze', hex: '#e6b8a8' },
  { id: 'leather-beige', label: 'Beige', hex: '#c8a884' },
  { id: 'leather-light-gray', label: 'Lichtgrijs', hex: '#a8a8a8' },
  { id: 'leather-black', label: 'Zwart', hex: '#1a1a1a' },
] as const

export const LEATHER_COLOR_IDS: readonly LeatherColor[] = LEATHERS.map((l) => l.id)

export function getLeather(id: LeatherColor): LeatherEntry {
  return LEATHERS.find((l) => l.id === id) ?? LEATHERS[0]
}
