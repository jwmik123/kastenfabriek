import type { InstallationTier, MontageChoiceConfig } from '@/types/configurator-pricing'
import type { MontageOption } from '@/lib/cart/types'

export const DEFAULT_SELF_INSTALL_LABEL = 'Zelf monteren'

interface ComputeFreeMontageInput {
  subtotal: number
  installationTier: InstallationTier | undefined | null
  freeMontage: boolean
  /** The customer's pick; ignored unless `choiceEnabled`. */
  montageOption?: MontageOption
  /** Owner switch from the pricing config. */
  choiceEnabled?: boolean
}

interface ComputeFreeMontageResult {
  effectiveInstallationCost: number
  freeMontageDiscount: number
  freeMontageApplied: boolean
  /** What actually applies after the owner switch: 'self' only when allowed. */
  montageOption: MontageOption
  installationTierName: string | null
  originalPrice: number | undefined
  grandTotal: number
}

/** The montage option that applies given the owner switch. */
export function resolveMontageOption(
  montageOption: MontageOption | undefined,
  choiceEnabled: boolean | undefined,
): MontageOption {
  return choiceEnabled && montageOption === 'self' ? 'self' : 'included'
}

export function montageChoiceEnabled(config: MontageChoiceConfig | undefined | null): boolean {
  return config?.customerCanChoose === true
}

export function selfInstallLabel(config: MontageChoiceConfig | undefined | null): string {
  const label = config?.selfInstallLabel?.trim()
  return label || DEFAULT_SELF_INSTALL_LABEL
}

/**
 * Montage amount for one configuration. Self-install is a different service
 * level, not a discount: it zeroes the amount, drops the tier and never
 * combines with the free-montage promo.
 */
export function computeFreeMontage({
  subtotal,
  installationTier,
  freeMontage,
  montageOption,
  choiceEnabled,
}: ComputeFreeMontageInput): ComputeFreeMontageResult {
  const option = resolveMontageOption(montageOption, choiceEnabled)
  if (option === 'self') {
    return {
      effectiveInstallationCost: 0,
      freeMontageDiscount: 0,
      freeMontageApplied: false,
      montageOption: 'self',
      installationTierName: null,
      originalPrice: undefined,
      grandTotal: subtotal,
    }
  }

  const tierPrice = installationTier?.price ?? 0
  const freeMontageDiscount = freeMontage ? tierPrice : 0
  const freeMontageApplied = freeMontage && freeMontageDiscount > 0
  const effectiveInstallationCost = freeMontageApplied ? 0 : tierPrice
  const originalPrice = freeMontageDiscount > 0 ? subtotal + tierPrice : undefined
  const grandTotal = subtotal + effectiveInstallationCost

  return {
    effectiveInstallationCost,
    freeMontageDiscount,
    freeMontageApplied,
    montageOption: 'included',
    installationTierName: installationTier?.name ?? null,
    originalPrice,
    grandTotal,
  }
}

export const computeMontage = computeFreeMontage
