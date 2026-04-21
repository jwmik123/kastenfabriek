import Image from "next/image";
import { ArrowRight } from "lucide-react";

const steps = [
  {
    number: "01",
    image: "/stickfigures/Website poppetje (afbeelding 1).webp",
    title: "Ontwerp je kast",
  },
  {
    number: "02",
    image: "/stickfigures/Website poppetje (afbeelding 2).webp",
    title: "Productie op maat",
  },
  {
    number: "03",
    image: "/stickfigures/Website poppetje (afbeelding 3).webp",
    title: "Levering",
  },
  {
    number: "04",
    image: "/stickfigures/Website poppetje (afbeelding 4).webp",
    title: "Gemakkelijke montage",
  },
  {
    number: "05",
    image: "/stickfigures/Website poppetje (afbeelding 5).webp",
    title: "Klaar om te genieten",
  },
];

export default function WerkwijzeSection() {
  return (
    <section className="w-full bg-primary py-20 md:py-32 font-poppins overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="mb-20">
          <p className="text-white/50 text-sm uppercase tracking-widest font-semibold mb-3">
            Onze werkwijze
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Van ontwerp tot montage<span className="italic"> in een stroom.</span>
          </h2>
        </div>

        {/* Desktop */}
        <div className="hidden md:flex items-center justify-between gap-0">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              {/* Step card */}
              <div className="flex flex-col items-center group">
                {/* Ghost number + image stacked */}
                <div className="relative flex items-center justify-center w-40 h-36">
                  <span className="absolute inset-0 flex items-center justify-center text-[7rem] font-black text-white/[0.06] leading-none select-none pointer-events-none">
                    {step.number}
                  </span>
                  <div className="relative w-24 h-24 z-10">
                    <Image
                      src={step.image}
                      alt={step.title}
                      fill
                      className="object-contain"
                      sizes="96px"
                    />
                  </div>
                </div>

                {/* Label */}
                <div className="mt-4 text-center">
                  <p className="text-white/40 text-xs font-semibold tracking-widest uppercase mb-1">
                    Stap {step.number}
                  </p>
                  <h3 className="text-white font-semibold text-sm leading-snug max-w-[120px]">
                    {step.title}
                  </h3>
                </div>
              </div>

              {/* Arrow separator */}
              {index < steps.length - 1 && (
                <ArrowRight
                  size={18}
                  className="text-white/20 mx-2 flex-shrink-0 -mt-10"
                  strokeWidth={1.5}
                />
              )}
            </div>
          ))}
        </div>

        {/* Mobile: vertical */}
        <div className="flex flex-col gap-10 md:hidden">
          {steps.map((step) => (
            <div key={step.number} className="flex items-center gap-6">
              {/* Ghost number + image */}
              <div className="relative flex items-center justify-center w-24 h-20 flex-shrink-0">
                <span className="absolute inset-0 flex items-center justify-center text-6xl font-black text-white/[0.07] leading-none select-none">
                  {step.number}
                </span>
                <div className="relative w-14 h-14 z-10">
                  <Image
                    src={step.image}
                    alt={step.title}
                    fill
                    className="object-contain"
                    sizes="56px"
                  />
                </div>
              </div>

              {/* Label */}
              <div>
                <p className="text-white/40 text-xs font-semibold tracking-widest uppercase mb-1">
                  Stap {step.number}
                </p>
                <h3 className="text-white font-semibold text-base leading-snug">
                  {step.title}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
