import Navigation from "@/components/Navigation";
import IntroAnimation from "@/components/IntroAnimation";
import Footer from "@/components/Footer";
import SmoothScroll from "@/components/SmoothScroll";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SmoothScroll>
      <IntroAnimation />
      <Navigation />
      <main className="flex-1">{children}</main>
      <Footer />
    </SmoothScroll>
  );
}


