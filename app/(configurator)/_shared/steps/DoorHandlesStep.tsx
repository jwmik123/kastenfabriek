'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { useConfiguratorStore } from '../store/context'
import { computeHandlePages } from '../components/computeHandlePages'
import { cn } from '@/lib/utils'
import type { HandleType } from '@/types/configurator-pricing'
import type { DiagonalSlice } from '../store/types'
import { METALS } from '../constants/handleMaterials'
import { canMountHandle, minDoorHandleEdgeHeightM } from '../handleFit'

// Matches Module.tsx: ONDERSTEL_HEIGHT (0.108) + ONDERSTEL_GAP (0.010) + top wall (0.018).
const FLOOR_AND_TOP_M = 0.136

type HandleItem =
  | HandleType
  | { id: 'none'; name: string; nameNl: string; price: number; imageUrl?: undefined }

const PER_PAGE = 6

const formatter = new Intl.NumberFormat('nl-NL', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

export default function DoorHandlesStep({
  priceSuffix = '/ deur',
  handleId,
  onSelect,
  showMaterials = true,
}: {
  priceSuffix?: string
  /** Controlled handle id — overrides the store's doorHandleId (drawer picker). */
  handleId?: string
  /** Selection callback — overrides the store's setDoorHandleId. */
  onSelect?: (id: string) => void
  /** Hide the Afwerking swatches (drawer picker shares the door material). */
  showMaterials?: boolean
} = {}) {
  const storeDoorHandleId     = useConfiguratorStore((s) => s.doorHandleId)
  const storeSetDoorHandleId  = useConfiguratorStore((s) => s.setDoorHandleId)
  const doorHandleId          = handleId ?? storeDoorHandleId
  const setDoorHandleId       = onSelect ?? storeSetDoorHandleId
  const doorHandleMaterial    = useConfiguratorStore((s) => s.doorHandleMaterial)
  const setDoorHandleMaterial = useConfiguratorStore((s) => s.setDoorHandleMaterial)
  const pricingData           = useConfiguratorStore((s) => s.pricingData)
  const mainHeightCm          = useConfiguratorStore((s) => s.mainHeight())
  // Wasmachinekast has no slope; these selectors fall back to 'none'/0.
  const diagonalSide          = useConfiguratorStore(
    (s) => (s as Partial<DiagonalSlice>).diagonalSide ?? 'none',
  )
  const leftDiagStartHeightCm = useConfiguratorStore(
    (s) => (s as Partial<DiagonalSlice>).leftDiagStartHeight ?? 0,
  )
  const rightDiagStartHeightCm = useConfiguratorStore(
    (s) => (s as Partial<DiagonalSlice>).rightDiagStartHeight ?? 0,
  )

  const pushToOpenPrice = pricingData?.accessories.find((a) => a.id === 'push-to-open')?.price ?? 0
  const handles = pricingData?.handles ?? []

  const minEdgeHeightM = useMemo(
    () =>
      minDoorHandleEdgeHeightM({
        diagonalSide,
        leftDiagStartHeightM: leftDiagStartHeightCm / 100,
        rightDiagStartHeightM: rightDiagStartHeightCm / 100,
        mainHeightM: mainHeightCm / 100,
        floorAndTopM: FLOOR_AND_TOP_M,
      }),
    [diagonalSide, leftDiagStartHeightCm, rightDiagStartHeightCm, mainHeightCm],
  )

  const disabledHandleIds = useMemo(() => {
    const set = new Set<string>()
    for (const h of handles) {
      if (!canMountHandle({ heightCm: h.heightCm }, { doorHeightAtHandle: minEdgeHeightM })) {
        set.add(h.id)
      }
    }
    return set
  }, [handles, minEdgeHeightM])

  // Invalidate selection if the currently-chosen handle no longer fits any door.
  useEffect(() => {
    if (doorHandleId !== 'none' && disabledHandleIds.has(doorHandleId)) {
      setDoorHandleId('none')
    }
  }, [doorHandleId, disabledHandleIds, setDoorHandleId])

  const allItems: HandleItem[] = useMemo(() => {
    const sorted = [...handles].sort((a, b) =>
      a.id.localeCompare(b.id, undefined, { numeric: true }),
    )
    const pushToOpen: HandleItem = {
      id: 'none',
      name: 'Push-to-open',
      nameNl: 'Geen (push-to-open)',
      price: pushToOpenPrice,
    }
    return [...sorted, pushToOpen]
  }, [handles, pushToOpenPrice])

  const { pages, initialPageIndex } = useMemo(
    () => computeHandlePages(allItems, PER_PAGE, doorHandleId),
    [allItems, doorHandleId],
  )

  const [pageIndex, setPageIndex] = useState(initialPageIndex)

  useEffect(() => {
    setPageIndex(initialPageIndex)
  }, [initialPageIndex])

  const safeIndex = Math.min(pageIndex, Math.max(0, pages.length - 1))
  const currentPage = pages[safeIndex] ?? []
  const canPrev = safeIndex > 0
  const canNext = safeIndex < pages.length - 1

  return (
    <div className="space-y-7">
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {currentPage.map((item) => {
            const isActive = item.id === doorHandleId
            const isDisabled = disabledHandleIds.has(item.id)
            const disabledTitle = isDisabled
              ? 'Greep past niet op de schuine deur in deze configuratie.'
              : undefined
            return (
              <button
                key={item.id}
                onClick={() => !isDisabled && setDoorHandleId(item.id)}
                disabled={isDisabled}
                title={disabledTitle}
                aria-disabled={isDisabled}
                data-disabled={isDisabled ? 'true' : 'false'}
                className={cn(
                  'flex flex-col aspect-square rounded-md border-2 overflow-hidden transition-all',
                  isDisabled
                    ? 'border-border bg-muted text-muted-foreground opacity-40 cursor-not-allowed'
                    : isActive
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
                      sizes="120px"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center px-2">
                      <span className="text-xs font-medium text-center leading-tight">
                        {item.nameNl ?? item.name}
                      </span>
                    </div>
                  )}
                </div>
                <div className="px-1.5 py-1 text-center shrink-0">
                  {item.imageUrl && (
                    <p className="text-[10px] font-medium leading-tight truncate">
                      {item.nameNl ?? item.name}
                    </p>
                  )}
                  <p
                    className={cn(
                      'text-[10px]',
                      isActive ? 'text-primary-foreground/70' : 'text-muted-foreground',
                    )}
                  >
                    {formatter.format(item.price)} {priceSuffix}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        {pages.length > 1 && (
          <div className="flex items-center justify-between">
            <button
              type="button"
              aria-label="Vorige pagina"
              data-testid="handle-page-prev"
              onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
              disabled={!canPrev}
              className="size-8 rounded-full border border-border flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ‹
            </button>

            <div
              className="flex gap-1.5"
              role="tablist"
              aria-label="Pagina-indicator"
            >
              {pages.map((_, i) => (
                <span
                  key={i}
                  data-testid="handle-page-dot"
                  data-active={i === safeIndex ? 'true' : 'false'}
                  className={cn(
                    'size-2 rounded-full transition-colors',
                    i === safeIndex ? 'bg-foreground' : 'bg-muted-foreground/30',
                  )}
                />
              ))}
            </div>

            <button
              type="button"
              aria-label="Volgende pagina"
              data-testid="handle-page-next"
              onClick={() => setPageIndex((i) => Math.min(pages.length - 1, i + 1))}
              disabled={!canNext}
              className="size-8 rounded-full border border-border flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ›
            </button>
          </div>
        )}
      </div>

      {showMaterials && doorHandleId !== 'none' && (() => {
        const selectedHandle = handles.find((h) => h.id === doorHandleId)
        const allowed = selectedHandle?.allowedMaterials
        const visibleMetals =
          !allowed || allowed.length === 0
            ? METALS
            : METALS.filter((m) => allowed.includes(m.id))
        return (
        <div>
          <p className="text-sm font-medium mb-2">Afwerking</p>
          <div className="flex flex-wrap gap-3" data-testid="handle-material-swatches">
            {visibleMetals.map((m) => {
              const isActive = doorHandleMaterial === m.id
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setDoorHandleMaterial(m.id)}
                  aria-label={m.label}
                  aria-pressed={isActive}
                  title={m.label}
                  data-testid="handle-material-swatch"
                  data-material={m.id}
                  data-active={isActive ? 'true' : 'false'}
                  className={cn(
                    'group relative size-8 rounded-full transition-all',
                    'ring-offset-2 ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground',
                    isActive
                      ? 'ring-2 ring-foreground'
                      : 'ring-1 ring-border hover:ring-foreground/40',
                  )}
                  style={{ backgroundColor: m.swatch }}
                >
                  <span className="sr-only">{m.label}</span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      'pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap',
                      'rounded bg-foreground px-1.5 py-0.5 text-[10px] font-medium text-background',
                      'opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100',
                    )}
                  >
                    {m.label}
                  </span>
                </button>
              )
            })}
          </div>
          <p
            aria-live="polite"
            className="mt-2 text-xs text-muted-foreground"
            data-testid="handle-material-active-label"
          >
            {METALS.find((m) => m.id === doorHandleMaterial)?.label ?? ''}
          </p>
        </div>
        )
      })()}
    </div>
  )
}
