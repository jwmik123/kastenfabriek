'use client'

import { Check, Heart, ShoppingCart, User } from 'lucide-react'

export interface TopBarStep {
  label: string
  number: number
}

interface ConfiguratorTopBarProps {
  steps: TopBarStep[]
  currentStep: number
  onStep: (n: number) => void
  productName?: string
}

export default function ConfiguratorTopBar({
  steps,
  currentStep,
  onStep,
  productName = 'Kledingkast',
}: ConfiguratorTopBarProps) {
  return (
    <header
      data-testid="configurator-top-bar"
      className="h-16 shrink-0 border-b border-border bg-background flex items-center px-6"
    >
      <div className="flex items-center gap-3 min-w-[180px]">
        <span className="font-serif text-lg tracking-tight">Kastenfabriek</span>
        <span className="text-sm text-muted-foreground">{productName}</span>
      </div>

      <ol className="flex-1 flex items-center justify-center gap-2">
        {steps.map((step, i) => {
          const isDone = step.number < currentStep
          const isCurrent = step.number === currentStep
          const isTodo = step.number > currentStep
          const interactive = isDone

          const bubbleClasses = isDone
            ? 'bg-primary-green text-background'
            : isCurrent
              ? 'bg-foreground text-background'
              : 'bg-transparent text-muted-foreground border border-border'

          return (
            <li key={step.number} className="flex items-center gap-2">
              <button
                type="button"
                aria-label={`Step ${step.number}: ${step.label}`}
                aria-current={isCurrent ? 'step' : undefined}
                data-state={isDone ? 'done' : isCurrent ? 'current' : 'todo'}
                disabled={!interactive}
                onClick={interactive ? () => onStep(step.number) : undefined}
                className={`flex items-center gap-2 rounded-full px-2 py-1 transition-colors ${
                  interactive ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
                }`}
              >
                <span
                  className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-medium ${bubbleClasses}`}
                >
                  {isDone ? <Check className="size-4" /> : step.number}
                </span>
                <span
                  className={`text-sm ${isCurrent ? 'font-medium text-foreground' : 'text-muted-foreground'}`}
                >
                  {step.label}
                </span>
              </button>
              {i < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  data-testid="step-connector"
                  className="w-8 h-px bg-border"
                />
              )}
            </li>
          )
        })}
      </ol>

      <div className="flex items-center gap-1 min-w-[180px] justify-end">
        <button
          type="button"
          aria-label="Wishlist"
          className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-muted transition-colors cursor-pointer"
        >
          <Heart className="size-5" />
        </button>
        <button
          type="button"
          aria-label="Cart"
          className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-muted transition-colors cursor-pointer"
        >
          <ShoppingCart className="size-5" />
        </button>
        <button
          type="button"
          aria-label="Account"
          className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-muted transition-colors cursor-pointer"
        >
          <User className="size-5" />
        </button>
      </div>
    </header>
  )
}
