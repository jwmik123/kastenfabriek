'use client'

import Image from 'next/image'
import { useWasmachinekastStore } from '../store'
import { formatter } from '../hooks/useCartPrice'
import { cn } from '@/lib/utils'
import Carousel from '../../kledingkast/components/Carousel'
import type { HandleType } from '@/types/configurator-pricing'

type HandleItem = HandleType | { id: 'none'; name: string; nameNl: string; price: number; imageUrl?: undefined }

const MATERIALS = [
  { value: 'chrome' as const, label: 'Chrome' },
  { value: 'black' as const,  label: 'Zwart'  },
  { value: 'gold' as const,   label: 'Goud'   },
]

export default function DoorHandlesStep() {
  const doorHandleId = useWasmachinekastStore((s) => s.doorHandleId)
  const setDoorHandleId = useWasmachinekastStore((s) => s.setDoorHandleId)
  const doorHandleMaterial = useWasmachinekastStore((s) => s.doorHandleMaterial)
  const setDoorHandleMaterial = useWasmachinekastStore((s) => s.setDoorHandleMaterial)
  const pricingData = useWasmachinekastStore((s) => s.pricingData)

  const pushToOpenPrice = pricingData?.accessories.find((a) => a.id === 'push-to-open')?.price ?? 0
  const handles = pricingData?.handles ?? []

  const pushToOpenItem: HandleItem = {
    id: 'none',
    name: 'Push-to-open',
    nameNl: 'Geen (push-to-open)',
    price: pushToOpenPrice,
  }

  const allItems: HandleItem[] = ([...handles].sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true })) as HandleItem[]).concat(pushToOpenItem)

  return (
    <div className="space-y-7">
      <div>
        <h2 className="text-base font-semibold">Handgrepen</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Kies het type handgreep voor de deuren.
        </p>
      </div>

      <Carousel
        items={allItems}
        activeId={doorHandleId}
        renderItem={(item, isActive) => (
          <button
            onClick={() => setDoorHandleId(item.id)}
            className={cn(
              'flex flex-col w-full aspect-square rounded-md border-2 overflow-hidden transition-all',
              isActive
                ? 'border-foreground bg-primary text-primary-foreground'
                : 'border-border bg-background text-foreground hover:border-foreground/40 hover:bg-muted',
            )}
          >
            <div className="relative flex-1 min-h-0 w-full bg-muted">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.nameNl ?? item.name}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 33vw, 120px"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center px-2">
                  <span className="text-xs font-medium text-center leading-tight">{item.nameNl ?? item.name}</span>
                </div>
              )}
            </div>
            <div className="px-1.5 py-1 text-center shrink-0">
              {item.imageUrl && (
                <p className="text-[10px] font-medium leading-tight truncate">{item.nameNl ?? item.name}</p>
              )}
              <p className={cn('text-[10px]', isActive ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                {formatter.format(item.price)} / deur
              </p>
            </div>
          </button>
        )}
      />

      {doorHandleId !== 'none' && (
        <div>
          <p className="text-sm font-medium mb-2">Afwerking</p>
          <div className="flex gap-2">
            {MATERIALS.map((m) => (
              <button
                key={m.value}
                onClick={() => setDoorHandleMaterial(m.value)}
                className={cn(
                  'flex-1 py-2 px-3 rounded-md border-2 text-sm font-medium transition-all',
                  doorHandleMaterial === m.value
                    ? 'border-foreground bg-primary text-primary-foreground'
                    : 'border-border bg-background text-foreground hover:border-foreground/40 hover:bg-muted',
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
