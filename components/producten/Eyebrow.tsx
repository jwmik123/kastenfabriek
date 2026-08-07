/**
 * Mono-spaced kicker above a section heading.
 *
 * The font is bound through the CSS variable rather than a `font-*` utility:
 * this project's Tailwind setup does not emit font-family utilities from the
 * `@theme inline` font entries, so the class alone would silently do nothing.
 */
export const MONO_FONT = { fontFamily: 'var(--font-plex-mono), monospace' } as const

export default function Eyebrow({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      style={MONO_FONT}
      className={`text-xs uppercase tracking-[0.16em] text-[#6e7569] ${className}`}
    >
      {children}
    </div>
  )
}
