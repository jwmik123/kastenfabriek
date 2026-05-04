'use client'

import * as THREE from 'three/webgpu'
import { color as tslColor } from 'three/tsl'
import { useLoader } from '@react-three/fiber'
import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { MATERIAL_COLORS } from '../../kledingkast/materials'
import { useStripWarmth } from './StripWarmthContext'
import { createStripWarmthUniforms, buildWarmthNode } from '../shaders/stripWarmth'
import { WardrobeRootGroup, useWardrobeInverse } from './WardrobeRoot'
import { buildTriplanarNodes } from './triplanar'

const TEXTURE_IDS = [
  'h1199-thermo-eik',
  'h1714-lincoln-notelaar',
  'h3158-vicenza-eik-grijs',
  'h3165-vicenza-eik-licht',
  'h3190-fineline-antraciet',
] as const

const TEXTURE_PATHS: Record<string, string> = {
  'h1199-thermo-eik': '/materials/H1199 ST12 Thermo eik zwartbruin.jpg',
  'h1714-lincoln-notelaar': '/materials/H1714 ST19 Lincoln notelaar.jpg',
  'h3158-vicenza-eik-grijs': '/materials/H3158 ST19 Vicenza eik grijs.jpg',
  'h3165-vicenza-eik-licht': '/materials/H3165 ST12 Vicenza eik licht.jpg',
  'h3190-fineline-antraciet': '/materials/H3190 ST19 Fineline metallic antraciet.jpg',
}

// Slice 1 globals — slice 2 replaces these with per-veneer registry values.
const TILE_U = 0.6
const TILE_V = 1.8
const BUMP_SCALE = 0.02
const ANISOTROPY = 0.5
const CLEARCOAT = 0.3
const CLEARCOAT_ROUGHNESS = 0.5
const SHEEN = 0.1
const ROUGHNESS = 0.7

interface MaterialState {
  buitenkantMaterialId: string
  binnenkantMaterialId: string
  lightStripsEnabled: boolean
  textureMaps: Record<string, THREE.Texture>
  chromeMaterial: THREE.MeshPhysicalMaterial
  glassMaterial: THREE.MeshPhysicalMaterial
}

const MaterialContext = createContext<MaterialState | null>(null)

interface ModuleMaterialOverride {
  buitenkantMaterialId?: string
  binnenkantMaterialId?: string
}

const ModuleMaterialOverrideContext = createContext<ModuleMaterialOverride | null>(null)

export function ModuleMaterialOverrideProvider({
  buitenkantMaterialId,
  binnenkantMaterialId,
  children,
}: ModuleMaterialOverride & { children: ReactNode }) {
  const value = useMemo(
    () => ({ buitenkantMaterialId, binnenkantMaterialId }),
    [buitenkantMaterialId, binnenkantMaterialId],
  )
  return (
    <ModuleMaterialOverrideContext.Provider value={value}>
      {children}
    </ModuleMaterialOverrideContext.Provider>
  )
}

export function useChromeMaterialInstance(): THREE.MeshPhysicalMaterial {
  return useContext(MaterialContext)!.chromeMaterial
}

export function useGlassMaterialInstance(): THREE.MeshPhysicalMaterial {
  return useContext(MaterialContext)!.glassMaterial
}

export function ClosetMaterialProvider({
  buitenkantMaterialId,
  binnenkantMaterialId,
  lightStripsEnabled = false,
  children,
}: {
  buitenkantMaterialId: string
  binnenkantMaterialId: string
  lightStripsEnabled?: boolean
  children: ReactNode
}) {

  const loadedTextures = useLoader(THREE.TextureLoader, Object.values(TEXTURE_PATHS))

  const textureMaps = useMemo(() => {
    const map: Record<string, THREE.Texture> = {}
    TEXTURE_IDS.forEach((id, i) => {
      const tex = loadedTextures[i]
      tex.colorSpace = THREE.SRGBColorSpace
      // Triplanar drives sampling via uvNode; wrap modes still apply per fragment.
      tex.wrapS = THREE.RepeatWrapping
      tex.wrapT = THREE.RepeatWrapping
      tex.center.set(0, 0)
      tex.rotation = 0
      tex.needsUpdate = true
      map[id] = tex
    })
    return map
  }, [loadedTextures])

  const chromeMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: 0xd3d3d3,
    metalness: 0.9,
    roughness: 0.2,
    envMapIntensity: 2,
    clearcoat: 1,
    clearcoatRoughness: 0,
  }), [])

  const glassMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: 0x111111,
    roughness: 0,
    metalness: 0,
    reflectivity: 1,
    ior: 1.5,
    clearcoat: 1,
    clearcoatRoughness: 0,
    envMapIntensity: 2,
  }), [])

  const state = useMemo<MaterialState>(
    () => ({ buitenkantMaterialId, binnenkantMaterialId, lightStripsEnabled, textureMaps, chromeMaterial, glassMaterial }),
    [buitenkantMaterialId, binnenkantMaterialId, lightStripsEnabled, textureMaps, chromeMaterial, glassMaterial],
  )

  return (
    <MaterialContext.Provider value={state}>
      <WardrobeRootGroup>
        {children}
      </WardrobeRootGroup>
    </MaterialContext.Provider>
  )
}

function resolveMaterialId(
  variant: 'buitenkant' | 'binnenkant',
  ctx: MaterialState | null,
  override: ModuleMaterialOverride | null,
): string | undefined {
  return variant === 'binnenkant'
    ? (override?.binnenkantMaterialId ?? ctx?.binnenkantMaterialId)
    : (override?.buitenkantMaterialId ?? ctx?.buitenkantMaterialId)
}

