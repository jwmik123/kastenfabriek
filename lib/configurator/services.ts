/**
 * The services strip under a configurator. Shared by the Sanity schema, the
 * server-side fetch and the component, so the icon vocabulary is written down
 * once and nothing here pulls in the `sanity` package on the client.
 */

/** Icons an editor can pick, mapped to a lucide icon in the component. */
export const SERVICE_ICONS = [
  { title: 'Rolmaat — maatwerk', value: 'ruler' },
  { title: 'Moersleutel — montage', value: 'wrench' },
  { title: 'Bezorgwagen — levering', value: 'truck' },
  { title: 'Kleurenpalet — materialen', value: 'palette' },
  { title: 'Klok — levertijd', value: 'clock' },
  { title: 'Schild — garantie', value: 'shield' },
  { title: 'Praatwolk — advies', value: 'chat' },
] as const

export type ServiceIcon = (typeof SERVICE_ICONS)[number]['value']

export interface ConfiguratorService {
  icon: ServiceIcon
  title: string
  description: string
}

/**
 * Shown when no `configuratorServices` document exists yet. Deliberately free of
 * amounts — delivery and montage prices live in `pricingConfig`, and copy that
 * repeats them drifts the moment they change.
 */
export const DEFAULT_CONFIGURATOR_SERVICES: ConfiguratorService[] = [
  {
    icon: 'ruler',
    title: 'Tot de millimeter op maat',
    description: 'Je kast wordt gemaakt op de maten die je hier invult.',
  },
  {
    icon: 'wrench',
    title: 'Montage inbegrepen',
    description: 'Onze eigen monteurs plaatsen de kast bij jou thuis.',
  },
  {
    icon: 'truck',
    title: 'Levering in 8 tot 12 weken',
    description: 'Eén vaste bezorgprijs per bestelling, hoe groot de kast ook is.',
  },
  {
    icon: 'palette',
    title: 'Gratis materiaalstalen',
    description: 'Bekijk kleur en fineer eerst thuis, in je eigen licht.',
  },
]
