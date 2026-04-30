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
      {children}
      <Footer />
    </SmoothScroll>
  );
}


