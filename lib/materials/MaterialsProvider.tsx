'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import {
  DEFAULT_MATERIALS,
  findMaterial,
  selectableMaterials,
  setMaterials,
  type Material,
} from './index'

interface MaterialsValue {
  /** Every material, including inactive ones (for resolving saved ids). */
  all: readonly Material[]
  /** Materials a customer can pick. */
  selectable: Material[]
  find: (id: string | null | undefined) => Material | undefined
}

function buildValue(all: readonly Material[]): MaterialsValue {
  return { all, selectable: selectableMaterials(all), find: findMaterial }
}

const MaterialsContext = createContext<MaterialsValue>(buildValue(DEFAULT_MATERIALS))

/**
 * Hands the Sanity material list to the client. Also fills the module
 * registry during render, so plain functions (pricing, specs) called by the
 * children already see the same list.
 */
export function MaterialsProvider({
  materials,
  children,
}: {
  materials: readonly Material[]
  children: ReactNode
}) {
  setMaterials(materials)
  const value = useMemo(
    () => buildValue(materials.length > 0 ? materials : DEFAULT_MATERIALS),
    [materials],
  )
  return <MaterialsContext.Provider value={value}>{children}</MaterialsContext.Provider>
}

export function useMaterials(): MaterialsValue {
  return useContext(MaterialsContext)
}
