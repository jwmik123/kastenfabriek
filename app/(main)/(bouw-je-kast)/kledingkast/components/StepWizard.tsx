'use client'

import { useClosetStore } from '../store'
import DimensionsStep from './steps/DimensionsStep'
import ModulesStep from './steps/ModulesStep'
import MaterialStep from './steps/MaterialStep'
import DoorHandlesStep from './steps/DoorHandlesStep'

const STEPS = [
  { label: 'Afmetingen', number: 1 },
  { label: 'Modules', number: 2 },
  { label: 'Materiaal', number: 3 },
  { label: 'Handgrepen', number: 4 },
]

function StepIndicator() {
  const step = useClosetStore((s) => s.step)

  return (
    <div className="flex items-center gap-2 mb-8">
      {STEPS.map((s, i) => (
        <div key={s.number} className="flex items-center gap-2">
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
              step === s.number
                ? 'bg-black text-white'
                : step > s.number
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-200 text-gray-500'
            }`}
          >
            {s.number}
          </div>
          <span
            className={`text-sm hidden sm:inline ${
              step === s.number ? 'text-black font-medium' : 'text-gray-400'
            }`}
          >
            {s.label}
          </span>
          {i < STEPS.length - 1 && <div className="w-6 h-px bg-gray-300" />}
        </div>
      ))}
    </div>
  )
}

function CurrentStep() {
  const step = useClosetStore((s) => s.step)

  switch (step) {
    case 1:
      return <DimensionsStep />
    case 2:
      return <ModulesStep />
    case 3:
      return <MaterialStep />
    case 4:
      return <DoorHandlesStep />
    default:
      return null
  }
}

export default function StepWizard() {
  const step = useClosetStore((s) => s.step)
  const nextStep = useClosetStore((s) => s.nextStep)
  const prevStep = useClosetStore((s) => s.prevStep)

  return (
    <div className="flex flex-col h-full p-6">
      <StepIndicator />
      <div className="flex-1">
        <CurrentStep />
      </div>
      <div className="flex justify-between pt-4 border-t border-gray-200">
        <button
          onClick={prevStep}
          disabled={step === 1}
          className="px-5 py-2 text-sm font-medium rounded-lg border border-gray-300 disabled:opacity-30 hover:bg-gray-50 transition-colors"
        >
          Vorige
        </button>
        <button
          onClick={nextStep}
          disabled={step === 4}
          className="px-5 py-2 text-sm font-medium rounded-lg bg-black text-white disabled:opacity-30 hover:bg-gray-800 transition-colors"
        >
          Volgende
        </button>
      </div>
    </div>
  )
}
