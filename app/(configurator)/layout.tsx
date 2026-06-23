import Footer from "@/components/Footer"

export default function ConfiguratorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  )
}
