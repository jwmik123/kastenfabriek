'use client'

import * as THREE from 'three/webgpu'
import { color as tslColor, texture as tslTexture } from 'three/tsl'
import { useLoader } from '@react-three/fiber'
import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { MATERIAL_COLORS } from '../../kledingkast/materials'
import { useStripWarmth } from './StripWarmthContext'
import { createStripWarmthUniforms, buildWarmthNode } from '../shaders/stripWarmth'

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
      tex.rotation = 0
      tex.wrapS = THREE.MirroredRepeatWrapping
      tex.wrapT = THREE.MirroredRepeatWrapping
      tex.center.set(0.5, 0.5)
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
      {children}
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

// Baseline path — MeshStandardMaterial, no node wiring, identical to pre-warmth
function applyBasePropsStandard(
  mat: THREE.MeshStandardMaterial,
  materialId: string | undefined,
  ctx: MaterialState | null,
) {
  mat.roughness = 0.7
  if (materialId && ctx?.textureMaps[materialId]) {
    mat.map = ctx.textureMaps[materialId]
    mat.color.set(0xffffff)
  } else {
    mat.map = null
    mat.color.set(MATERIAL_COLORS[materialId ?? 'premium-wit'] ?? '#ffffff')
  }
  mat.needsUpdate = true
}

// Warmth path — MeshStandardNodeMaterial with TSL color + emissive node wiring
function applyBasePropsNode(
  mat: THREE.MeshStandardNodeMaterial,
  materialId: string | undefined,
  ctx: MaterialState | null,
) {
  mat.roughness = 0.7
  if (materialId && ctx?.textureMaps[materialId]) {
    const tex = ctx.textureMaps[materialId]
    mat.colorNode = tslTexture(tex) as any
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

  const materialId = resolveMaterialId(variant, ctx, override)

  // NodeMaterial only when: strips on + interior panel + panel has valid warmth wiring.
  // Top cabinet panels (outside StripWarmthProvider) → null context → hasWarmthContext=false → StandardMaterial.
  const hasWarmthContext = warmthCtx !== null
  const useNodeMaterial = lightStripsEnabled && variant === 'binnenkant' && hasWarmthContext

  // Warmth uniforms — only created for interior panels with warmth context
  const warmthUniforms = useMemo(
    () => (variant === 'binnenkant' && hasWarmthContext ? createStripWarmthUniforms() : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [variant, hasWarmthContext],
  )

  const material = useMemo(() => {
    if (useNodeMaterial && warmthUniforms) {
      // INTERIOR + STRIPS ON + HAS WARMTH CONTEXT — NodeMaterial with warmth emissive wiring
      const mat = new THREE.MeshStandardNodeMaterial()
      applyBasePropsNode(mat, materialId, ctx)
      mat.emissiveNode = buildWarmthNode(warmthUniforms) as any
      return mat
    }
    // STANDARD PATH — exterior always, top cabinet always, interior when strips off
    const mat = new THREE.MeshStandardMaterial()
    applyBasePropsStandard(mat, materialId, ctx)
    return mat
  }, [useNodeMaterial, materialId, ctx, warmthUniforms])

  useEffect(() => () => { material.dispose() }, [material])

  // Sync warmth uniforms only when the panel actually participates in warmth
  useEffect(() => {
    if (!useNodeMaterial || !warmthUniforms || !warmthCtx) return
    syncWarmthUniforms(warmthUniforms, warmthCtx.enabled, warmthCtx.strips)
  }, [useNodeMaterial, warmthCtx, warmthUniforms])

  // Key suffix reflects actual material type — exteriors and top cabinet stay '-std' both states (no remount),
  // main corpus interiors switch '-std' ↔ '-node' on strip toggle.
  const primitiveKey = `${materialId ?? '__none__'}-${useNodeMaterial ? 'node' : 'std'}`
  return <primitive key={primitiveKey} object={material} attach="material" />
}

/** Imperative hook variant — used where callers need the material object directly */
export function useClosetMaterialInstance(
  variant: 'buitenkant' | 'binnenkant' = 'buitenkant',
): THREE.MeshStandardMaterial | THREE.MeshStandardNodeMaterial {
  const ctx               = useContext(MaterialContext)
  const override          = useContext(ModuleMaterialOverrideContext)
  const lightStripsEnabled = ctx?.lightStripsEnabled ?? false
  const warmthCtx          = useStripWarmth()

  const materialId = resolveMaterialId(variant, ctx, override)

  const hasWarmthContext = warmthCtx !== null
  const useNodeMaterial = lightStripsEnabled && variant === 'binnenkant' && hasWarmthContext

  const warmthUniforms = useMemo(
    () => (variant === 'binnenkant' && hasWarmthContext ? createStripWarmthUniforms() : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [variant, hasWarmthContext],
  )

  const material = useMemo(() => {
    if (useNodeMaterial && warmthUniforms) {
      const mat = new THREE.MeshStandardNodeMaterial()
      applyBasePropsNode(mat, materialId, ctx)
      mat.emissiveNode = buildWarmthNode(warmthUniforms) as any
      return mat
    }
    const mat = new THREE.MeshStandardMaterial()
    applyBasePropsStandard(mat, materialId, ctx)
    return mat
  }, [useNodeMaterial, ctx, materialId, warmthUniforms])

  useEffect(() => () => { material.dispose() }, [material])

  useEffect(() => {
    if (!useNodeMaterial || !warmthUniforms || !warmthCtx) return
    syncWarmthUniforms(warmthUniforms, warmthCtx.enabled, warmthCtx.strips)
  }, [useNodeMaterial, warmthCtx, warmthUniforms])

  return material
}
