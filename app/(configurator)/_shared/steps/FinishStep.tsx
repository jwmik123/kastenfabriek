'use client'

import { MessageSquare, Wrench } from 'lucide-react'
import MontageChoice from '../components/MontageChoice'
import { montageChoiceEnabled } from '@/lib/configurator/free-montage'
import type { MontageOption } from '@/lib/cart/types'
import type { InstallationTier, MontageChoiceConfig } from '@/types/configurator-pricing'

/** Longest remark we store with a cabinet. */
export const CUSTOMER_REMARKS_MAX = 2000

export interface FinishStepProps {
  montageConfig: MontageChoiceConfig | undefined | null
  montageOption: MontageOption
  onMontageChange: (v: MontageOption) => void
  installationTier: InstallationTier | null | undefined
  freeMontage: boolean
  remarks: string
  onRemarksChange: (v: string) => void
}

/**
 * Last wizard step of both configurators: how the cabinet gets installed, and
 * room for remarks or questions that travel with the order to the workshop.
 * While the owner has the montage choice switched off, the montage block only
 * explains that montage is included.
 */
export default function FinishStep({
  montageConfig,
  montageOption,
  onMontageChange,
  installationTier,
  freeMontage,
  remarks,
  onRemarksChange,
}: FinishStepProps) {
  const choice = montageChoiceEnabled(montageConfig)

  return (
    <div className="space-y-10">
      {choice ? (
        <MontageChoice
          config={montageConfig}
          value={montageOption}
          onChange={onMontageChange}
          installationTier={installationTier}
          freeMontage={freeMontage}
        />
      ) : (
        <section data-testid="montage-included">
          <div className="flex items-start gap-3 rounded-md border p-4">
            <Wrench className="w-4 h-4 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium">Montage inbegrepen</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {[
                  installationTier?.name,
                  installationTier?.people ? `${installationTier.people} monteurs` : null,
                  installationTier?.days
                    ? `${installationTier.days} ${installationTier.days === 1 ? 'dag' : 'dagen'}`
                    : null,
                ]
                  .filter(Boolean)
                  .join(' · ') || 'We plannen de montage in overleg na je bestelling.'}
                {freeMontage && (installationTier?.price ?? 0) > 0 ? ' · nu gratis' : ''}
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="space-y-5">
        <div>
          <h2 className="text-base font-semibold flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Opmerkingen of vragen
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Iets wat we moeten weten over je ruimte, de plaatsing of de kast zelf? Zet het hier —
            we lezen het bij je bestelling.
          </p>
        </div>
        <div className="space-y-1">
          <textarea
            data-testid="customer-remarks"
            rows={5}
            maxLength={CUSTOMER_REMARKS_MAX}
            value={remarks}
            onChange={(e) => onRemarksChange(e.target.value)}
            placeholder="Bijv. er zit een plint van 7 cm langs de muur, of: kan de kast ook in twee delen geleverd worden?"
            className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/40 focus:ring-1 focus:ring-foreground/20 resize-y"
          />
          <p className="text-[11px] text-muted-foreground text-right tabular-nums">
            {remarks.length}/{CUSTOMER_REMARKS_MAX}
          </p>
        </div>
      </section>
    </div>
  )
}
