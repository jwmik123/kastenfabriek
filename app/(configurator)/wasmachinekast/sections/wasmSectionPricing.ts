import { PricingEngine } from '@/lib/configurator/pricing-engine'
import type { FullPricingData } from '@/types/configurator-pricing'
import type { Section, WasmSectionsState } from './types'

export interface WasmPricingInput {
  state: WasmSectionsState
  depth: number
  pricingData: FullPricingData
  buitenkantRatePerSqCm: number
}

export interface WasmPricingBreakdown {
  high: number
  low: number
  werkblad: number
  shared: number
  total: number
}

function priceSection(section: Section, engine: PricingEngine): number {
  const corpusType = engine.determineCorpusType(section.width)
  let total = 0
  for (const m of section.modules) {
    if (m.layoutId === null) continue
    try {
      total += engine.getModulePrice(m.layoutId, corpusType)
    } catch {
      // module no longer in catalogue — skip
    }
  }
  return total
}

export function priceWasmachinekast(input: WasmPricingInput): WasmPricingBreakdown {
  const { state, depth, pricingData, buitenkantRatePerSqCm } = input
  const engine = new PricingEngine(pricingData)

  const high = state.highSection ? priceSection(state.highSection, engine) : 0
  const low = state.lowSection ? priceSection(state.lowSection, engine) : 0
  const werkblad = state.lowSection
    ? state.lowSection.width * depth * buitenkantRatePerSqCm
    : 0
  const shared = pricingData.config.deliveryPrice

  return { high, low, werkblad, shared, total: high + low + werkblad + shared }
}
