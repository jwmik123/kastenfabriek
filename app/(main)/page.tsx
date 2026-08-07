import Image from "next/image";
import Link from "next/link";
import { Hammer } from "lucide-react";
import ProductOptionsSection from "@/components/ProductOptionsSection";
import { CONFIGURATORS_HREF } from "@/lib/configurators";
import HeroBackgroundVideo from "@/components/HeroBackgroundVideo";
// import SloganSection from "@/components/SloganSection";
// import ModuleHighlight from "@/components/ModuleHighlight";
import TestimonialSection from "@/components/TestimonialSection";
import WerkwijzeSection from "@/components/WerkwijzeSection";
import MaterialsSection from "@/components/MaterialsSection";
import ModulesScrollSection from "@/components/ModulesScrollSection";

export default function Home() {
  return (
    <>
      {/* Promo Strip */}
      
    <div className="relative w-full h-[85svh] md:h-[90vh] -mt-6 font-poppins" data-nav-theme="dark">
      {/* <Image src="/homeplaceholder.png" alt="Home" fill className="object-cover" /> */}

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <HeroBackgroundVideo
          playbackId={process.env.NEXT_PUBLIC_MUX_HERO_PLAYBACK_ID!}
            poster="https://image.mux.com/XDs012DOlQKPSETiCMAe4Mf00V1LzktQF8Cj3ClBcDjBs/thumbnail.webp?width=1920&time=0"
        />
      </div>
      <div className="absolute inset-0 bg-black/10 z-10" />

      <div className="relative z-10 flex flex-col justify-end pb-16 md:pb-24 h-full text-white px-4 sm:px-6 max-w-7xl mx-auto">
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 md:mb-6 text-left">
          Kasten die <span className="italic">precies</span> passen.
        </h1>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 md:gap-8">
          <p className="text-base sm:text-lg md:text-xl max-w-2xl text-left">
            Ontwerp zelf. Op maat gemaakte kledingkasten. Volledig afgestemd op jouw wensen.
          </p>
          <Link
            href={CONFIGURATORS_HREF}
            className="hero-btn w-full md:w-auto flex-shrink-0 flex items-center justify-center md:justify-start gap-3 bg-primary text-white px-6 md:px-8 py-3.5 md:py-4 rounded-sm text-base md:text-lg font-semibold relative overflow-hidden cursor-pointer"
          >
            <div className="relative z-10 overflow-hidden pb-[0.2em] -mb-[0.2em]">
              <span className="btn-anim hero-btn__text block leading-none">
                Start configurator
              </span>
            </div>
            <div className="relative z-10 flex items-center justify-center w-[1.1em] h-[1.1em] text-[1.1em]">
              <div className="btn-anim hero-btn__icon-bg absolute inset-0 bg-white/20 rounded-[0.125em]" />
              <div className="relative overflow-hidden w-full h-full flex items-center justify-end">
                <div className="flex items-center h-full">
                  {[0, 1, 2].map((i) => (
                    <svg key={i} className="btn-anim hero-btn__arrow flex-none w-[1em] h-full p-[0.2em]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 8" fill="none">
                      <path d="M4.45231 0.385986H6.02531L9.30131 3.99999L6.02531 7.61399H4.45231L7.40331 4.58499H0.695312V3.42799H7.41631L4.45231 0.385986Z" fill="currentColor" />
                    </svg>
                  ))}
                </div>
              </div>
            </div>
            <div className="btn-anim hero-btn__sweep absolute left-[-10%] bottom-0 w-[120%] h-full bg-black/30 z-0" />
          </Link>
        </div>
      </div>
    </div>

    {/* Promo Strip */}
    <div className="w-full bg-amber-500 text-white py-6 px-6 flex items-center justify-center gap-3 text-xl font-semibold">
      <Hammer size={22} className="flex-shrink-0" />
      <span>Alle kasten nu met <b>gratis montage</b> bij oplevering! Tot wel <b className="text-primary">€2160,-</b> korting!</span>
    </div>

    <ProductOptionsSection
      title="Waar ben je naar op zoek?"
      subtitle="Kies het type kast dat perfect bij jouw ruimte en behoeften past"
      mainOptions={[
        {
          id: 'kledingkast',
          title: 'Kledingkast',
          description: 'Volledig op maat gemaakt, perfect passend in jouw ruimte',
          image: '/images/kledingkast.png',
          href: '/kledingkast',
        },
        {
          id: 'wasmachinekast',
          title: 'Wasmachinekast',
          description: 'Functionele kast voor je wasmachine en droger',
          image: '/images/wasmachinekast.png',
          href: '/wasmachinekast',
        },
        {
          id: 'ikea-pax',
          title: 'IKEA PAX Deuren',
          description: 'Op maat gemaakte deuren voor je bestaande IKEA kast',
          image: '/colorways/lincoln-notelaar-1.webp',
          href: '/producten/ikea-pax-deur',
        },
      ]}
      additionalOptions={[
        {
          id: 'alle-producten',
          title: 'Bekijk al onze producten',
          description: 'Ontdek het volledige assortiment maatwerk en accessoires',
          image: '/images/Modules_High4.webp',
          href: '/producten',
          ctaLabel: 'Bekijk producten',
        },
      ]}
    />


      

    <ModulesScrollSection />

    <MaterialsSection />

    <WerkwijzeSection />

    {/* <SloganSection
      text="Elke millimeter is op maat gemaakt — van de
    symmetrie in de houtstructuur tot de verfijnde
    afwerking rondom."
      backgroundImage="/kleding.jpeg"
      align="left"
      buttonText="Ontwerp jouw maatkast"
    />

    <ModuleHighlight /> */}
    <TestimonialSection />
    </>
  );
}
