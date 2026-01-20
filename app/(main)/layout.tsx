import Navigation from "@/components/Navigation";
import IntroAnimation from "@/components/IntroAnimation";
import Footer from "@/components/Footer";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <IntroAnimation />
      <Navigation />
      {children}
      <Footer />
    </>
  );
}
