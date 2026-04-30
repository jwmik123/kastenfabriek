import type { InstallationTier } from '@/types/configurator-pricing'

interface ComputeFreeMontageInput {
  subtotal: number
  installationTier: InstallationTier | undefined | null
  freeMontage: boolean
}

interface ComputeFreeMontageResult {
  effectiveInstallationCost: number
  freeMontageDiscount: number
  freeMontageApplied: boolean
  originalPrice: number | undefined
  grandTotal: number
}

export function computeFreeMontage({
  subtotal,
  installationTier,
  freeMontage,
}: ComputeFreeMontageInput): ComputeFreeMontageResult {
  const tierPrice = installationTier?.price ?? 0
  const freeMontageDiscount = freeMontage ? tierPrice : 0
  const freeMontageApplied = freeMontage && freeMontageDiscount > 0
  const effectiveInstallationCost = freeMontageApplied ? 0 : tierPrice
  const originalPrice = freeMontageDiscount > 0 ? subtotal + tierPrice : undefined
  const grandTotal = subtotal + effectiveInstallationCost

  return { effectiveInstallationCost, freeMontageDiscount, freeMontageApplied, originalPrice, grandTotal }
}
