import { Fragment } from 'react'
import {
  Clock,
  MessageCircle,
  Palette,
  Ruler,
  ShieldCheck,
  Truck,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import type { ConfiguratorService, ServiceIcon } from '@/lib/configurator/services'

const ICONS: Record<ServiceIcon, LucideIcon> = {
  ruler: Ruler,
  wrench: Wrench,
  truck: Truck,
  palette: Palette,
  clock: Clock,
  shield: ShieldCheck,
  chat: MessageCircle,
}

function ServiceItem({ icon, title, description }: ConfiguratorService) {
  const Icon = ICONS[icon] ?? Wrench

  return (
    <div className="flex items-start gap-4">
      <Icon size={28} className="shrink-0 text-primary mt-0.5" />
      <div>
        <p className="font-semibold text-sm text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
  )
}

/**
 * Services strip directly under a configurator, above the specs summary.
 * Content comes from the `configuratorServices` singleton in Sanity; the page
 * fetches it server-side because the summary sections around this are client
 * components.
 */
export default function ConfiguratorServicesBar({
  services,
}: {
  services: ConfiguratorService[]
}) {
  return (
    <div className="w-full bg-primary-200 px-8 py-12 flex justify-between flex-col sm:flex-row gap-12">
      {services.map((service, index) => (
        <Fragment key={`${index}-${service.title}`}>
          {index > 0 && <div className="hidden sm:block w-px bg-primary shrink-0" />}
          <ServiceItem {...service} />
        </Fragment>
      ))}
    </div>
  )
}
