'use client'

import { useContext } from 'react'
import { TourContext } from '@reactour/tour'
import { HelpCircle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export default function HelpButton() {
  const tour = useContext(TourContext)
  if (!tour || typeof tour.setIsOpen !== 'function') return null
  const { setIsOpen, setCurrentStep } = tour

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={() => {
            setCurrentStep(0)
            setIsOpen(true)
          }}
          className={cn(
            'flex items-center justify-center w-11 h-11 rounded-lg transition-colors cursor-pointer',
            'hover:bg-primary hover:text-background',
          )}
        >
          <HelpCircle className="size-5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>
        Rondleiding starten
      </TooltipContent>
    </Tooltip>
  )
}
