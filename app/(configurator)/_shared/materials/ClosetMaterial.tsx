'use client'

import * as THREE from 'three/webgpu'
import { color as tslColor } from 'three/tsl'
import { useLoader } from '@react-three/fiber'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react'
import { MATERIAL_COLORS } from '../../kledingkast/materials'
import { useStripWarmth } from './StripWarmthContext'
import { createStripWarmthUniforms, buildWarmthNode } from '../shaders/stripWarmth'
import { WardrobeRootGroup, useWardrobeInverse } from './WardrobeRoot'
import { buildTriplanarNodes } from './triplanar'
import { VENEERS } from './veneers'

// Slice 1 globals — slice 2 replaces these with per-veneer registry values.
// ANISOTROPY and BUMP_SCALE held at 0: anisotropy needs anisotropyNode wired
// against grain-V tangents (slice 2), and the dFdx/dFdy luminance bump blows
// up at triplanar projection seams. Both ship at 0 for slice 1 stability.
const TILE_U = 2.4
const TILE_V = 7.2
const BUMP_SCALE = 0
const ANISOTROPY = 0
const CLEARCOAT = 0.3
const CLEARCOAT_ROUGHNESS = 0.5
const SHEEN = 0.1
const ROUGHNESS = 0.7

interface MaterialState {
  buitenkantMaterialId: string
  binnenkantMaterialId: string
  lightStripsEnabled: boolean
  textureMaps: Record<string, THREE.Texture>
  normalMaps: Record<string, THREE.Texture>
  roughnessMaps: Record<string, THREE.Texture>
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

  // Flatten the registry into a single deterministic path list so one
  // useLoader call covers color + optional normal + optional roughness
  // for every veneer. The layout array remembers which slot each path
  // belongs to so we can split the loaded textures back per-veneer.
  const { paths: allPaths, layout: pathLayout } = useMemo(() => {
    const paths: string[] = []
    const layout: { id: string; kind: 'color' | 'normal' | 'roughness' }[] = []
    for (const v of VENEERS) {
      paths.push(v.colorPath)
      layout.push({ id: v.id, kind: 'color' })
      if (v.normalPath) {
        paths.push(v.normalPath)
        layout.push({ id: v.id, kind: 'normal' })
      }
      if (v.roughnessPath) {
        paths.push(v.roughnessPath)
        layout.push({ id: v.id, kind: 'roughness' })
      }
    }
    return { paths, layout }
  }, [])

  const loadedTextures = useLoader(THREE.TextureLoader, allPaths)

  const { textureMaps, normalMaps, roughnessMaps } = useMemo(() => {
    const textureMaps: Record<string, THREE.Texture> = {}
    const normalMaps: Record<string, THREE.Texture> = {}
    const roughnessMaps: Record<string, THREE.Texture> = {}
    pathLayout.forEach((entry, i) => {
      const tex = loadedTextures[i]
      // Color is sRGB; normal/roughness are linear data.
      tex.colorSpace = entry.kind === 'color' ? THREE.SRGBColorSpace : THREE.NoColorSpace
      tex.wrapS = THREE.RepeatWrapping
      tex.wrapT = THREE.RepeatWrapping
      tex.center.set(0, 0)
      tex.rotation = 0
      tex.needsUpdate = true
      if (entry.kind === 'color') textureMaps[entry.id] = tex
      else if (entry.kind === 'normal') normalMaps[entry.id] = tex
      else roughnessMaps[entry.id] = tex
    })
    return { textureMaps, normalMaps, roughnessMaps }
  }, [loadedTextures, pathLayout])

