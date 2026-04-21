'use client'

import Image from 'next/image'
import { useClosetStore } from '../store'
import { formatter } from '../hooks/useCartPrice'
import { cn } from '@/lib/utils'

export default function DoorHandlesStep() {
  const doorHandleId = useClosetStore((s) => s.doorHandleId)
  const setDoorHandleId = useClosetStore((s) => s.setDoorHandleId)
  const pricingData = useClosetStore((s) => s.pricingData)
  const pushToOpenPrice = pricingData?.accessories.find((a) => a.id === 'push-to-open')?.price ?? 0

  const handles = pricingData?.handles ?? []

  return (
    <div className="space-y-7">
      <div>
        <h2 className="text-base font-semibold">Handgrepen</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Kies het type handgreep voor de deuren.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {handles.map((h) => {
          const isSelected = doorHandleId === h.id
          return (
            <button
              key={h.id}
              onClick={() => setDoorHandleId(h.id)}
              className={cn(
                'flex flex-col items-center gap-2 p-3 rounded-md border-2 transition-all text-center',
                isSelected
                  ? 'border-foreground bg-primary text-primary-foreground'
                  : 'border-border bg-background text-foreground hover:border-foreground/40 hover:bg-muted',
              )}
            >
              {h.imageUrl && (
                <div className="relative w-full aspect-square rounded overflow-hidden bg-muted">
                  <Image
                    src={h.imageUrl}
                    alt={h.nameNl ?? h.name}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 50vw, 150px"
                  />
                </div>
              )}
              <span className="text-sm font-medium leading-tight">{h.nameNl ?? h.name}</span>
              <span className={cn('text-xs', isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                {formatter.format(h.price)} / deur
              </span>
            </button>
          )
        })}

        {/* Push-to-open — no handle */}
        <button
          onClick={() => setDoorHandleId('none')}
          className={cn(
            'flex flex-col items-center justify-center gap-2 p-3 rounded-md border-2 transition-all text-center',
            doorHandleId === 'none'
              ? 'border-foreground bg-primary text-primary-foreground'
              : 'border-border bg-background text-foreground hover:border-foreground/40 hover:bg-muted',
          )}
        >
          <span className="text-sm font-medium">Geen (push-to-open)</span>
          <span className={cn('text-xs', doorHandleId === 'none' ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
            {formatter.format(pushToOpenPrice)} / deur
          </span>
        </button>
      </div>
    </div>
  )
}
