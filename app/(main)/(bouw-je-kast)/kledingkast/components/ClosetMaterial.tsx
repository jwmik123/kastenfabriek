'use client'

import * as THREE from 'three/webgpu'
import { useLoader } from '@react-three/fiber'
import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useClosetStore } from '../store'

const MATERIAL_COLORS: Record<string, string> = {
  white: '#ffffff',
  walnut: '#6b4c3b',
  black: '#1a1a1a',
}

interface MaterialState {
  materialId: string
  oakMap: THREE.Texture
  oakNormalMap: THREE.Texture
}

const MaterialContext = createContext<MaterialState | null>(null)

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
    const color = MATERIAL_COLORS[ctx?.materialId ?? 'white'] || '#ffffff'
    return new THREE.MeshStandardMaterial({ color })
  }, [ctx])
}

export default function ClosetMaterial() {
  const ctx = useContext(MaterialContext)

  if (!ctx) {
    return <meshStandardMaterial color="#ffffff" />
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
          color={MATERIAL_COLORS[materialId] || '#ffffff'} 
        />
}