function applyPhysicalProps(
  mat: THREE.MeshPhysicalNodeMaterial,
  materialId: string | undefined,
  ctx: MaterialState | null,
  wardrobeInverse: ReturnType<typeof useWardrobeInverse>,
) {
  mat.roughness          = ROUGHNESS
  mat.clearcoat          = CLEARCOAT
  mat.clearcoatRoughness = CLEARCOAT_ROUGHNESS
  mat.sheen              = SHEEN
  mat.anisotropy         = ANISOTROPY

  if (materialId && ctx?.textureMaps[materialId]) {
    const tex = ctx.textureMaps[materialId]
    const { colorNode, normalNode } = buildTriplanarNodes({
      texture: tex,
      wardrobeInverse,
      tileU: TILE_U,
      tileV: TILE_V,
      bumpScale: BUMP_SCALE,
    })
    mat.colorNode  = colorNode as any
    mat.normalNode = normalNode as any
  } else {
    mat.colorNode  = tslColor(MATERIAL_COLORS[materialId ?? 'premium-wit'] ?? '#ffffff') as any
    mat.normalNode = null as any
  }
}

function syncWarmthUniforms(
  u: ReturnType<typeof createStripWarmthUniforms>,
  enabled: boolean,
  strips: { startA: THREE.Vector3; endA: THREE.Vector3; startB: THREE.Vector3; endB: THREE.Vector3 } | null,
) {
  u.uEnabled.value = (enabled && strips !== null) ? 1 : 0
  if (strips) {
    ;(u.uStartA.value as THREE.Vector3).copy(strips.startA)
    ;(u.uEndA.value   as THREE.Vector3).copy(strips.endA)
    ;(u.uStartB.value as THREE.Vector3).copy(strips.startB)
    ;(u.uEndB.value   as THREE.Vector3).copy(strips.endB)
  }
}

/** JSX component variant — used as a child of <mesh> */
export default function ClosetMaterial({
  variant = 'buitenkant',
}: {
  variant?: 'buitenkant' | 'binnenkant'
}) {
  const ctx               = useContext(MaterialContext)
  const override          = useContext(ModuleMaterialOverrideContext)
  const lightStripsEnabled = ctx?.lightStripsEnabled ?? false
  const warmthCtx          = useStripWarmth()
  const wardrobeInverse    = useWardrobeInverse()

  const materialId = resolveMaterialId(variant, ctx, override)

  // Warmth attaches additively over triplanar color/normal — only on
  // interior panels with strips on and a valid warmth context.
  const hasWarmthContext = warmthCtx !== null
  const attachWarmth = lightStripsEnabled && variant === 'binnenkant' && hasWarmthContext

  const warmthUniforms = useMemo(
    () => (variant === 'binnenkant' && hasWarmthContext ? createStripWarmthUniforms() : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [variant, hasWarmthContext],
  )

  const material = useMemo(() => {
    const mat = new THREE.MeshPhysicalNodeMaterial()
    applyPhysicalProps(mat, materialId, ctx, wardrobeInverse)
    if (attachWarmth && warmthUniforms) {
      mat.emissiveNode = buildWarmthNode(warmthUniforms) as any
    }
    return mat
  }, [attachWarmth, materialId, ctx, warmthUniforms, wardrobeInverse])

  useEffect(() => () => { material.dispose() }, [material])

  useEffect(() => {
    if (!attachWarmth || !warmthUniforms || !warmthCtx) return
    syncWarmthUniforms(warmthUniforms, warmthCtx.enabled, warmthCtx.strips)
  }, [attachWarmth, warmthCtx, warmthUniforms])

  const primitiveKey = `${materialId ?? '__none__'}-${attachWarmth ? 'warm' : 'plain'}`
  return <primitive key={primitiveKey} object={material} attach="material" />
}

/** Imperative hook variant — used where callers need the material object directly */
export function useClosetMaterialInstance(
  variant: 'buitenkant' | 'binnenkant' = 'buitenkant',
): THREE.MeshPhysicalNodeMaterial {
  const ctx               = useContext(MaterialContext)
  const override          = useContext(ModuleMaterialOverrideContext)
  const lightStripsEnabled = ctx?.lightStripsEnabled ?? false
  const warmthCtx          = useStripWarmth()
  const wardrobeInverse    = useWardrobeInverse()

  const materialId = resolveMaterialId(variant, ctx, override)

  const hasWarmthContext = warmthCtx !== null
  const attachWarmth = lightStripsEnabled && variant === 'binnenkant' && hasWarmthContext

  const warmthUniforms = useMemo(
    () => (variant === 'binnenkant' && hasWarmthContext ? createStripWarmthUniforms() : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [variant, hasWarmthContext],
  )

  const material = useMemo(() => {
    const mat = new THREE.MeshPhysicalNodeMaterial()
    applyPhysicalProps(mat, materialId, ctx, wardrobeInverse)
    if (attachWarmth && warmthUniforms) {
      mat.emissiveNode = buildWarmthNode(warmthUniforms) as any
    }
    return mat
  }, [attachWarmth, ctx, materialId, warmthUniforms, wardrobeInverse])

  useEffect(() => () => { material.dispose() }, [material])

  useEffect(() => {
    if (!attachWarmth || !warmthUniforms || !warmthCtx) return
    syncWarmthUniforms(warmthUniforms, warmthCtx.enabled, warmthCtx.strips)
  }, [attachWarmth, warmthCtx, warmthUniforms])

  return material
}
