interface StepHeaderProps {
  eyebrow: string
  title: string
  subtitle: string
}

export default function StepHeader({ eyebrow, title, subtitle }: StepHeaderProps) {
  return (
    <div className="flex flex-row items-baseline justify-between gap-3 md:flex-col md:items-stretch md:justify-start md:gap-1">
      <span
        data-testid="step-header-eyebrow"
        className="text-primary text-xs font-semibold uppercase tracking-widest shrink-0"
      >
        {eyebrow}
      </span>
      <h2
        data-testid="step-header-title"
        className="font-serif text-xl text-right leading-tight md:text-3xl md:text-left"
      >
        {title}
      </h2>
      <p
        data-testid="step-header-subtitle"
        className="hidden md:block text-sm text-muted-foreground"
      >
        {subtitle}
      </p>
    </div>
  )
}
