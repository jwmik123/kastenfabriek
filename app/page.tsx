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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {/* Option 1 - Kledingkast */}
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
              Kledingkast
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Volledig op maat gemaakt, perfect passend in jouw ruimte
            </p>
          </div>

          {/* Option 2 - Wasmachinekast */}
          <div className="group cursor-pointer">
            <div className="aspect-square bg-neutral-50 overflow-hidden mb-4 relative">
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-primary transition-colors">
              Wasmachinekast
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Functionele kast voor je wasmachine en droger
            </p>
          </div>

          {/* Option 3 - IKEA PAX Deuren */}
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

        {/* Coming Soon Section */}
        <div className="mt-16">
          <h3 className="text-2xl font-semibold text-center mb-8 text-gray-800">
            Binnenkort beschikbaar
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Coming Soon 1 - TV Meubel */}
            <div className="group cursor-not-allowed opacity-60">
              <div className="aspect-square bg-neutral-50 overflow-hidden mb-4 relative">
                <div className="absolute inset-0 bg-gray-400/10" />
                <div className="absolute top-4 right-4 bg-gray-700 text-white px-3 py-1 rounded-full text-xs font-semibold">
                  Binnenkort
                </div>
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 mx-auto bg-gray-200 rounded-full flex items-center justify-center">
                      <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                TV Meubel
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Stijlvol maatwerk TV-meubel voor je woonkamer
              </p>
            </div>

            {/* Coming Soon 2 - Badkamermeubel */}
            <div className="group cursor-not-allowed opacity-60">
              <div className="aspect-square bg-neutral-50 overflow-hidden mb-4 relative">
                <div className="absolute inset-0 bg-gray-400/10" />
                <div className="absolute top-4 right-4 bg-gray-700 text-white px-3 py-1 rounded-full text-xs font-semibold">
                  Binnenkort
                </div>
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 mx-auto bg-gray-200 rounded-full flex items-center justify-center">
                      <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Badkamermeubel
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Op maat gemaakte badkamermeubels voor elke ruimte
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    </>
  );
}
