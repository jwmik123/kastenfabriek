'use client'

import * as THREE from 'three/webgpu'
import { useLoader } from '@react-three/fiber'
import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useClosetStore } from '../store'
import { MATERIAL_COLORS } from '../materials'

interface MaterialState {
  materialId: string
  oakMap: THREE.Texture
  oakNormalMap: THREE.Texture
}

const MaterialContext = createContext<MaterialState | null>(null)

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
  const materialId = useClosetStore((s) => s.materialId)

  const [oakMap, oakNormalMap] = useLoader(THREE.TextureLoader, [
    '/materials/wood-oak/WoodFineVeneerOak002_COL_1K.jpg',
    '/materials/wood-oak/WoodFineVeneerOak002_NRM_1K.jpg',
  ])

  useMemo(() => {
    oakMap.wrapS = oakMap.wrapT = THREE.RepeatWrapping
    oakNormalMap.wrapS = oakNormalMap.wrapT = THREE.RepeatWrapping
  }, [oakMap, oakNormalMap])

  const state = useMemo<MaterialState>(
    () => ({ materialId, oakMap, oakNormalMap }),
    [materialId, oakMap, oakNormalMap],
  )

  return (
    <MaterialContext.Provider value={state}>
      {children}
    </MaterialContext.Provider>
  )
}

export function useClosetMaterialInstance(): THREE.MeshStandardMaterial {
  const ctx = useContext(MaterialContext)

  return useMemo(() => {
    if (ctx?.materialId === 'oak') {
      return new THREE.MeshStandardMaterial({
        map: ctx.oakMap,
        normalMap: ctx.oakNormalMap,
        roughness: 0.7,
      })
    }
    const color = MATERIAL_COLORS[ctx?.materialId ?? 'green-shadow'] || '#767b67'
    return new THREE.MeshStandardMaterial({ color })
  }, [ctx])
}

export default function ClosetMaterial() {
  const ctx = useContext(MaterialContext)

  if (!ctx) {
    return <meshStandardMaterial color="#767b67" />
  }

  const { materialId, oakMap, oakNormalMap } = ctx

  if (materialId === 'oak') {
    return (
      <meshStandardMaterial
        key="oak"
        map={oakMap}
        normalMap={oakNormalMap}
        roughness={0.7}
      />
    )
  }

  return <meshStandardMaterial  
          // wireframe={true} 
          key={materialId} 
          color={MATERIAL_COLORS[materialId] || '#767b67'} 
        />
}
