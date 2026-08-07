'use client'

import Link from 'next/link'
import { ArrowLeft, Check, Heart, ShoppingCart, User } from 'lucide-react'

import { CONFIGURATORS_HREF } from '@/lib/configurators'

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
      <div className="flex items-center gap-3 flex-1 basis-0 min-w-[180px]">
        {/* Back out of the configurator to the "Ontwerp je kast" section. The
            draft autosaves, so leaving does not lose the configuration. */}
        <Link
          href={CONFIGURATORS_HREF}
          data-testid="configurator-back"
          aria-label="Terug naar overzicht"
          className="flex items-center gap-1.5 -ml-2 pl-2 pr-3 h-9 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="size-4" />
          Terug
        </Link>
        <span className="font-serif text-lg tracking-tight">Kastenfabriek</span>
        <span className="text-sm text-muted-foreground">{productName}</span>
      </div>

      <ol className="shrink-0 flex items-center justify-center gap-2">
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

      <div className="flex items-center gap-1 flex-1 basis-0 min-w-[180px] justify-end">
        <Link
          href="/wishlist"
          aria-label="Wishlist"
          className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-muted transition-colors cursor-pointer"
        >
          <Heart className="size-5" />
        </Link>
        <Link
          href="/cart"
          aria-label="Cart"
          className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-muted transition-colors cursor-pointer"
        >
          <ShoppingCart className="size-5" />
        </Link>
        <Link
          href="/account"
          aria-label="Account"
          className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-muted transition-colors cursor-pointer"
        >
          <User className="size-5" />
        </Link>
      </div>
    </header>
  )
}
