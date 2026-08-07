import Image from 'next/image'
import Link from 'next/link'

import {
  CONFIGURATORS_ANCHOR,
  HOW_IT_WORKS_HREF,
  UPCOMING_CONFIGURATORS,
  notifyHref,
  type ConfiguratorItem,
  type UpcomingConfigurator,
} from '@/lib/configurators'

import { MONO_FONT } from './Eyebrow'

function Arrow() {
  return (
    <span aria-hidden="true" className="leading-none">
      →
    </span>
  )
}

function ConfiguratorCard({ item }: { item: ConfiguratorItem }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-[18px] border border-[#1f2a20]/8 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-22px_rgba(31,42,32,0.35)]">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={item.image}
          alt={item.title}
          fill
          sizes="(max-width: 1024px) 100vw, 33vw"
          className="object-cover"
        />
        {item.badge && (
          <span className="absolute left-3.5 top-3.5 rounded-[7px] bg-[#1f2a20]/86 px-2.5 py-1.5 text-[11.5px] font-medium uppercase tracking-[0.04em] text-[#f1ede4]">
            {item.badge}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-[21px] font-semibold tracking-[-0.015em]">{item.title}</h3>
        <p className="mt-2 text-[14.5px] leading-[1.55] text-[#6e7569]">
          {item.description}
        </p>

        <dl className="my-5 divide-y divide-[#1f2a20]/10 border-y border-[#1f2a20]/10">
          {item.specs.map((spec) => (
            <div key={spec.label} className="flex justify-between gap-4 py-2.5 text-[13px]">
              <dt className="text-[#6e7569]">{spec.label}</dt>
              <dd className="font-medium">{spec.value}</dd>
            </div>
          ))}
        </dl>

        <Link
          href={item.href}
          className="mt-auto flex h-[46px] items-center justify-center gap-2.5 rounded-[11px] bg-primary text-[14.5px] font-medium text-[#f1ede4] transition-colors hover:bg-[#16261a] hover:text-white"
        >
          Start configurator <Arrow />
        </Link>
      </div>
    </article>
  )
}

function UpcomingCard({ item }: { item: UpcomingConfigurator }) {
  return (
    <article className="flex flex-1 flex-col justify-between rounded-[18px] border border-dashed border-[#1f2a20]/25 bg-white/50 p-[22px]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold tracking-[-0.01em]">{item.title}</h3>
          <p className="mt-[7px] max-w-[30ch] text-[13.5px] leading-[1.5] text-[#6e7569]">
            {item.description}
          </p>
        </div>
        <span
          style={MONO_FONT}
          className="shrink-0 whitespace-nowrap rounded-md border border-[#1f2a20]/20 px-2 py-1.5 text-[10.5px] uppercase tracking-[0.1em] text-[#6e7569]"
        >
          Binnenkort
        </span>
      </div>
      <a
        href={notifyHref(item.title)}
        className="mt-[18px] inline-flex items-center gap-[7px] text-[13.5px] font-medium text-primary hover:text-[#16261a]"
      >
        Houd me op de hoogte <Arrow />
      </a>
    </article>
  )
}

/** "01 — Op maat": the live configurators, with the pipeline ones beside them. */
export default function ConfiguratorsSection({
  configurators,
}: {
  configurators: ConfiguratorItem[]
}) {
  return (
    <section
      id={CONFIGURATORS_ANCHOR}
      className="scroll-mt-[124px] py-16 sm:py-24"
    >
      <div className="mx-auto max-w-[1280px] px-5 sm:px-10">
        <div className="grid items-end gap-8 border-b border-[#1f2a20]/14 pb-8 md:grid-cols-[1fr_auto] md:gap-12">
          <div>
            <h2 className="text-[32px] font-semibold leading-[1.08] tracking-[-0.025em] sm:text-[42px]">
              Stel je kast zelf samen
            </h2>
            <p className="mt-3.5 max-w-[58ch] text-[16.5px] leading-[1.6] text-[#555c51]">
              Kies een type, vul je maten in en zie direct hoe je kast eruitziet én wat
              hij kost. Alles wordt in onze eigen fabriek gemaakt.
            </p>
          </div>
          <Link
            href={HOW_IT_WORKS_HREF}
            className="inline-flex items-center gap-2 self-start border-b border-[#1f2a20]/30 pb-1 text-sm font-medium hover:border-primary hover:text-primary md:self-end"
          >
            Hoe werkt de configurator? <Arrow />
          </Link>
        </div>

        <div className="mt-10 grid gap-[22px] md:grid-cols-2 lg:grid-cols-3">
          {configurators.map((item) => (
            <ConfiguratorCard key={item.id} item={item} />
          ))}

          <div className="flex flex-col gap-[22px] sm:flex-row lg:flex-col">
            {UPCOMING_CONFIGURATORS.map((item) => (
              <UpcomingCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
