import Image from "next/image";
import ProductOptionsSection from "@/components/ProductOptionsSection";
import SloganSection from "@/components/SloganSection";
import ModuleHighlight from "@/components/ModuleHighlight";

export default function Home() {
  return (
    <>
    <div className="relative w-full h-screen -mt-6 font-poppins" data-nav-theme="dark">
      {/* <Image src="/homeplaceholder.png" alt="Home" fill className="object-cover" /> */}
      <video autoPlay muted loop className="absolute inset-0 w-full h-full object-cover">
      <source className="" src="https://www.maatkastenonline.be/themes/maatkastenonline/assets/images/maatkastenonline-home-mobile.webm" type="video/webm"></source>
      </video>
      <div className="absolute inset-0 bg-black/10 z-10" />

      <div className="relative z-10 flex flex-col justify-end pb-24 h-full text-white px-4 max-w-7xl mx-auto">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-left">
          Kasten-fabriek.nl
        </h1>
        <p className="text-xl md:text-2xl mb-8 max-w-2xl text-left">
        Op maat gemaakte kledingkasten.
        Volledig afgestemd op jouw wensen.
        </p>
        <div>
          <button className="bg-primary text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-primary/90 transition-colors">
            Ontwerp je maatkast
          </button>
        </div>
      </div>
    </div>

    <ProductOptionsSection
      title="Waar ben je naar op zoek?"
      subtitle="Kies het type kast dat perfect bij jouw ruimte en behoeften past"
      mainOptions={[
        {
          id: 'kledingkast',
          title: 'Kledingkast',
          description: 'Volledig op maat gemaakt, perfect passend in jouw ruimte',
          icon: (
            <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
            </svg>
          ),
        },
        {
          id: 'wasmachinekast',
          title: 'Wasmachinekast',
          description: 'Functionele kast voor je wasmachine en droger',
          icon: (
            <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
          ),
        },
        {
          id: 'ikea-pax',
          title: 'IKEA PAX Deuren',
          description: 'Op maat gemaakte deuren voor je bestaande IKEA kast',
          icon: (
            <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          ),
        },
      ]}
      additionalOptions={[
        {
          id: 'kleding-roede',
          title: 'Kleding Roede',
          description: 'Hoogwaardige kledingstangen voor in je kast',
          icon: (
            <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8h16M4 16h16" />
            </svg>
          ),
        },
        {
          id: 'lade-organizers',
          title: 'Lade Organizers',
          description: 'Op maat gemaakte organisatie voor je laden',
          icon: (
            <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM14 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z" />
            </svg>
          ),
        },
        {
          id: 'tv-meubel',
          title: 'TV Meubel',
          description: 'Stijlvol maatwerk TV-meubel voor je woonkamer',
          comingSoon: true,
          icon: (
            <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          ),
        },
        {
          id: 'badkamermeubel',
          title: 'Badkamermeubel',
          description: 'Op maat gemaakte badkamermeubels voor elke ruimte',
          comingSoon: true,
          icon: (
            <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          ),
        },
      ]}
    />


    <SloganSection
      text="Elke millimeter is op maat gemaakt — van de
    symmetrie in de houtstructuur tot de verfijnde
    afwerking rondom."
      backgroundImage="/ladingplaceholder.jpg"
      align="left"
      buttonText="Ontwerp jouw maatkast"
    />

    <ModuleHighlight />
    </>
  );
}