  const chromeMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: 0xd3d3d3,
    metalness: 0.9,
    roughness: 0.2,
    envMapIntensity: 2,
    clearcoat: 1,
    clearcoatRoughness: 0,
    side: THREE.DoubleSide,
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
    () => ({ buitenkantMaterialId, binnenkantMaterialId, lightStripsEnabled, textureMaps, normalMaps, roughnessMaps, chromeMaterial, glassMaterial }),
    [buitenkantMaterialId, binnenkantMaterialId, lightStripsEnabled, textureMaps, normalMaps, roughnessMaps, chromeMaterial, glassMaterial],
  )

  return (
    <MaterialContext.Provider value={state}>
      <WardrobeRootGroup>
        <MaterialCacheProvider>
          {children}
        </MaterialCacheProvider>
      </WardrobeRootGroup>
    </MaterialContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Shared material cache.
//
// Every mesh used to build its own MeshPhysicalNodeMaterial; a material
// switch then rebuilt ~50 materials and forced WebGPU to compile that many
// pipelines in one frame — seconds of hang on mobile. Materials are instead
// shared per (materialId, warmth) key: a switch creates at most a couple of
// new materials, and switching back reuses already-compiled ones.
//
// Lives INSIDE WardrobeRootGroup because the triplanar nodes need the
// wardrobe-inverse uniform from that context. Warmth uniforms are shared by
// all warm materials (the strips are global) and synced centrally here.
// ---------------------------------------------------------------------------

type GetMaterial = (materialId: string | undefined, warmth: boolean) => THREE.MeshPhysicalNodeMaterial

const MaterialCacheContext = createContext<GetMaterial | null>(null)

function MaterialCacheProvider({ children }: { children: ReactNode }) {
  const ctx = useContext(MaterialContext)
  const warmthCtx = useStripWarmth()
  const wardrobeInverse = useWardrobeInverse()

  const cacheRef = useRef(new Map<string, THREE.MeshPhysicalNodeMaterial>())
  const warmthUniformsRef = useRef<ReturnType<typeof createStripWarmthUniforms> | null>(null)

  // Latest ctx/warmth via refs so getMaterial stays referentially stable.
  const ctxRef = useRef(ctx)
  ctxRef.current = ctx
  const warmthCtxRef = useRef(warmthCtx)
  warmthCtxRef.current = warmthCtx

  // Texture set identity change (e.g. dev hot reload) invalidates the cache.
  const texMapsRef = useRef(ctx?.textureMaps)
  if (texMapsRef.current !== ctx?.textureMaps) {
    texMapsRef.current = ctx?.textureMaps
    cacheRef.current.forEach((m) => m.dispose())
    cacheRef.current.clear()
  }

  const getMaterial = useCallback<GetMaterial>((materialId, warmth) => {
    const key = `${materialId ?? '__none__'}|${warmth ? 'warm' : 'plain'}`
    let mat = cacheRef.current.get(key)
    if (!mat) {
      mat = new THREE.MeshPhysicalNodeMaterial()
      applyPhysicalProps(mat, materialId, ctxRef.current, wardrobeInverse)
      if (warmth) {
        if (!warmthUniformsRef.current) {
          warmthUniformsRef.current = createStripWarmthUniforms()
          const w = warmthCtxRef.current
          if (w) syncWarmthUniforms(warmthUniformsRef.current, w.enabled, w.strips)
        }
        mat.emissiveNode = buildWarmthNode(warmthUniformsRef.current) as any
      }
      cacheRef.current.set(key, mat)
    }
    return mat
  }, [wardrobeInverse])

  // Central warmth sync — one uniform set drives every warm material.
  useEffect(() => {
    const u = warmthUniformsRef.current
    if (!u || !warmthCtx) return
    syncWarmthUniforms(u, warmthCtx.enabled, warmthCtx.strips)
  }, [warmthCtx])

  useEffect(() => {
    const cache = cacheRef.current
    return () => {
      cache.forEach((m) => m.dispose())
      cache.clear()
    }
  }, [])

  return (
    <MaterialCacheContext.Provider value={getMaterial}>
      {children}
    </MaterialCacheContext.Provider>
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
    const normalTex = ctx.normalMaps[materialId]
    const roughTex = ctx.roughnessMaps[materialId]
    const { colorNode, normalNode, roughnessNode } = buildTriplanarNodes({
      texture: tex,
      normalTexture: normalTex,
      roughnessTexture: roughTex,
      wardrobeInverse,
      tileU: TILE_U,
      tileV: TILE_V,
      bumpScale: BUMP_SCALE,
    })
    mat.colorNode = colorNode as any
    // Real normal map → wire normalNode. Without one, leave normalNode
    // at default (normalLocal); the luminance-bump fallback returns in
    // slice 2 once per-veneer bumpScale + seam-safe sampling are in place.
    if (normalTex) {
      mat.normalNode = normalNode as any
    }
    if (roughnessNode) {
      mat.roughnessNode = roughnessNode as any
    }
  } else {
    mat.colorNode = tslColor(MATERIAL_COLORS[materialId ?? 'premium-wit'] ?? '#ffffff') as any
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

/** Imperative hook variant — used where callers need the material object directly */
export function useClosetMaterialInstance(
  variant: 'buitenkant' | 'binnenkant' = 'buitenkant',
): THREE.MeshPhysicalNodeMaterial {
  const ctx               = useContext(MaterialContext)
  const override          = useContext(ModuleMaterialOverrideContext)
  const getMaterial       = useContext(MaterialCacheContext)
  const lightStripsEnabled = ctx?.lightStripsEnabled ?? false
  const warmthCtx          = useStripWarmth()

  if (!getMaterial) {
    throw new Error('useClosetMaterialInstance must be used inside <ClosetMaterialProvider>')
  }

  const materialId = resolveMaterialId(variant, ctx, override)

  // Warmth attaches additively over triplanar color/normal — only on
  // interior panels with strips on and a valid warmth context.
  const attachWarmth = lightStripsEnabled && variant === 'binnenkant' && warmthCtx !== null

  return getMaterial(materialId, attachWarmth)
}

/** JSX component variant — used as a child of <mesh> */
export default function ClosetMaterial({
  variant = 'buitenkant',
}: {
  variant?: 'buitenkant' | 'binnenkant'
}) {
  const material = useClosetMaterialInstance(variant)
  return <primitive key={material.uuid} object={material} attach="material" />
}
