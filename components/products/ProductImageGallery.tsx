'use client'

import { useState } from 'react'
import Image from 'next/image'

import { cn } from '@/lib/utils'
import Lightbox, { type LightboxImage } from './Lightbox'

export default function ProductImageGallery({
  images,
}: {
  images: LightboxImage[]
}) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  if (images.length === 0) return null

  const active = images[activeIndex] ?? images[0]

  return (
    <>
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          aria-label="Afbeelding vergroten"
          className="relative aspect-square w-full overflow-hidden rounded-xl bg-gray-100 cursor-zoom-in group"
        >
          <Image
            src={active.url}
            alt={active.alt}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </button>

        {images.length > 1 && (
          <ul className="grid grid-cols-5 gap-2">
            {images.map((img, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  aria-label={`Toon afbeelding ${i + 1}`}
                  aria-current={i === activeIndex}
                  className={cn(
                    'relative aspect-square w-full overflow-hidden rounded-md bg-gray-100 border-2 transition-colors',
                    i === activeIndex
                      ? 'border-primary'
                      : 'border-transparent hover:border-foreground/30',
                  )}
                >
                  <Image
                    src={img.url}
                    alt={img.alt}
                    fill
                    sizes="120px"
                    className="object-cover"
                  />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Lightbox
        images={images}
        startIndex={activeIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  )
}
