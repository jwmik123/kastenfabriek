interface StepHeaderProps {
  eyebrow: string
  title: string
  subtitle: string
}

export default function StepHeader({ eyebrow, title, subtitle }: StepHeaderProps) {
  return (
    <div className="flex flex-col gap-1">
      <span
        data-testid="step-header-eyebrow"
        className="text-primary text-xs font-semibold uppercase tracking-widest"
      >
        {eyebrow}
      </span>
      <h2
        data-testid="step-header-title"
        className="font-serif text-3xl leading-tight"
      >
        {title}
      </h2>
      <p
        data-testid="step-header-subtitle"
        className="text-sm text-muted-foreground"
      >
        {subtitle}
      </p>
    </div>
  )
}
