'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

import { cn } from '@/lib/utils'

export interface LightboxImage {
  url: string
  alt: string
}

interface LightboxProps {
  images: LightboxImage[]
  startIndex: number
  open: boolean
  onClose: () => void
}

export default function Lightbox({
  images,
  startIndex,
  open,
  onClose,
}: LightboxProps) {
  const [index, setIndex] = useState(startIndex)

  useEffect(() => {
    if (open) setIndex(startIndex)
  }, [open, startIndex])

  const next = useCallback(
    () => setIndex((i) => (i + 1) % images.length),
    [images.length],
  )
  const prev = useCallback(
    () => setIndex((i) => (i - 1 + images.length) % images.length),
    [images.length],
  )

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, next, prev, onClose])

  if (!open || images.length === 0) return null

  const current = images[index]
  const hasMultiple = images.length > 1

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Afbeelding vergroot"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Sluiten"
        className="absolute top-4 right-4 z-10 rounded-full bg-white/10 hover:bg-white/20 text-white p-2 transition-colors"
      >
        <X className="h-5 w-5" />
      </button>

      {hasMultiple && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              prev()
            }}
            aria-label="Vorige"
            className="absolute left-4 z-10 rounded-full bg-white/10 hover:bg-white/20 text-white p-3 transition-colors"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              next()
            }}
            aria-label="Volgende"
            className="absolute right-4 z-10 rounded-full bg-white/10 hover:bg-white/20 text-white p-3 transition-colors"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      <div
        className="relative w-[90vw] h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          key={current.url}
          src={current.url}
          alt={current.alt}
          fill
          sizes="90vw"
          priority
          className="object-contain"
        />
      </div>

      {hasMultiple && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setIndex(i)
              }}
              aria-label={`Ga naar afbeelding ${i + 1}`}
              className={cn(
                'h-2 w-2 rounded-full transition-colors',
                i === index ? 'bg-white' : 'bg-white/40 hover:bg-white/70',
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}
