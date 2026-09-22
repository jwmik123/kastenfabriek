'use client'

import { Check, Wrench, Package } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MontageOption } from '@/lib/cart/types'
import type { InstallationTier, MontageChoiceConfig } from '@/types/configurator-pricing'
import { montageChoiceEnabled, selfInstallLabel } from '@/lib/configurator/free-montage'
import { formatter } from './CanvasPricePanel'

export interface MontageChoiceProps {
  config: MontageChoiceConfig | undefined | null
  value: MontageOption
  onChange: (v: MontageOption) => void
  /** Tier the cabinet falls in when montage is included; null when none matched. */
  installationTier: InstallationTier | null | undefined
  freeMontage: boolean
}

/**
 * "Laten monteren" vs "Zelf monteren". Renders nothing while the owner has
 * the choice switched off in Sanity, so the wizard is unchanged until then.
 */
export default function MontageChoice({
  config,
  value,
  onChange,
  installationTier,
  freeMontage,
}: MontageChoiceProps) {
  if (!montageChoiceEnabled(config)) return null

  const tierPrice = installationTier?.price ?? 0
  const promo = freeMontage && tierPrice > 0
  const includedDetail = [
    installationTier?.name,
    installationTier?.people ? `${installationTier.people} monteurs` : null,
    installationTier?.days
      ? `${installationTier.days} ${installationTier.days === 1 ? 'dag' : 'dagen'}`
      : null,
  ]
    .filter(Boolean)
    .join(' · ')

  const options: {
    value: MontageOption
    label: string
    description: string
    price: React.ReactNode
    icon: React.ReactNode
  }[] = [
    {
      value: 'included',
      label: 'Laten monteren',
      description: includedDetail || 'Door onze eigen monteurs, bij je thuis geplaatst.',
      price: promo ? (
        <span>
          <span className="line-through text-muted-foreground mr-1">{formatter.format(tierPrice)}</span>
          <span className="text-green-700">gratis</span>
        </span>
      ) : (
        formatter.format(tierPrice)
      ),
      icon: <Wrench className="w-4 h-4" />,
    },
    {
      value: 'self',
      label: selfInstallLabel(config),
      description:
        config?.selfInstallDescription?.trim() ||
        'Je ontvangt de kast als bouwpakket met handleiding.',
      price: formatter.format(0),
      icon: <Package className="w-4 h-4" />,
    },
  ]

  return (
    <section data-testid="montage-choice">
      <div className="grid gap-2" role="radiogroup" aria-label="Montage">
        {options.map((opt) => {
          const active = value === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(opt.value)}
              className={cn(
                'flex items-start gap-3 rounded-md border p-4 text-left transition-colors',
                active
                  ? 'border-primary bg-primary/5'
                  : 'border-border/50 hover:border-border hover:bg-muted/40',
              )}
            >
              <span
                className={cn(
                  'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
                  active ? 'border-primary bg-primary text-primary-foreground' : 'border-border',
                )}
              >
                {active && <Check className="w-3 h-3" />}
              </span>
              <span className="flex-1 min-w-0">
                <span className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    {opt.icon}
                    {opt.label}
                  </span>
                  <span className="text-sm tabular-nums shrink-0">{opt.price}</span>
                </span>
                <span className="block text-xs text-muted-foreground mt-1">{opt.description}</span>
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
