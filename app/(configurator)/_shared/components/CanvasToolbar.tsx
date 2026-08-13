'use client'

import { Fragment } from 'react'
import { useConfiguratorStore } from '../store/context'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { ZoomIn, ZoomOut, Ruler, DoorOpen, DoorClosed, Dices } from 'lucide-react'
import HelpButton from '../tour/HelpButton'
import { useIsMobile } from './useIsMobile'
import { getToolbarLayout, type ToolbarItem } from './toolbarLayout'

function ToolBtn({
  onClick,
  disabled,
  active,
  tooltip,
  tooltipSide,
  children,
}: {
  onClick: () => void
  disabled?: boolean
  active?: boolean
  tooltip: string
  tooltipSide: 'right' | 'bottom'
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
      <TooltipContent side={tooltipSide} sideOffset={8}>
        {tooltip}
      </TooltipContent>
    </Tooltip>
  )
}

export default function CanvasToolbar({ showRandomize = true }: { showRandomize?: boolean } = {}) {
  const doorsOpen = useConfiguratorStore((s) => s.doorsOpen)
  const toggleDoors = useConfiguratorStore((s) => s.toggleDoors)
  const showMeasurements = useConfiguratorStore((s) => s.showMeasurements)
  const toggleMeasurements = useConfiguratorStore((s) => s.toggleMeasurements)
  const userZoom = useConfiguratorStore((s) => s.userZoom)
  const zoomIn = useConfiguratorStore((s) => s.zoomIn)
  const zoomOut = useConfiguratorStore((s) => s.zoomOut)
  const randomFill = useConfiguratorStore((s) => s.randomFill)

  const isMobile = useIsMobile()
  const { orientation, items } = getToolbarLayout({ isMobile, showRandomize })

  const tooltipSide = orientation === 'horizontal' ? 'bottom' : 'right'

  const renderItem = (item: ToolbarItem) => {
    switch (item) {
      case 'zoomIn':
        return (
          <ToolBtn key="zoomIn" onClick={zoomIn} disabled={userZoom <= 0} tooltip="Inzoomen" tooltipSide={tooltipSide}>
            <ZoomIn className="size-5" />
          </ToolBtn>
        )
      case 'zoomOut':
        return (
          <ToolBtn key="zoomOut" onClick={zoomOut} disabled={userZoom >= 1} tooltip="Uitzoomen" tooltipSide={tooltipSide}>
            <ZoomOut className="size-5" />
          </ToolBtn>
        )
      case 'measurements':
        return (
          <ToolBtn key="measurements" onClick={toggleMeasurements} active={showMeasurements} tooltip="Afmetingen tonen" tooltipSide={tooltipSide}>
            <Ruler className="size-5" />
          </ToolBtn>
        )
      case 'doors':
        return (
          <ToolBtn
            key="doors"
            onClick={toggleDoors}
            active={doorsOpen}
            tooltip={doorsOpen ? 'Deuren sluiten' : 'Deuren openen'}
            tooltipSide={tooltipSide}
          >
            {doorsOpen ? <DoorOpen className="size-5" /> : <DoorClosed className="size-5" />}
          </ToolBtn>
        )
      case 'randomize':
        return (
          <ToolBtn key="randomize" onClick={randomFill} tooltip="Willekeurige indeling" tooltipSide={tooltipSide}>
            <Dices className="size-5" />
          </ToolBtn>
        )
      case 'help':
        return <HelpButton key="help" />
      default:
        return null
    }
  }

  return (
    <div
      data-tour="canvas-toolbar"
      data-orientation={orientation}
      className={cn(
        'absolute z-10 flex flex-col items-center bg-background/90 backdrop-blur-sm border border-border shadow-lg',
        isMobile
          // Compact rail tucked against the left edge, so it stays clear of the
          // cabinet in the middle of the canvas.
          ? 'left-2 top-1/4 gap-0 rounded-lg p-1 [&_button]:w-8 [&_button]:h-8 [&_svg]:size-4'
          : 'left-4 top-1/3 gap-0.5 rounded-xl p-1.5',
      )}
    >
      {items.map((item, i) => (
        <Fragment key={item}>
          {i > 0 && (
            <Separator
              orientation="horizontal"
              className={isMobile ? 'w-4 my-0.5' : 'w-6 my-1'}
            />
          )}
          {renderItem(item)}
        </Fragment>
      ))}
    </div>
  )
}
