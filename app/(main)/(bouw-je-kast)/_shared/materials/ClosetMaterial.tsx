'use client'

import * as THREE from 'three/webgpu'
import { useLoader } from '@react-three/fiber'
import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useClosetStore } from '../../kledingkast/store'
import { MATERIAL_COLORS } from '../../kledingkast/materials'

const TEXTURE_IDS = [
  'h1199-thermo-eik',
  'h1714-lincoln-notelaar',
  'h3158-vicenza-eik-grijs',
  'h3165-vicenza-eik-licht',
  'h3190-fineline-antraciet',
] as const

const TEXTURE_PATHS: Record<string, string> = {
  'h1199-thermo-eik': '/materials/H1199 ST12 Thermo eik zwartbruin.webp',
  'h1714-lincoln-notelaar': '/materials/H1714 ST19 Lincoln notelaar.jpg',
  'h3158-vicenza-eik-grijs': '/materials/H3158 ST19 Vicenza eik grijs.webp',
  'h3165-vicenza-eik-licht': '/materials/H3165 ST12 Vicenza eik licht.webp',
  'h3190-fineline-antraciet': '/materials/H3190 ST19 Fineline metallic antraciet.webp',
}

interface MaterialState {
  buitenkantMaterialId: string
  binnenkantMaterialId: string
  textureMaps: Record<string, THREE.Texture>
  chromeMaterial: THREE.MeshPhysicalMaterial
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

/** Returns the single shared chrome material instance for the current provider tree. */
export function useChromeMaterialInstance(): THREE.MeshPhysicalMaterial {
  return useContext(MaterialContext)!.chromeMaterial
}

export function ClosetMaterialProvider({ children }: { children: ReactNode }) {
  const buitenkantMaterialId = useClosetStore((s) => s.buitenkantMaterialId)
  const binnenkantMaterialId = useClosetStore((s) => s.binnenkantMaterialId)

  const loadedTextures = useLoader(THREE.TextureLoader, Object.values(TEXTURE_PATHS))

  const textureMaps = useMemo(() => {
    const map: Record<string, THREE.Texture> = {}
    TEXTURE_IDS.forEach((id, i) => {
      const tex = loadedTextures[i]
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

  const state = useMemo<MaterialState>(
    () => ({ buitenkantMaterialId, binnenkantMaterialId, textureMaps, chromeMaterial }),
    [buitenkantMaterialId, binnenkantMaterialId, textureMaps, chromeMaterial],
  )

  return (
    <MaterialContext.Provider value={state}>
      {children}
    </MaterialContext.Provider>
  )
}

export function useClosetMaterialInstance(
  variant: 'buitenkant' | 'binnenkant' = 'buitenkant',
): THREE.MeshStandardMaterial {
  const ctx = useContext(MaterialContext)
  const override = useContext(ModuleMaterialOverrideContext)
  const materialId = variant === 'binnenkant'
    ? (override?.binnenkantMaterialId ?? ctx?.binnenkantMaterialId)
    : (override?.buitenkantMaterialId ?? ctx?.buitenkantMaterialId)

  return useMemo(() => {
    if (materialId && ctx?.textureMaps[materialId]) {
      return new THREE.MeshStandardMaterial({
        map: ctx.textureMaps[materialId],
        roughness: 0.7,
      })
    }
    const color = MATERIAL_COLORS[materialId ?? 'green-shadow'] || '#767b67'
    return new THREE.MeshStandardMaterial({ color })
  }, [ctx, materialId])
}

export default function ClosetMaterial({
  variant = 'buitenkant',
}: {
  variant?: 'buitenkant' | 'binnenkant'
}) {
  const ctx = useContext(MaterialContext)
  const override = useContext(ModuleMaterialOverrideContext)

  if (!ctx) {
    return <meshStandardMaterial color="#767b67" />
  }

  const materialId = variant === 'binnenkant'
    ? (override?.binnenkantMaterialId ?? ctx.binnenkantMaterialId)
    : (override?.buitenkantMaterialId ?? ctx.buitenkantMaterialId)

  if (ctx.textureMaps[materialId]) {
    return (
      <meshStandardMaterial
        key={`${materialId}-${variant}`}
        map={ctx.textureMaps[materialId]}
        roughness={0.7}
      />
    )
  }

  return (
    <meshStandardMaterial
      key={`${materialId}-${variant}`}
      color={MATERIAL_COLORS[materialId] || '#767b67'}
    />
  )
}
