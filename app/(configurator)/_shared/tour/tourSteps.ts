import type { StepType } from '@reactour/tour'
import { createElement } from 'react'

type TourCopy = { title: string; body: string }

function stepContent({ title, body }: TourCopy) {
  return createElement(
    'div',
    { className: 'flex flex-col gap-2' },
    createElement('h3', { className: 'text-base font-semibold' }, title),
    createElement('p', { className: 'text-sm text-muted-foreground' }, body),
  )
}

export const kledingkastTourSteps: StepType[] = [
  {
    selector: '[data-tour="canvas-toolbar"]',
    content: stepContent({
      title: 'Bedieningsbalk',
      body: 'Hier vind je knoppen voor zoomen, afmetingen, deuren en willekeurige indeling.',
    }),
    position: 'right',
  },
]
