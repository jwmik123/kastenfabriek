'use client'

import { useConfiguratorStore } from '../store/context'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { ZoomIn, ZoomOut, Ruler, DoorOpen, DoorClosed, Dices } from 'lucide-react'
import HelpButton from '../tour/HelpButton'

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
      <TooltipContent side="right" sideOffset={8}>
        {tooltip}
      </TooltipContent>
    </Tooltip>
  )
}

export default function CanvasToolbar() {
  const doorsOpen = useConfiguratorStore((s) => s.doorsOpen)
  const toggleDoors = useConfiguratorStore((s) => s.toggleDoors)
  const showMeasurements = useConfiguratorStore((s) => s.showMeasurements)
  const toggleMeasurements = useConfiguratorStore((s) => s.toggleMeasurements)
  const userZoom = useConfiguratorStore((s) => s.userZoom)
  const zoomIn = useConfiguratorStore((s) => s.zoomIn)
  const zoomOut = useConfiguratorStore((s) => s.zoomOut)
  const randomFill = useConfiguratorStore((s) => s.randomFill)

  return (
    <div data-tour="canvas-toolbar" className="absolute left-4 top-1/3 flex flex-col items-center gap-0.5 bg-background/90 backdrop-blur-sm border border-border rounded-xl p-1.5 shadow-lg">
      <ToolBtn onClick={zoomIn} disabled={userZoom <= 0} tooltip="Inzoomen">
        <ZoomIn className="size-5" />
      </ToolBtn>
      <ToolBtn onClick={zoomOut} disabled={userZoom >= 1} tooltip="Uitzoomen">
        <ZoomOut className="size-5" />
      </ToolBtn>

      <Separator orientation="horizontal" className="w-6 my-1" />

      <ToolBtn onClick={toggleMeasurements} active={showMeasurements} tooltip="Afmetingen tonen">
        <Ruler className="size-5" />
      </ToolBtn>

      <Separator orientation="horizontal" className="w-6 my-1" />

      <ToolBtn
        onClick={toggleDoors}
        active={doorsOpen}
        tooltip={doorsOpen ? 'Deuren sluiten' : 'Deuren openen'}
      >
        {doorsOpen ? <DoorOpen className="size-5" /> : <DoorClosed className="size-5" />}
      </ToolBtn>

      <Separator orientation="horizontal" className="w-6 my-1" />

      <ToolBtn onClick={randomFill} tooltip="Willekeurige indeling">
        <Dices className="size-5" />
      </ToolBtn>

      <Separator orientation="horizontal" className="w-6 my-1" />

      <HelpButton />
    </div>
  )
}
