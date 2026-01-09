import Image from "next/image";

export default function Home() {
  return (
    <>
    <div className="relative w-full h-screen -mt-6 font-poppins" data-nav-theme="dark">
      <Image src="/homeplaceholder.png" alt="Home" fill className="object-cover" />
      {/* <video src="/inspo.mov" autoPlay muted loop className="absolute inset-0 object-cover" /> */}
      {/* <div className="absolute inset-0 bg-black/30 z-10" /> */}

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

    {/* Closet Options Section */}
    <section className="py-24 px-4 bg-white" data-nav-theme="light">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 text-gray-900">
          Waar ben je naar op zoek?
        </h2>
        <p className="text-center text-gray-600 text-lg mb-16 max-w-2xl mx-auto">
          Kies het type kast dat perfect bij jouw ruimte en behoeften past
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Option 1 - Maatkast */}
          <div className="group cursor-pointer">
            <div className="aspect-square bg-neutral-50 overflow-hidden mb-4 relative">
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-primary transition-colors">
              Maatkast
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Volledig op maat gemaakt, perfect passend in jouw ruimte
            </p>
          </div>

          {/* Option 2 - Schuifdeurkast */}
          <div className="group cursor-pointer">
            <div className="aspect-square bg-neutral-50 overflow-hidden mb-4 relative">
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-primary transition-colors">
              Schuifdeurkast
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Ruimtebesparend met stijlvolle schuifdeuren
            </p>
          </div>

          {/* Option 3 - Inloopkast */}
          <div className="group cursor-pointer">
            <div className="aspect-square bg-neutral-50 overflow-hidden mb-4 relative">
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-primary transition-colors">
              Inloopkast
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Luxe walk-in oplossing voor maximale opbergruimte
            </p>
          </div>

          {/* Option 4 - IKEA PAX Deuren */}
          <div className="group cursor-pointer">
            <div className="aspect-square bg-neutral-50 overflow-hidden mb-4 relative">
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-primary transition-colors">
              IKEA PAX Deuren
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Op maat gemaakte deuren voor je bestaande IKEA kast
            </p>
          </div>
        </div>
      </div>
    </section>

    </>
  );
}
