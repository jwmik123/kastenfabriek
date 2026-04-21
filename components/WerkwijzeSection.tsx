import Image from "next/image";

const steps = [
  {
    number: 1,
    image: "/stickfigures/Website poppetje (afbeelding 1).webp",
    title: "Ontwerp je kast",
  },
  {
    number: 2,
    image: "/stickfigures/Website poppetje (afbeelding 2).webp",
    title: "Productie op maat",
  },
  {
    number: 3,
    image: "/stickfigures/Website poppetje (afbeelding 3).webp",
    title: "levering",
  },
  {
    number: 4,
    image: "/stickfigures/Website poppetje (afbeelding 4).webp",
    title: "Gemakkelijke montage",
  },
  {
    number: 5,
    image: "/stickfigures/Website poppetje (afbeelding 5).webp",
    title: "Klaar om te genieten",
  },
];

export default function WerkwijzeSection() {
  return (
    <section className="w-full bg-primary py-20 md:py-32 font-poppins">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="mb-16">
          <p className="text-white/60 text-sm uppercase tracking-widest font-semibold mb-3">
            Onze werkwijze
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Van ontwerp to montage<span className="italic"> in een stroom.</span>
          </h2>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-2 md:gap-0">
          {steps.map((step, index) => (
            <div key={step.number} className="flex md:flex-col items-center flex-1 w-full gap-6 md:gap-0">
              {/* Step */}
              <div className="flex md:flex-col items-center gap-4 md:gap-6 flex-1 w-full">
                <div className="relative w-32 h-32 md:w-full md:h-44 shrink-0">
                  <Image
                    src={step.image}
                    alt={step.title}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 128px, 20vw"
                  />
                </div>

                <div className="md:text-center md:mt-4 md:px-2">
                  <span className="text-white/50 text-sm font-semibold block mb-1">
                    Stap {step.number}
                  </span>
                  <h3 className="text-white font-semibold text-base md:text-lg leading-snug">
                    {step.title}
                  </h3>
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
