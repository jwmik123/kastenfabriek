import { Ruler, Wrench } from 'lucide-react'

function ServiceItem({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="text-primary mt-0.5">{icon}</div>
      <div>
        <p className="font-semibold text-sm text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
  )
}

/** Services strip directly under a configurator, above the specs summary. */
export default function ConfiguratorServicesBar() {
  return (
    <div className="w-full bg-primary-200 px-8 py-12 flex justify-between flex-col sm:flex-row gap-12">
      <ServiceItem
        icon={<Ruler size={28} className="shrink-0" />}
        title="Optionele Inmeetservice"
        description="Wij meten jouw ruimte professioneel op."
      />
      <div className="hidden sm:block w-px bg-primary" />
      <ServiceItem
        icon={<Wrench size={28} className="shrink-0" />}
        title="Optionele Montageservice"
        description="Wij monteren de kast bij jou thuis."
      />
      <div className="hidden sm:block w-px bg-primary" />
      <ServiceItem
        icon={<Ruler size={28} className="shrink-0" />}
        title="Optionele Inmeetservice"
        description="Wij meten jouw ruimte professioneel op."
      />
      <div className="hidden sm:block w-px bg-primary" />
      <ServiceItem
        icon={<Wrench size={28} className="shrink-0" />}
        title="Optionele Montageservice"
        description="Wij monteren de kast bij jou thuis."
      />
    </div>
  )
}
