'use client'

import { cn } from '@/lib/utils'

interface Option<T extends string> {
  value: T
  label: string
}

interface SegmentedControlProps<T extends string> {
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
  disabledValues?: T[]
  className?: string
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  disabledValues = [],
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      className={cn('bg-background rounded-md p-[3px] grid gap-1', className)}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((opt) => {
        const isActive = opt.value === value
        const isDisabled = disabledValues.includes(opt.value)

        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => !isDisabled && onChange(opt.value)}
            className={cn(
              'py-2 text-sm rounded-[6px] transition-colors',
              isActive
                ? 'bg-foreground text-background font-medium'
                : 'bg-transparent text-muted-foreground hover:bg-muted',
              isDisabled && 'opacity-45 cursor-not-allowed pointer-events-none',
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
