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

const IMAGE_H = "h-32";

export default function WerkwijzeSection() {
  return (
    <section className="w-full bg-primary py-20 md:py-32 font-poppins overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="mb-24">
          <p className="text-white/50 text-sm uppercase tracking-widest font-semibold mb-3">
            Onze werkwijze
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Van ontwerp tot montage<span className="italic text-primary-300"> in een stroom.</span>
          </h2>
        </div>

        {/* Desktop */}
        <div className="hidden md:grid grid-cols-[1fr_20px_1fr_20px_1fr_20px_1fr_20px_1fr] items-stretch">
          {steps.flatMap((step, index) => {
            const card = (
              <div
                key={step.number}
                className="relative flex flex-col overflow-hidden rounded-xl border border-white/10 bg-white/5 p-5 pb-6"
              >
                <span className="mb-3 text-xs font-bold tracking-widest text-primary-300/80 select-none">
                  {step.number}
                </span>
                <div className={`relative ${IMAGE_H} mb-4`}>
                  <Image
                    src={step.image}
                    alt={step.title}
                    fill
                    className="object-contain"
                    sizes="20vw"
                  />
                </div>
                <h3 className="text-white font-semibold text-sm leading-snug text-center">
                  {step.title}
                </h3>
              </div>
            );

            if (index < steps.length - 1) {
              return [card, (
                <div key={`arrow-${index}`} className="flex h-full items-center justify-center">
                  <ArrowRight size={14} className="text-white/20" strokeWidth={1.5} />
                </div>
              )];
            }
            return [card];
          })}
        </div>

        {/* Mobile: 2-col grid */}
        <div className="grid grid-cols-2 gap-6 md:hidden">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className={`relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4 pb-5 ${
                index === steps.length - 1 && steps.length % 2 !== 0 ? "col-span-2" : ""
              }`}
            >
              <span className="mb-2 block text-xs font-bold tracking-widest text-primary-300/80 select-none">
                {step.number}
              </span>
              <div className={`relative mb-3 ${index === steps.length - 1 && steps.length % 2 !== 0 ? "h-56" : "h-36"}`}>
                <Image
                  src={step.image}
                  alt={step.title}
                  fill
                  className="object-contain"
                  sizes="45vw"
                />
              </div>
              <h3 className="text-white font-semibold text-sm leading-snug text-center">
                {step.title}
              </h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
