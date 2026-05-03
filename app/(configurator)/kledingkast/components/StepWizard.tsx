'use client'

import { useClosetStore } from '../store'
import DimensionsStep from '../steps/DimensionsStep'
import ModulesStep from '../steps/ModulesStep'
import MaterialStep from '../steps/MaterialStep'
import DoorHandlesStep from '../steps/DoorHandlesStep'
import AccessoiresStep from '../steps/AccessoiresStep'
import ModuleMaterialPanel from './ModuleMaterialPanel'
import StepHeader from '../../_shared/components/StepHeader'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

const STEPS = [
  { label: 'Afmetingen', number: 1 },
  { label: 'Modules', number: 2 },
  { label: 'Materiaal', number: 3 },
  { label: 'Handgrepen', number: 4 },
  { label: 'Accessoires', number: 5 },
]

const STEP_META: Record<number, { eyebrow: string; title: string; subtitle: string }> = {
  1: {
    eyebrow: 'Stap 1 van 5',
    title: 'Afmetingen',
    subtitle: 'Bepaal de breedte, hoogte en diepte van je kast.',
  },
  2: {
    eyebrow: 'Stap 2 van 5',
    title: 'Modules',
    subtitle: 'Kies per vak een indeling en of er een deur op komt.',
  },
  3: {
    eyebrow: 'Stap 3 van 5',
    title: 'Materiaal',
    subtitle: 'Kies een materiaal voor de buiten- en binnenkant.',
  },
  4: {
    eyebrow: 'Stap 4 van 5',
    title: 'Handgrepen',
    subtitle: 'Selecteer een handgreep en afwerking.',
  },
  5: {
    eyebrow: 'Stap 5 van 5',
    title: 'Accessoires',
    subtitle: 'Verlichting, stekkerdoos­gaten en extra opties.',
  },
}

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
                  ? 'border-primary bg-primary text-primary-foreground'
                  : step > s.number
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-muted-foreground',
              )}
            >
              {step > s.number ? <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> : s.number}
            </div>
            <span
              className={cn(
                'text-[11px] font-medium leading-none hidden sm:block whitespace-nowrap',
                step === s.number ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              {s.label}
            </span>
          </button>
          {i < STEPS.length - 1 && (
            <div className="flex-1 mx-2 mb-4">
              <div className={cn('h-px transition-colors', step > s.number ? 'bg-primary' : 'bg-border')} />
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
    case 1: return <DimensionsStep />
    case 2: return <ModulesStep />
    case 3: return <MaterialStep />
    case 4: return <DoorHandlesStep />
    case 5: return <AccessoiresStep />
    default: return null
  }
}

export default function StepWizard() {
  const step = useClosetStore((s) => s.step)
  const nextStep = useClosetStore((s) => s.nextStep)
  const prevStep = useClosetStore((s) => s.prevStep)
  const selectedSlot = useClosetStore((s) => s.selectedSlot)
  const isPanelOpen = step === 3 && selectedSlot !== null
  const meta = STEP_META[step]

  const blurClass = 'transition-[filter] duration-200 blur-sm pointer-events-none select-none'

  return (
    <div className="flex flex-col h-full p-6 gap-5">
      <div className={cn(isPanelOpen && blurClass)}>
        <StepIndicator />
      </div>
      <Separator className={cn('transition-opacity duration-200', isPanelOpen && 'opacity-20')} />
      {meta && (
        <div className={cn(isPanelOpen && blurClass)}>
          <StepHeader eyebrow={meta.eyebrow} title={meta.title} subtitle={meta.subtitle} />
        </div>
      )}
      <div className="relative flex-1 overflow-y-auto min-h-0 px-5 scrollbar-primary">
        <div className={cn(isPanelOpen && blurClass)}>
          <CurrentStep />
        </div>
        <ModuleMaterialPanel />
      </div>
      <Separator className={cn('transition-opacity duration-200', isPanelOpen && 'opacity-20')} />
      <div className={cn('flex justify-between gap-3', isPanelOpen && blurClass)}>
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
