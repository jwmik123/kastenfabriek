'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import {
  MATERIALS,
  ColorMaterial,
  Material,
  TextureMaterial,
} from '@/app/(configurator)/kledingkast/materials'
import MaterialLightbox from './MaterialLightbox'

const colors = MATERIALS.filter((m): m is ColorMaterial => m.type === 'color')
const textures = MATERIALS.filter((m): m is TextureMaterial => m.type === 'texture')

export default function MaterialsSection() {
  // Clicking a swatch enlarges it, with a link on to ordering that sample.
  const [zoomed, setZoomed] = useState<Material | null>(null)

  return (
    <section className="bg-[#f2ede4] py-20 px-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between items-center gap-8 mb-16">
          <div>
            <h2 className="font-poppins text-5xl md:text-6xl font-bold leading-[1.05]">
              {colors.length} kleuren.<br />
              <span className="text-[var(--color-secondary)]">{textures.length} fineers.</span><br />
            </h2>
          </div>
          <div className="md:max-w-[480px] self-start">
            <p className="text-gray-600 text-base leading-relaxed">
              Al onze materialen zijn op voorraad. Bestel tot drie gratis stalen en voel zelf —
              een textuur zegt meer dan een schermweergave. Wij sturen binnen drie werkdagen.
            </p>
            <Link
              href="/producten/materiaalstalen"
              className="group mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--color-secondary)] px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              Bestel gratis materiaalstalen
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl px-4 sm:px-8 py-8 sm:py-10">

          {/* Fineers */}
          <div className="flex flex-col md:flex-row md:gap-10">
            <div className="md:w-36 md:flex-shrink-0 pt-1 mb-4 md:mb-0">
              <p className="font-semibold text-sm text-primary-900">Fineers</p>
              <p className="text-sm text-gray-400 mt-0.5">{textures.length} opties</p>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-5 flex-1">
              {textures.map((texture) => (
                <button
                  key={texture.id}
                  type="button"
                  onClick={() => setZoomed(texture)}
                  aria-label={`${texture.name} vergroot bekijken`}
                  data-testid="material-swatch-tile"
                  data-material={texture.id}
                  className="group flex flex-col gap-2 text-left cursor-pointer"
                >
                  <div className="w-full aspect-square rounded-sm overflow-hidden relative transition-shadow duration-300 group-hover:shadow-lg">
                    <Image
                      src={texture.preview.replace(/\.webp$/, '.jpg')}
                      alt={texture.name}
                      fill
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-125"
                      sizes="(max-width: 640px) 30vw, 160px"
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-800 leading-tight transition-colors group-hover:text-[var(--color-secondary)]">{texture.name}</span>
                </button>
              ))}
            </div>
          </div>

          <hr className="my-8 border-gray-100" />

          {/* Kleuren */}
          <div className="flex flex-col md:flex-row md:gap-10">
            <div className="md:w-36 md:flex-shrink-0 pt-1 mb-4 md:mb-0">
              <p className="font-semibold text-sm text-gray-900">Kleuren</p>
              <p className="text-sm text-gray-400 mt-0.5">{colors.length} opties</p>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-10 gap-3 sm:gap-5 flex-1">
              {colors.map((color) => (
                <button
                  key={color.id}
                  type="button"
                  onClick={() => setZoomed(color)}
                  aria-label={`${color.name} vergroot bekijken`}
                  data-testid="material-swatch-tile"
                  data-material={color.id}
                  className="group flex flex-col gap-2 text-left cursor-pointer"
                >
                  <div
                    className="w-full aspect-square rounded-sm border border-black/5 transition-transform duration-300 ease-out group-hover:scale-110 group-hover:shadow-lg"
                    style={{ backgroundColor: color.color }}
                  />
                  <span className="text-xs font-medium text-gray-700 leading-tight transition-colors group-hover:text-[var(--color-secondary)]">{color.name}</span>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      <MaterialLightbox material={zoomed} onClose={() => setZoomed(null)} />
    </section>
  )
}
