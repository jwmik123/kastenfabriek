'use client'

import SharedFinishStep from '../../_shared/steps/FinishStep'
import { useCartPrice } from '../hooks/useCartPrice'
import { useClosetStore } from '../store'

export default function FinishStep() {
  const montageOption = useClosetStore((s) => s.montageOption)
  const setMontageOption = useClosetStore((s) => s.setMontageOption)
  const montageConfig = useClosetStore((s) => s.pricingData?.config.montageChoice)
  const freeMontage = useClosetStore((s) => s.pricingData?.config.freeMontage ?? false)
  const remarks = useClosetStore((s) => s.customerRemarks)
  const setRemarks = useClosetStore((s) => s.setCustomerRemarks)
  const { installationTier } = useCartPrice()

  return (
    <SharedFinishStep
      montageConfig={montageConfig}
      montageOption={montageOption}
      onMontageChange={setMontageOption}
      installationTier={installationTier}
      freeMontage={freeMontage}
      remarks={remarks}
      onRemarksChange={setRemarks}
    />
  )
}
