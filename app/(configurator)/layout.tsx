import Footer from "@/components/Footer"

export default function ConfiguratorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      <Footer />
    </>
  )
}
