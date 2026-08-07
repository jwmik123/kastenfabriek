import Link from 'next/link'

import { MATERIALS } from '@/app/(configurator)/kledingkast/materials'
import { SAMPLES_ANCHOR } from '@/lib/configurators'
import type { ProductListItem } from '@/sanity/lib/products'

const NUMBER_WORDS = ['nul', 'één', 'twee', 'drie', 'vier', 'vijf', 'zes']

function amountLabel(n: number | null) {
  if (n == null) return null
  return NUMBER_WORDS[n] ?? String(n)
}

/**
 * Sample-swatch banner between the two sections. Swatches are real colourway
 * values from the configurator's material list, and the copy takes the maximum
 * from the samples product in Sanity.
 */
export default function SamplesBanner({ product }: { product: ProductListItem }) {
  const swatches = MATERIALS.filter((m) => m.type === 'color').slice(0, 4)
  const max = amountLabel(product.maxSamples)

  return (
    <section id={SAMPLES_ANCHOR} className="scroll-mt-[124px] bg-primary text-[#f1ede4]">
      <div className="mx-auto grid max-w-[1280px] items-center gap-8 px-5 py-9 sm:px-10 lg:grid-cols-[auto_1fr_auto] lg:gap-10 lg:py-10">
        <div className="flex gap-2" aria-hidden="true">
          {swatches.map((m) => (
            <span
              key={m.id}
              title={m.name}
              className="h-[60px] w-[46px] rounded-lg"
              style={{ backgroundColor: m.type === 'color' ? m.color : undefined }}
            />
          ))}
        </div>

        <div>
          <h2 className="text-[22px] font-semibold tracking-[-0.015em]">
            Eerst zeker zijn van je kleur?
          </h2>
          <p className="mt-1.5 text-[15px] text-[#f1ede4]/70">
            Bestel {max ? `tot ${max} ` : ''}gratis materiaalstalen — kosteloos
            thuisbezorgd binnen Nederland.
          </p>
        </div>

        <Link
          href={`/producten/${product.slug}`}
          className="inline-flex h-[50px] items-center gap-2.5 justify-self-start rounded-xl bg-amber-500 px-6 text-[15px] font-semibold text-[#1f2a20] transition-colors hover:bg-amber-400 lg:justify-self-end"
        >
          Bestel gratis stalen <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  )
}
