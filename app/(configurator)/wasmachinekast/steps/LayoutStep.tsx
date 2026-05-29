'use client'

import { useState } from 'react'
import { useWasmachinekastStore } from '../store'
import { transition } from '../sections/wasmLayoutTransitions'
import type { WasmLayout, WasmSectionsState } from '../sections/types'
import { cn } from '@/lib/utils'

interface LayoutOption {
  value: WasmLayout
  label: string
  description: string
  disabled?: boolean
}

const OPTIONS: LayoutOption[] = [
  { value: 'high-only', label: 'Alleen hoge kast', description: 'Eén kast op volle hoogte' },
  { value: 'low-only', label: 'Alleen lage kast', description: '90cm kast met werkblad' },
  { value: 'low-left', label: 'Lage links + hoge rechts', description: 'Combinatie van twee kasten' },
  { value: 'low-right', label: 'Hoge links + lage rechts', description: 'Combinatie van twee kasten' },
]

function LayoutPreview({ value }: { value: WasmLayout }) {
  const W = 80
  const H = 60
  const stroke = 'stroke-neutral-700'
  switch (value) {
    case 'high-only':
      return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-16">
          <rect x="30" y="6" width="20" height="48" className={cn(stroke, 'fill-neutral-100')} strokeWidth="1.5" />
        </svg>
      )
    case 'low-only':
      return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-16">
          <rect x="20" y="30" width="40" height="24" className={cn(stroke, 'fill-neutral-100')} strokeWidth="1.5" />
          <line x1="18" y1="28" x2="62" y2="28" className={stroke} strokeWidth="2" />
        </svg>
      )
    case 'low-left':
      return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-16">
          <rect x="8" y="30" width="28" height="24" className={cn(stroke, 'fill-neutral-100')} strokeWidth="1.5" />
          <line x1="6" y1="28" x2="38" y2="28" className={stroke} strokeWidth="2" />
          <rect x="40" y="6" width="32" height="48" className={cn(stroke, 'fill-neutral-100')} strokeWidth="1.5" />
        </svg>
      )
    case 'low-right':
      return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-16">
          <rect x="8" y="6" width="32" height="48" className={cn(stroke, 'fill-neutral-100')} strokeWidth="1.5" />
          <rect x="44" y="30" width="28" height="24" className={cn(stroke, 'fill-neutral-100')} strokeWidth="1.5" />
          <line x1="42" y1="28" x2="74" y2="28" className={stroke} strokeWidth="2" />
        </svg>
      )
  }
}

function ConfirmDialog({
  open,
  onCancel,
  onConfirm,
  message,
}: {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
  message: string
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-5 space-y-4">
        <h3 className="text-base font-semibold">Layout wijzigen?</h3>
        <p className="text-sm text-muted-foreground">{message}</p>
        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onCancel}
            className="px-3 py-2 text-sm rounded-md border border-border hover:bg-muted"
          >
            Annuleren
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Doorgaan
          </button>
        </div>
      </div>
    </div>
  )
}

function buildSectionsState(s: {
  layout: WasmLayout
  width: number
  height: number
  moduleCount: number
  modules: ReturnType<typeof useWasmachinekastStore.getState>['modules']
  lowSection: ReturnType<typeof useWasmachinekastStore.getState>['lowSection']
  washerSection: ReturnType<typeof useWasmachinekastStore.getState>['washerSection']
}): WasmSectionsState {
  const active = { width: s.width, height: s.height, moduleCount: s.moduleCount, modules: s.modules }
  return {
    layout: s.layout,
    highSection: s.layout === 'low-only' ? null : active,
    lowSection: s.layout === 'low-only' ? active : s.lowSection,
    washerSection: s.washerSection,
  }
}

export default function LayoutStep() {
  const layout = useWasmachinekastStore((s) => s.layout)
  const width = useWasmachinekastStore((s) => s.width)
  const height = useWasmachinekastStore((s) => s.height)
  const moduleCount = useWasmachinekastStore((s) => s.moduleCount)
  const modules = useWasmachinekastStore((s) => s.modules)
  const lowSection = useWasmachinekastStore((s) => s.lowSection)
  const washerSection = useWasmachinekastStore((s) => s.washerSection)
  const buitenkantMaterialId = useWasmachinekastStore((s) => s.buitenkantMaterialId)
  const binnenkantMaterialId = useWasmachinekastStore((s) => s.binnenkantMaterialId)
  const applySectionsState = useWasmachinekastStore((s) => s.applySectionsState)

  const [pendingState, setPendingState] = useState<WasmSectionsState | null>(null)
  const [confirmMsg, setConfirmMsg] = useState('')

  function handlePick(next: WasmLayout) {
    if (next === layout) return
    const current = buildSectionsState({ layout, width, height, moduleCount, modules, lowSection, washerSection })
    const result = transition(current, next, { buitenkantMaterialId, binnenkantMaterialId })
    if (result.requiresConfirm) {
      const dropped = current.highSection && !result.nextState.highSection
        ? 'hoge kast'
        : 'lage kast'
      setConfirmMsg(`Dit verwijdert je ${dropped} configuratie. Doorgaan?`)
      setPendingState(result.nextState)
    } else {
      applySectionsState(result.nextState)
    }
  }

  function confirmApply() {
    if (pendingState) applySectionsState(pendingState)
    setPendingState(null)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {OPTIONS.map((opt) => {
          const selected = layout === opt.value
          const disabled = opt.disabled
          return (
            <button
              key={opt.value}
              type="button"
              disabled={disabled}
              onClick={() => handlePick(opt.value)}
              className={cn(
                'relative flex flex-col gap-2 rounded-md border-2 p-3 text-left transition-colors',
                selected
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/40',
                disabled && 'opacity-50 cursor-not-allowed hover:border-border',
              )}
            >
              <LayoutPreview value={opt.value} />
              <div>
                <div className="text-sm font-medium">{opt.label}</div>
                <div className="text-[11px] text-muted-foreground">{opt.description}</div>
              </div>
              {disabled && (
                <span className="absolute top-2 right-2 text-[10px] uppercase tracking-wide bg-muted text-muted-foreground rounded px-1.5 py-0.5">
                  Binnenkort
                </span>
              )}
            </button>
          )
        })}
      </div>
      <ConfirmDialog
        open={pendingState !== null}
        onCancel={() => setPendingState(null)}
        onConfirm={confirmApply}
        message={confirmMsg}
      />
    </div>
  )
}
