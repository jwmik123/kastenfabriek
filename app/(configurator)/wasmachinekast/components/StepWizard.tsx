'use client'

import { ShoppingCart } from 'lucide-react'
import { useWasmachinekastStore } from '../store'
import { useCartPrice } from '../hooks/useCartPrice'
import LayoutStep from '../steps/LayoutStep'
import DimensionsStep from '../steps/DimensionsStep'
import WasherStep from '../steps/WasherStep'
import ModulesStep from '../steps/ModulesStep'
import MaterialStep from '../steps/MaterialStep'
import DoorHandlesStep from '../../_shared/steps/DoorHandlesStep'
import AccessoiresStep from '../steps/AccessoiresStep'
import ModuleMaterialPanel from './ModuleMaterialPanel'
import StepHeader from '../../_shared/components/StepHeader'
import ScrollArea from '../../_shared/components/ScrollArea'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const STEP_COUNT = 7

const STEP_META: Record<number, { eyebrow: string; title: string; subtitle: string }> = {
  1: {
    eyebrow: 'Stap 1 van 7',
    title: 'Layout',
    subtitle: 'Kies de vorm van je wasmachinekast.',
  },
  2: {
    eyebrow: 'Stap 2 van 7',
    title: 'Afmetingen',
    subtitle: 'Bepaal de breedte, hoogte en diepte van je kast.',
  },
  3: {
    eyebrow: 'Stap 3 van 7',
    title: 'Wasmachine',
    subtitle: 'Kies het type wasmachine en de plek in de kast.',
  },
  4: {
    eyebrow: 'Stap 4 van 7',
    title: 'Indeling',
    subtitle: 'Kies per vak een indeling en of er een deur op komt.',
  },
  5: {
    eyebrow: 'Stap 5 van 7',
    title: 'Materiaal',
    subtitle: 'Kies een materiaal voor de buiten- en binnenkant.',
  },
  6: {
    eyebrow: 'Stap 6 van 7',
    title: 'Handgrepen',
    subtitle: 'Selecteer een handgreep en afwerking.',
  },
  7: {
    eyebrow: 'Stap 7 van 7',
    title: 'Accessoires',
    subtitle: 'Verlichting, stekkerdoos­gaten en extra opties.',
  },
}

function CurrentStep() {
  const step = useWasmachinekastStore((s) => s.step)

  switch (step) {
    case 1: return <LayoutStep />
    case 2: return <DimensionsStep />
    case 3: return <WasherStep />
    case 4: return <ModulesStep />
    case 5: return <MaterialStep />
    case 6: return <DoorHandlesStep />
    case 7: return <AccessoiresStep />
    default: return null
  }
}

export default function StepWizard() {
  const step = useWasmachinekastStore((s) => s.step)
  const nextStep = useWasmachinekastStore((s) => s.nextStep)
  const prevStep = useWasmachinekastStore((s) => s.prevStep)
  const selectedSlot = useWasmachinekastStore((s) => s.selectedSlot)
  const washerModules = useWasmachinekastStore((s) => s.washerModules)
  const clearWasherModules = useWasmachinekastStore((s) => s.clearWasherModules)
  const { pricingData, editItemId, handleAddToCart, isCapturing } = useCartPrice()
  const isPanelOpen = step === 5 && selectedSlot !== null
  const meta = STEP_META[step]
  const isLastStep = step === STEP_COUNT

  const blurClass = 'transition-[filter] duration-200 blur-sm pointer-events-none select-none'

  function handlePrev() {
    if (step === 4) clearWasherModules()
    prevStep()
  }

  return (
    <div className="flex flex-col h-full p-6 gap-5">
      {meta && (
        <div className={cn('-mx-6 px-6 pb-5 border-b border-border', isPanelOpen && blurClass)}>
          <StepHeader eyebrow={meta.eyebrow} title={meta.title} subtitle={meta.subtitle} />
        </div>
      )}
      <ScrollArea>
        <div className={cn(isPanelOpen && blurClass)}>
          <CurrentStep />
        </div>
        <ModuleMaterialPanel />
      </ScrollArea>
      <div className={cn('-mx-6 -mt-2 px-6 pt-3 border-t border-border flex justify-between gap-3', isPanelOpen && blurClass)}>
        <Button variant="outline" onClick={handlePrev} disabled={step === 1}>
          Vorige
        </Button>
        {isLastStep ? (
          <Button
            id="kf-tour-next-desktop"
            data-tour="next-button"
            onClick={handleAddToCart}
            disabled={!pricingData || isCapturing}
          >
            <ShoppingCart className="size-4" />
            {isCapturing ? 'Bezig...' : editItemId ? 'Wijzigingen opslaan' : 'Voeg toe aan winkelwagen'}
          </Button>
        ) : (
          <Button
            id="kf-tour-next-desktop"
            data-tour="next-button"
            onClick={nextStep}
            disabled={step === 3 && washerModules.length === 0}
          >
            Volgende
          </Button>
        )}
      </div>
    </div>
  )
}
