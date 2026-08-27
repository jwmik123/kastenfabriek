/**
 * The configurators, listed on their own /ontwerp-je-kast page.
 *
 * The site nav, the homepage hero and the configurators' own back button all
 * point at CONFIGURATORS_HREF — change it here and they follow.
 */
import { maxTotalWidthCm } from '@/lib/configurator/dimensions'

export const CONFIGURATORS_HREF = '/ontwerp-je-kast'

export const CONFIGURATORS_ANCHOR = 'opmaat'
export const WEBSHOP_ANCHOR = 'webshop'
export const SAMPLES_ANCHOR = 'stalen'

/** Explains the configurator flow — the werkwijze block on the homepage. */
export const HOW_IT_WORKS_HREF = '/#werkwijze'

export interface ConfiguratorSpec {
  label: string
  value: string
}

export interface ConfiguratorItem {
  id: string
  title: string
  description: string
  image: string
  href: string
  /** Small pill on the image, e.g. "Populair". */
  badge?: string
  specs: ConfiguratorSpec[]
}

/**
 * Dimension limits as stored on the `pricingConfig` document. Only the fields
 * the products page reads — the configurators read the full object.
 */
export interface DimensionConstraints {
  maxTotalWidth?: number
  singleCorpus?: {
    minWidth?: number
    maxWidth?: number
    minHeight?: number
    maxHeight?: number
    minDepth?: number
    maxDepth?: number
  }
  topCabinet?: { maxHeight?: number }
}

function range(min: number, max: number, unit = 'cm') {
  return `${min} – ${max} ${unit}`
}

/**
 * Build the spec rows from the live Sanity constraints, using the same
 * derivations as each configurator's Afmetingen step — so the numbers on this
 * page can never drift from what the configurator actually allows.
 *
 * Kledingkast: `app/(configurator)/kledingkast/steps/DimensionsStep.tsx`
 * Wasmachinekast: `app/(configurator)/wasmachinekast/steps/DimensionsStep.tsx`
 * (the washer cabinet needs at least 85 cm depth to fit a machine).
 */
export function configuratorsWithSpecs(
  constraints: DimensionConstraints | null | undefined,
): ConfiguratorItem[] {
  const sc = constraints?.singleCorpus
  const minW = sc?.minWidth ?? 15
  const maxW = maxTotalWidthCm(constraints)
  const minH = sc?.minHeight ?? 200
  const maxH = (sc?.maxHeight ?? 275) + (constraints?.topCabinet?.maxHeight ?? 110)
  const minD = sc?.minDepth ?? 15
  const maxD = sc?.maxDepth ?? 90

  return [
    {
      id: 'kledingkast',
      title: 'Kledingkast',
      description:
        'Volledig op maat, tot aan het plafond. Kies indeling, materiaal en handgrepen.',
      image: '/images/kledingkast.png',
      href: '/kledingkast',
      badge: 'Populair',
      specs: [
        { label: 'Breedte', value: range(minW, maxW) },
        { label: 'Hoogte', value: range(minH, maxH) },
        { label: 'Diepte', value: range(minD, maxD) },
      ],
    },
    {
      id: 'wasmachinekast',
      title: 'Wasmachinekast',
      description:
        'Wasmachine en droger netjes weggewerkt, met werkblad en lades naar keuze.',
      image: '/images/wasmachinekast.png',
      href: '/wasmachinekast',
      specs: [
        { label: 'Breedte', value: range(minW, maxW) },
        { label: 'Hoogte', value: range(minH, maxH) },
        { label: 'Diepte', value: range(Math.max(85, minD), maxD) },
      ],
    },
  ]
}

/** Static list for links that don't need specs (nav, homepage CTAs). */
export const CONFIGURATORS = configuratorsWithSpecs(null)

export interface UpcomingConfigurator {
  id: string
  title: string
  description: string
}

/** Configurators still in the pipeline — shown as placeholder cards. */
export const UPCOMING_CONFIGURATORS: UpcomingConfigurator[] = [
  {
    id: 'tv-meubel',
    title: 'TV-meubel',
    description: 'Zwevend of staand, met kabelgoot en soft-close lades.',
  },
  {
    id: 'badkamermeubel',
    title: 'Badkamermeubel',
    description: 'Vochtbestendig, met keramische wastafel op maat.',
  },
]

export const CONTACT_EMAIL = 'info@kasten-fabriek.nl'

/** "Houd me op de hoogte" — no mailing list yet, so this opens an email. */
export function notifyHref(title: string) {
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
    `Houd me op de hoogte: ${title}`,
  )}`
}
