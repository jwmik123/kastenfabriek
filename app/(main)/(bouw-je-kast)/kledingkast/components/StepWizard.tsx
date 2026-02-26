'use client'

import { useClosetStore } from '../store'
import DimensionsStep from './steps/DimensionsStep'
import ModulesStep from './steps/ModulesStep'
import MaterialStep from './steps/MaterialStep'
import DoorHandlesStep from './steps/DoorHandlesStep'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

const STEPS = [
  { label: 'Indeling', number: 1 },
  { label: 'Materiaal', number: 2 },
  { label: 'Handgrepen', number: 3 },
]

function StepIndicator() {
  const step = useClosetStore((s) => s.step)
  const setStep = useClosetStore((s) => s.setStep)

  return (
    <div className="flex items-center">
      {STEPS.map((s, i) => (
        <div key={s.number} className="flex items-center flex-1 last:flex-none">
          <button
            onClick={() => s.number < step && setStep(s.number)}
            className={cn(
              'flex flex-col items-center gap-1.5',
              s.number < step ? 'cursor-pointer' : 'cursor-default',
            )}
          >
            <div
              className={cn(
                'flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold border-2 transition-all',
                step === s.number
                  ? 'border-foreground bg-foreground text-background'
                  : step > s.number
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border bg-background text-muted-foreground',
              )}
            >
              {step > s.number ? <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> : s.number}
            </div>
            <span
              className={cn(
                'text-[11px] font-medium leading-none hidden sm:block whitespace-nowrap',
                step === s.number ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              {s.label}
            </span>
          </button>
          {i < STEPS.length - 1 && (
            <div className="flex-1 mx-2 mb-4">
              <div className={cn('h-px transition-colors', step > s.number ? 'bg-foreground' : 'bg-border')} />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function CurrentStep() {
  const step = useClosetStore((s) => s.step)

  switch (step) {
    case 1:
      return (
        <div className="space-y-8">
          <DimensionsStep />
          <Separator />
          <ModulesStep />
        </div>
      )
    case 2: return <MaterialStep />
    case 3: return <DoorHandlesStep />
    default: return null
  }
}

export default function StepWizard() {
  const step = useClosetStore((s) => s.step)
  const nextStep = useClosetStore((s) => s.nextStep)
  const prevStep = useClosetStore((s) => s.prevStep)

  return (
    <div className="flex flex-col h-full p-6 gap-5">
      <StepIndicator />
      <Separator />
      <div className="flex-1 overflow-y-auto min-h-0 pr-0.5">
        <CurrentStep />
      </div>
      <Separator />
      <div className="flex justify-between gap-3">
        <Button variant="outline" onClick={prevStep} disabled={step === 1}>
          Vorige
        </Button>
        <Button onClick={nextStep} disabled={step === STEPS.length}>
          {step === STEPS.length ? 'Voltooien' : 'Volgende'}
        </Button>
      </div>
    </div>
  )
}
