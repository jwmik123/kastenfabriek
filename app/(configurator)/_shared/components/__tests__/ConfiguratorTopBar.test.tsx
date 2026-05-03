import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ConfiguratorTopBar, { TopBarStep } from '../ConfiguratorTopBar'

const STEPS: TopBarStep[] = [
  { label: 'Afmetingen', number: 1 },
  { label: 'Modules', number: 2 },
  { label: 'Materiaal', number: 3 },
  { label: 'Handgrepen', number: 4 },
  { label: 'Accessoires', number: 5 },
]

function extractStepStates(html: string): Record<number, string> {
  const states: Record<number, string> = {}
  const re = /Step (\d+):[^"]*"[^>]*data-state="([^"]+)"/g
  let m
  while ((m = re.exec(html)) !== null) {
    states[Number(m[1])] = m[2]
  }
  return states
}

describe('ConfiguratorTopBar', () => {
  it('marks steps before current as done, current as current, after as todo', () => {
    const html = renderToStaticMarkup(
      <ConfiguratorTopBar steps={STEPS} currentStep={3} onStep={() => {}} />,
    )
    const states = extractStepStates(html)
    expect(states[1]).toBe('done')
    expect(states[2]).toBe('done')
    expect(states[3]).toBe('current')
    expect(states[4]).toBe('todo')
    expect(states[5]).toBe('todo')
  })

  it('renders all step labels', () => {
    const html = renderToStaticMarkup(
      <ConfiguratorTopBar steps={STEPS} currentStep={3} onStep={() => {}} />,
    )
    STEPS.forEach((s) => expect(html).toContain(s.label))
  })

  it('renders connector lines between bubbles', () => {
    const html = renderToStaticMarkup(
      <ConfiguratorTopBar steps={STEPS} currentStep={3} onStep={() => {}} />,
    )
    const connectors = html.match(/data-testid="step-connector"/g) ?? []
    expect(connectors).toHaveLength(STEPS.length - 1)
  })

  it('renders 64px height with bottom border', () => {
    const html = renderToStaticMarkup(
      <ConfiguratorTopBar steps={STEPS} currentStep={3} onStep={() => {}} />,
    )
    expect(html).toMatch(/h-16/)
    expect(html).toMatch(/border-b/)
  })

  it('disables current and todo step buttons; enables done step buttons', () => {
    const html = renderToStaticMarkup(
      <ConfiguratorTopBar steps={STEPS} currentStep={3} onStep={() => {}} />,
    )
    // Extract per-step disabled state
    const re = /Step (\d+):[^"]*"([^>]*)>/g
    const disabled: Record<number, boolean> = {}
    let m
    while ((m = re.exec(html)) !== null) {
      disabled[Number(m[1])] = m[2].includes('disabled')
    }
    expect(disabled[1]).toBe(false)
    expect(disabled[2]).toBe(false)
    expect(disabled[3]).toBe(true)
    expect(disabled[4]).toBe(true)
    expect(disabled[5]).toBe(true)
  })

  it('clicking a done step calls onStep with that step number', () => {
    const onStep = vi.fn()
    // Manually invoke the click handler logic by rendering with createElement and inspecting props
    // Static markup loses event handlers, so we test by re-creating element tree and walking it.
    const tree = (
      <ConfiguratorTopBar steps={STEPS} currentStep={3} onStep={onStep} />
    )
    // Find buttons via React.Children traversal
    const buttons: { stepNumber: number; onClick?: () => void; disabled: boolean }[] = []
    const visit = (node: React.ReactNode): void => {
      if (!node || typeof node !== 'object') return
      if (Array.isArray(node)) {
        node.forEach(visit)
        return
      }
      const el = node as React.ReactElement<{
        children?: React.ReactNode
        ['aria-label']?: string
        onClick?: () => void
        disabled?: boolean
      }>
      const props = el.props ?? {}
      const aria = props['aria-label']
      if (typeof el.type === 'string' && el.type === 'button' && typeof aria === 'string') {
        const match = aria.match(/^Step (\d+):/)
        if (match) {
          buttons.push({
            stepNumber: Number(match[1]),
            onClick: props.onClick,
            disabled: !!props.disabled,
          })
        }
      }
      visit(props.children)
    }
    // The component returns JSX; render its function directly to walk children
    const rendered = (ConfiguratorTopBar as unknown as (
      p: React.ComponentProps<typeof ConfiguratorTopBar>,
    ) => React.ReactElement)({ steps: STEPS, currentStep: 3, onStep })
    visit(rendered)

    const doneStep = buttons.find((b) => b.stepNumber === 1)!
    expect(doneStep.disabled).toBe(false)
    doneStep.onClick?.()
    expect(onStep).toHaveBeenCalledWith(1)
  })

  it('clicking the current step does not call onStep', () => {
    const onStep = vi.fn()
    const rendered = (ConfiguratorTopBar as unknown as (
      p: React.ComponentProps<typeof ConfiguratorTopBar>,
    ) => React.ReactElement)({ steps: STEPS, currentStep: 3, onStep })

    const buttons: { stepNumber: number; onClick?: () => void; disabled: boolean }[] = []
    const visit = (node: React.ReactNode): void => {
      if (!node || typeof node !== 'object') return
      if (Array.isArray(node)) {
        node.forEach(visit)
        return
      }
      const el = node as React.ReactElement<{
        children?: React.ReactNode
        ['aria-label']?: string
        onClick?: () => void
        disabled?: boolean
      }>
      const props = el.props ?? {}
      const aria = props['aria-label']
      if (typeof el.type === 'string' && el.type === 'button' && typeof aria === 'string') {
        const match = aria.match(/^Step (\d+):/)
        if (match) {
          buttons.push({
            stepNumber: Number(match[1]),
            onClick: props.onClick,
            disabled: !!props.disabled,
          })
        }
      }
      visit(props.children)
    }
    visit(rendered)

    const currentStep = buttons.find((b) => b.stepNumber === 3)!
    expect(currentStep.disabled).toBe(true)
    expect(currentStep.onClick).toBeUndefined()
    expect(onStep).not.toHaveBeenCalled()
  })

  it('clicking a todo step does not call onStep', () => {
    const onStep = vi.fn()
    const rendered = (ConfiguratorTopBar as unknown as (
      p: React.ComponentProps<typeof ConfiguratorTopBar>,
    ) => React.ReactElement)({ steps: STEPS, currentStep: 3, onStep })

    const buttons: { stepNumber: number; onClick?: () => void; disabled: boolean }[] = []
    const visit = (node: React.ReactNode): void => {
      if (!node || typeof node !== 'object') return
      if (Array.isArray(node)) {
        node.forEach(visit)
        return
      }
      const el = node as React.ReactElement<{
        children?: React.ReactNode
        ['aria-label']?: string
        onClick?: () => void
        disabled?: boolean
      }>
      const props = el.props ?? {}
      const aria = props['aria-label']
      if (typeof el.type === 'string' && el.type === 'button' && typeof aria === 'string') {
        const match = aria.match(/^Step (\d+):/)
        if (match) {
          buttons.push({
            stepNumber: Number(match[1]),
            onClick: props.onClick,
            disabled: !!props.disabled,
          })
        }
      }
      visit(props.children)
    }
    visit(rendered)

    const todoStep = buttons.find((b) => b.stepNumber === 5)!
    expect(todoStep.disabled).toBe(true)
    expect(todoStep.onClick).toBeUndefined()
    expect(onStep).not.toHaveBeenCalled()
  })
})
