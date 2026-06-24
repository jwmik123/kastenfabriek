export default function ConfiguratorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // No Footer: the configurator fills the viewport and only the step wizard
  // scrolls — a page-level footer would make the whole page scrollable.
  return <main className="flex-1">{children}</main>
}
