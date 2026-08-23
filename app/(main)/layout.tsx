import Navigation from "@/components/Navigation";
import IntroAnimation from "@/components/IntroAnimation";
import Footer from "@/components/Footer";
import SmoothScroll from "@/components/SmoothScroll";
import { getSiteSettings } from "@/sanity/lib/siteSettings";

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSiteSettings();

  return (
    <SmoothScroll>
      <IntroAnimation />
      <Navigation promoText={settings.promoBanner?.topBar} />
      <main className="flex-1">{children}</main>
      <Footer />
    </SmoothScroll>
  );
}


