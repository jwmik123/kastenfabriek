'use client'

import { forwardRef } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export interface ToolBtnProps {
  onClick: () => void
  disabled?: boolean
  active?: boolean
  tooltip: string
  tooltipSide: 'right' | 'bottom'
  children: React.ReactNode
}

/** Square icon button used in the canvas toolbar rail. */
const ToolBtn = forwardRef<HTMLButtonElement, ToolBtnProps>(function ToolBtn(
  { onClick, disabled, active, tooltip, tooltipSide, children },
  ref,
) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          ref={ref}
          type="button"
          onClick={onClick}
          disabled={disabled}
          className={cn(
            'flex items-center justify-center w-11 h-11 rounded-lg transition-colors cursor-pointer',
            'hover:bg-primary hover:text-background',
            'disabled:opacity-30 disabled:cursor-not-allowed disabled:pointer-events-none',
            active && 'bg-primary text-background hover:bg-primary hover:text-background',
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side={tooltipSide} sideOffset={8}>
        {tooltip}
      </TooltipContent>
    </Tooltip>
  )
})

export default ToolBtn
