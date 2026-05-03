'use client'

import { createContext, useContext } from 'react'
import type { StoreApi } from 'zustand'
import { useStore } from 'zustand'
import type { BaseConfiguratorState } from './types'

export type ConfiguratorStore = StoreApi<BaseConfiguratorState>

export const ConfiguratorStoreContext = createContext<ConfiguratorStore | null>(null)

export function useConfiguratorStore<T>(selector: (state: BaseConfiguratorState) => T): T {
  const store = useContext(ConfiguratorStoreContext)
  if (!store) throw new Error('useConfiguratorStore must be called inside ConfiguratorStoreContext.Provider')
  return useStore(store, selector)
}
