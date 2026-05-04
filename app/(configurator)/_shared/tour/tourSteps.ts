import type { StepType } from '@reactour/tour'
import { createElement } from 'react'
import { Hand } from 'lucide-react'

type TourCopy = { title: string; body: string; icon?: 'hand' }

function stepContent({ title, body, icon }: TourCopy) {
  const children = [
    createElement('h3', { key: 'title', className: 'text-base font-semibold' }, title),
    createElement('p', { key: 'body', className: 'text-sm text-muted-foreground' }, body),
  ]
  if (icon === 'hand') {
    children.push(
      createElement(
        'div',
        { key: 'icon', className: 'flex items-center gap-2 pt-1 text-muted-foreground' },
        createElement(Hand, {
          className: 'size-5 animate-bounce',
          'aria-hidden': true,
        }),
        createElement('span', { className: 'text-xs' }, 'Sleep om te draaien'),
      ),
    )
  }
  return createElement('div', { className: 'flex flex-col gap-2' }, ...children)
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
  {
    selector: '[data-tour="canvas-area"]',
    content: stepContent({
      title: 'Bekijk je kast',
      body: 'Sleep om de kast te draaien en bekijk hem van alle kanten.',
      icon: 'hand',
    }),
    position: 'center',
  },
  {
    selector: '[data-tour-active="next"]',
    content: stepContent({
      title: 'Volgende stap',
      body: 'Klik op "Volgende" om door te gaan naar de volgende configuratiestap.',
    }),
    position: 'left',
  },
]
