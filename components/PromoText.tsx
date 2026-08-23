import { PortableText, type PortableTextComponents } from '@portabletext/react'
import type { PortableTextBlock } from '@portabletext/types'

/**
 * Renders the `promoText` Sanity type inline — the banners are a single line
 * inside a flex row, so blocks render without a wrapping paragraph.
 *
 * `accentClassName` is the colour of the "Accentkleur" decorator, which
 * differs per banner (the top bar and the homepage strip sit on different
 * backgrounds).
 */
export default function PromoText({
  value,
  accentClassName = 'text-primary',
}: {
  value: PortableTextBlock[]
  accentClassName?: string
}) {
  const components: PortableTextComponents = {
    block: {
      normal: ({ children }) => <>{children}</>,
    },
    marks: {
      strong: ({ children }) => <strong className="font-bold">{children}</strong>,
      accent: ({ children }) => <strong className={accentClassName}>{children}</strong>,
    },
  }

  return <PortableText value={value} components={components} />
}
