'use client'

import SharedFinishStep from '../../_shared/steps/FinishStep'
import { useWasmPricing } from '../hooks/useWasmPricing'
import { useWasmachinekastStore } from '../store'

export default function FinishStep() {
  const montageOption = useWasmachinekastStore((s) => s.montageOption)
  const setMontageOption = useWasmachinekastStore((s) => s.setMontageOption)
  const montageConfig = useWasmachinekastStore((s) => s.pricingData?.config.montageChoice)
  const freeMontage = useWasmachinekastStore((s) => s.pricingData?.config.freeMontage ?? false)
  const remarks = useWasmachinekastStore((s) => s.customerRemarks)
  const setRemarks = useWasmachinekastStore((s) => s.setCustomerRemarks)
  const installationTier = useWasmPricing().totals.installationTier

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
