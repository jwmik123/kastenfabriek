import Image from 'next/image'
import { MATERIALS, ColorMaterial, TextureMaterial } from '@/app/(configurator)/kledingkast/materials'

const colors = MATERIALS.filter((m): m is ColorMaterial => m.type === 'color')
const textures = MATERIALS.filter((m): m is TextureMaterial => m.type === 'texture')

export default function MaterialsSection() {
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
          <p className="md:max-w-[480px] text-gray-600 text-base leading-relaxed  self-start">
            Al onze materialen zijn op voorraad. Bestel tot vijf gratis stalen en voel zelf —
            een textuur zegt meer dan een schermweergave. Wij sturen binnen drie werkdagen.
          </p>
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
                <div key={texture.id} className="flex flex-col gap-2">
                  <div className="w-full aspect-square rounded-sm overflow-hidden relative">
                    <Image
                      src={texture.preview.replace(/\.webp$/, '.jpg')}
                      alt={texture.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 30vw, 160px"
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-800 leading-tight">{texture.name}</span>
                </div>
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
                <div key={color.id} className="flex flex-col gap-2">
                  <div
                    className="w-full aspect-square rounded-sm border border-black/5"
                    style={{ backgroundColor: color.color }}
                  />
                  <span className="text-xs font-medium text-gray-700 leading-tight">{color.name}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
