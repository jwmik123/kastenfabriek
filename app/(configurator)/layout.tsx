import LockViewport from './_shared/components/LockViewport'
import MobileDesktopNotice from './_shared/components/MobileDesktopNotice'

export default function ConfiguratorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // No Footer: the configurator fills the viewport and only the step wizard
  // scrolls — a page-level footer would make the whole page scrollable.
  // LockViewport caps html/body at the visual viewport (100dvh) so the wizard
  // footer stays pinned on mobile and the page itself never scrolls.
  return (
    <main className="flex-1 min-h-0">
      <LockViewport />
      <MobileDesktopNotice />
      {children}
    </main>
  )
}
