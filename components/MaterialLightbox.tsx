'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { ArrowRight, X } from 'lucide-react'
import type { Material } from '@/app/(configurator)/kledingkast/materials'

/** Sample product page; `staal` preselects the material in its picker. */
const SAMPLES_PATH = '/producten/materiaalstalen'

/**
 * Enlarged view of one material: big swatch, its name, and a link straight to
 * the sample order page with this material already ticked.
 */
export default function MaterialLightbox({
  material,
  onClose,
}: {
  material: Material | null
  onClose: () => void
}) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!material) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panelRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [material, onClose])

  if (!material) return null

  const isTexture = material.type === 'texture'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      data-testid="material-lightbox"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={material.name}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl focus:outline-none"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Sluiten"
          data-testid="material-lightbox-close"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-sm transition-colors hover:text-gray-900"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative aspect-square w-full bg-gray-100">
          {isTexture ? (
            <Image
              src={material.preview.replace(/\.webp$/, '.jpg')}
              alt={material.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 90vw, 448px"
              priority
            />
          ) : (
            <span
              className="block h-full w-full"
              style={{ backgroundColor: material.color }}
            />
          )}
        </div>

        <div className="p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
            {isTexture ? 'Fineer' : 'Kleur'}
          </p>
          <h3 className="mt-1 text-2xl font-semibold text-gray-900">{material.name}</h3>
          <p className="mt-2 text-sm text-gray-600">
            Bestel dit staal gratis en bekijk het rustig thuis.
          </p>

          <Link
            href={`${SAMPLES_PATH}?staal=${encodeURIComponent(material.id)}`}
            data-testid="material-lightbox-order"
            className="group mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--color-secondary)] px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Bestel dit staal
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  )
}
