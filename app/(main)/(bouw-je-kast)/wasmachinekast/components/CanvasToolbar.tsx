'use client'

import { useWasmachinekastStore } from '../store'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { ZoomIn, ZoomOut, Ruler, DoorOpen, DoorClosed, Dices } from 'lucide-react'

function ToolBtn({
  onClick,
  disabled,
  active,
  tooltip,
  children,
}: {
  onClick: () => void
  disabled?: boolean
  active?: boolean
  tooltip: string
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
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
      <TooltipContent side="top" sideOffset={8}>
        {tooltip}
      </TooltipContent>
    </Tooltip>
  )
}

export default function CanvasToolbar() {
  const doorsOpen = useWasmachinekastStore((s) => s.doorsOpen)
  const toggleDoors = useWasmachinekastStore((s) => s.toggleDoors)
  const showMeasurements = useWasmachinekastStore((s) => s.showMeasurements)
  const toggleMeasurements = useWasmachinekastStore((s) => s.toggleMeasurements)
  const userZoom = useWasmachinekastStore((s) => s.userZoom)
  const zoomIn = useWasmachinekastStore((s) => s.zoomIn)
  const zoomOut = useWasmachinekastStore((s) => s.zoomOut)
  const randomFill = useWasmachinekastStore((s) => s.randomFill)

  return (
    <div className="absolute bottom-5 left-5 flex items-center gap-0.5 bg-background/90 backdrop-blur-sm border border-border rounded-xl p-1.5 shadow-lg">
      <ToolBtn onClick={zoomIn} disabled={userZoom <= 0} tooltip="Inzoomen">
        <ZoomIn className="size-5" />
      </ToolBtn>
      <ToolBtn onClick={zoomOut} disabled={userZoom >= 1} tooltip="Uitzoomen">
        <ZoomOut className="size-5" />
      </ToolBtn>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <ToolBtn onClick={toggleMeasurements} active={showMeasurements} tooltip="Afmetingen tonen">
        <Ruler className="size-5" />
      </ToolBtn>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <ToolBtn
        onClick={toggleDoors}
        active={doorsOpen}
        tooltip={doorsOpen ? 'Deuren sluiten' : 'Deuren openen'}
      >
        {doorsOpen ? <DoorOpen className="size-5" /> : <DoorClosed className="size-5" />}
      </ToolBtn>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <ToolBtn onClick={randomFill} tooltip="Willekeurige indeling">
        <Dices className="size-5" />
      </ToolBtn>
    </div>
  )
}
