'use client'

import { MATERIALS } from '../materials'
import { cn } from '@/lib/utils'

interface MaterialSwatchGridProps {
  materialId: string
  onSelect: (id: string) => void
  hideOutsideOnly?: boolean
  className?: string
}

/**
 * Square-swatch grid picker — the mobile counterpart of MaterialColorWheel.
 * Textures come first (that's the MATERIALS order), then colors.
 */
export default function MaterialSwatchGrid({
  materialId,
  onSelect,
  hideOutsideOnly = false,
  className,
}: MaterialSwatchGridProps) {
  const items = MATERIALS.filter(
    (m) => !(hideOutsideOnly && m.type === 'color' && m.outsideOnly),
  )

  return (
    <div
      className={cn('grid w-full grid-cols-5 gap-2', className)}
      data-testid="material-swatch-grid"
      role="listbox"
      aria-label="Materiaal"
    >
      {items.map((mat) => {
        const isSelected = mat.id === materialId
        return (
          <button
            key={mat.id}
            type="button"
            role="option"
            aria-selected={isSelected}
            aria-label={mat.name}
            title={mat.name}
            onClick={() => onSelect(mat.id)}
            data-testid="material-swatch"
            data-material={mat.id}
            data-active={isSelected ? 'true' : 'false'}
            className={cn(
              'relative aspect-square overflow-hidden rounded-md border border-black/10 transition-all',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-current',
              isSelected
                ? 'ring-2 ring-current ring-offset-2 ring-offset-transparent'
                : 'hover:brightness-95',
            )}
            style={mat.type === 'color' ? { backgroundColor: mat.color } : undefined}
          >
            {mat.type === 'texture' && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mat.preview}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
            <span className="sr-only">{mat.name}</span>
          </button>
        )
      })}
    </div>
  )
}
