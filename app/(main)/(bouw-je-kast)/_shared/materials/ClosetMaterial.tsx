'use client'

import * as THREE from 'three/webgpu'
import { useLoader } from '@react-three/fiber'
import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useClosetStore } from '../../kledingkast/store'
import { MATERIAL_COLORS } from '../../kledingkast/materials'

interface MaterialState {
  buitenkantMaterialId: string
  binnenkantMaterialId: string
  oakMap: THREE.Texture
  oakNormalMap: THREE.Texture
  walnutMap: THREE.Texture
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
  return useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: 0xd3d3d3,
      metalness: 0.9,
      roughness: 0.2,
      envMapIntensity: 2,
      clearcoat: 1,
      clearcoatRoughness: 0,
    })
  }, [])
}

export function ClosetMaterialProvider({ children }: { children: ReactNode }) {
  const buitenkantMaterialId = useClosetStore((s) => s.buitenkantMaterialId)
  const binnenkantMaterialId = useClosetStore((s) => s.binnenkantMaterialId)

  const [oakMap, oakNormalMap, walnutMap] = useLoader(THREE.TextureLoader, [
    '/materials/wood-oak/WoodFineVeneerOak002_COL_1K.jpg',
    '/materials/wood-oak/WoodFineVeneerOak002_NRM_1K.jpg',
    '/materials/walnut.jpg',
  ])

  useMemo(() => {
    oakMap.wrapS = oakMap.wrapT = THREE.RepeatWrapping
    oakNormalMap.wrapS = oakNormalMap.wrapT = THREE.RepeatWrapping
    walnutMap.wrapS = walnutMap.wrapT = THREE.RepeatWrapping
  }, [oakMap, oakNormalMap, walnutMap])

  const state = useMemo<MaterialState>(
    () => ({ buitenkantMaterialId, binnenkantMaterialId, oakMap, oakNormalMap, walnutMap }),
    [buitenkantMaterialId, binnenkantMaterialId, oakMap, oakNormalMap, walnutMap],
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
    if (materialId === 'oak') {
      return new THREE.MeshStandardMaterial({
        map: ctx?.oakMap,
        normalMap: ctx?.oakNormalMap,
        roughness: 0.7,
      })
    }
    if (materialId === 'walnut') {
      return new THREE.MeshStandardMaterial({
        map: ctx?.walnutMap,
        roughness: 0.8,
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
  const { oakMap, oakNormalMap, walnutMap } = ctx

  if (materialId === 'oak') {
    return (
      <meshStandardMaterial
        key={`oak-${variant}`}
        map={oakMap}
        normalMap={oakNormalMap}
        roughness={0.7}
      />
    )
  }

  if (materialId === 'walnut') {
    return (
      <meshStandardMaterial
        key={`walnut-${variant}`}
        map={walnutMap}
        roughness={0.8}
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
