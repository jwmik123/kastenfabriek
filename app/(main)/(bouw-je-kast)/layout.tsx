import Navigation from '@/components/Navigation'

export default function BouwJeKastLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Navigation />
      {children}
    </>
  )
}
