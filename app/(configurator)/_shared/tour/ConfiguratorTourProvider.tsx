'use client'

import { useEffect, type ReactNode } from 'react'
import { TourProvider, useTour, type StepType } from '@reactour/tour'
import { hasSeenTour, markTourSeen } from './tourStorage'

interface Props {
  steps: StepType[]
  children: ReactNode
}

function AutoStart() {
  const { setIsOpen, setCurrentStep } = useTour()

  useEffect(() => {
    if (hasSeenTour()) return
    setCurrentStep(0)
    setIsOpen(true)
  }, [setIsOpen, setCurrentStep])

  return null
}

function TourTargetMarker() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mql = window.matchMedia('(min-width: 768px)')
    const sync = () => {
      const desktop = document.getElementById('kf-tour-next-desktop')
      const mobile = document.getElementById('kf-tour-next-mobile')
      const active = mql.matches ? desktop : mobile
      const inactive = mql.matches ? mobile : desktop
      inactive?.removeAttribute('data-tour-active')
      active?.setAttribute('data-tour-active', 'next')
    }
    sync()
    mql.addEventListener('change', sync)
    return () => mql.removeEventListener('change', sync)
  }, [])
  return null
}

export default function ConfiguratorTourProvider({ steps, children }: Props) {
  return (
    <TourProvider
      steps={steps}
      showBadge={false}
      showDots={false}
      showCloseButton={false}
      showNavigation={false}
      showPrevNextButtons={false}
      onClickMask={() => {}}
      disableInteraction={false}
      beforeClose={() => {
        markTourSeen()
      }}
      ContentComponent={({ currentStep, setCurrentStep, setIsOpen, steps: allSteps }) => {
        const total = allSteps?.length ?? 0
        const isLast = currentStep >= total - 1
        const stepContent = allSteps?.[currentStep]?.content
        const node = typeof stepContent === 'function' ? null : stepContent
        return (
          <div className="flex flex-col gap-3 min-w-[260px]">
            <div>{node as ReactNode}</div>
            <div className="flex items-center justify-between gap-3 pt-1">
              <button
                type="button"
                className="text-sm text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                onClick={() => setIsOpen(false)}
              >
                Sla over
              </button>
              <button
                type="button"
                className="rounded-md bg-primary text-background px-3 py-1.5 text-sm font-medium hover:opacity-90"
                onClick={() => {
                  if (isLast) setIsOpen(false)
                  else setCurrentStep((s) => s + 1)
                }}
              >
                {isLast ? 'Aan de slag' : 'Volgende'}
              </button>
            </div>
          </div>
        )
      }}
      styles={{
        popover: (base) => ({
          ...base,
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(8px)',
          borderRadius: '12px',
          padding: '16px 20px',
          color: 'hsl(var(--foreground))',
          maxWidth: '340px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
        }),
        maskWrapper: (base) => ({ ...base, color: 'rgba(0,0,0,0.55)' }),
      }}
    >
      <AutoStart />
      <TourTargetMarker />
      {children}
    </TourProvider>
  )
}
