'use client'

import { useState } from 'react'
import { Drawer } from 'vaul'
import { ShoppingCart, Heart, Check } from 'lucide-react'
import { useWasmachinekastStore } from '../store'
import { useCartPrice, formatter } from '../hooks/useCartPrice'
import DimensionsStep from '../steps/DimensionsStep'
import ModulesStep from '../steps/ModulesStep'
import MaterialStep from '../steps/MaterialStep'
import DoorHandlesStep from '../../_shared/steps/DoorHandlesStep'
import ModuleMaterialPanel from './ModuleMaterialPanel'
import { cn } from '@/lib/utils'

const STEPS = [
  { label: 'Afmetingen', number: 1 },
  { label: 'Indeling', number: 2 },
  { label: 'Materiaal', number: 3 },
  { label: 'Handgrepen', number: 4 },
]

function MobileStepIndicator() {
  const step = useWasmachinekastStore((s) => s.step)
  const setStep = useWasmachinekastStore((s) => s.setStep)

  return (
    <div className="flex items-center px-4 pt-1 pb-3 border-t border-border/50">
      {STEPS.map((s, i) => (
        <div key={s.number} className="flex items-center flex-1 last:flex-none">
          <button
            onClick={() => s.number < step && setStep(s.number)}
            className={cn(
              'flex items-center gap-2',
              s.number < step ? 'cursor-pointer' : 'cursor-default',
            )}
          >
            <div
              className={cn(
                'flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition-all shrink-0',
                step === s.number || step > s.number
                  ? 'bg-foreground text-background'
                  : 'border border-border text-muted-foreground opacity-50',
              )}
            >
              {step > s.number ? <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> : s.number}
            </div>
            {step === s.number && (
              <span className="text-[13px] font-medium leading-none text-foreground whitespace-nowrap">
                {s.label}
              </span>
            )}
          </button>
          {i < STEPS.length - 1 && (
            <div className="flex-1 mx-2">
              <div className={cn('h-px transition-colors', step > s.number ? 'bg-foreground' : 'bg-border/50')} />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function MobilePriceBar() {
  const { totalPrice } = useCartPrice()

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex flex-col">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground leading-none mb-0.5">
          Totaalprijs
        </span>
        <span className="text-lg font-medium leading-tight">{formatter.format(totalPrice)}</span>
      </div>

      <div className="flex-1" />

      <button className="flex items-center justify-center w-11 h-11 rounded-md border border-border/50 hover:bg-muted transition-colors cursor-pointer shrink-0">
        <Heart className="size-5" />
      </button>
    </div>
  )
}

function CurrentStep() {
  const step = useWasmachinekastStore((s) => s.step)

  switch (step) {
    case 1: return <DimensionsStep />
    case 2: return <ModulesStep />
    case 3: return <MaterialStep />
    case 4: return <DoorHandlesStep />
    default: return null
  }
}

export default function MobileSheet() {
  const [snap, setSnap] = useState<number | string | null>(0.30)
  const step = useWasmachinekastStore((s) => s.step)
  const nextStep = useWasmachinekastStore((s) => s.nextStep)
  const prevStep = useWasmachinekastStore((s) => s.prevStep)
  const { pricingData, editItemId, handleAddToCart, isCapturing } = useCartPrice()
  const isLastStep = step === STEPS.length

  return (
    <Drawer.Root
      modal={false}
      dismissible={false}
      open
      snapPoints={[0.30, 0.92]}
      activeSnapPoint={snap}
      setActiveSnapPoint={setSnap}
    >
      <Drawer.Portal>
        <Drawer.Content
          className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-full flex flex-col bg-white rounded-t-[20px] shadow-[0_-4px_24px_rgba(0,0,0,0.08)] outline-none"
        >
          <Drawer.Title className="sr-only">Wasmachinekast configurator</Drawer.Title>

          <div className="flex justify-center items-center min-h-[44px] shrink-0">
            <div className="w-9 h-1 rounded-full bg-neutral-300" />
          </div>

          <MobilePriceBar />
          <MobileStepIndicator />

          <div className="flex-1 overflow-y-auto px-4 pb-4 relative min-h-0">
            <CurrentStep />
            <ModuleMaterialPanel />
          </div>

          <div
            className="border-t border-border/50 px-4 flex justify-between gap-3 shrink-0"
            style={{ paddingTop: '0.75rem', paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
          >
            <button
              onClick={prevStep}
              disabled={step === 1}
              className="min-w-[100px] h-11 rounded-md border border-border text-sm font-medium transition-colors hover:bg-muted disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              Vorige
            </button>
            {isLastStep ? (
              <button
                id="kf-tour-next-mobile"
                data-tour="next-button"
                onClick={handleAddToCart}
                disabled={!pricingData || isCapturing}
                className="flex-1 min-w-[140px] h-11 rounded-md bg-primary text-background text-sm font-medium transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-2"
              >
                <ShoppingCart className="size-4 shrink-0" />
                {isCapturing ? 'Bezig...' : editItemId ? 'Wijzigingen opslaan' : 'Voeg toe aan winkelwagen'}
              </button>
            ) : (
              <button
                id="kf-tour-next-mobile"
                data-tour="next-button"
                onClick={nextStep}
                className="flex-1 min-w-[140px] h-11 rounded-md bg-primary text-background text-sm font-medium transition-colors hover:bg-primary/90 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                Volgende
              </button>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
