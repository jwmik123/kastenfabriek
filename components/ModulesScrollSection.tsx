"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// 7680 × 1080 image
const IMG_RATIO = 7680 / 1080;

const OVERLAYS = [
  {
    id: "storage",
    scrollStart: 18,
    scrollPeakStart: 21,
    scrollPeakEnd: 42,
    scrollEnd: 48,
    title: "Planken & opbergruimte",
    body: "Maximale opbergruimte, minimale footprint.",
  },
  {
    id: "hanging",
    scrollStart: 50,
    scrollPeakStart: 53,
    scrollPeakEnd: 72,
    scrollEnd: 78,
    title: "Roedes & laden",
    body: "Alles op zijn plek — kleding, accessoires en meer.",
  },
  {
    id: "washer",
    scrollStart: 80,
    scrollPeakStart: 83,
    scrollPeakEnd: 96,
    scrollEnd: 100,
    title: "Wasmachinemodule",
    body: "Zelfs ruimte voor je wasmachine — netjes weggewerkt.",
  },
];

export default function ModulesScrollSection() {
  const outerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const scrollHintRef = useRef<HTMLDivElement>(null);
  const overlayRefs = useRef<(HTMLDivElement | null)[]>([]);
  const mobileScrollRef = useRef<HTMLDivElement>(null);

  // Mobile strip starts 250px into the panorama (left edge is mostly empty)
  useEffect(() => {
    if (mobileScrollRef.current) mobileScrollRef.current.scrollLeft = 250;
  }, []);

  useEffect(() => {
    const outer = outerRef.current;
    const image = imageRef.current;
    if (!outer || !image) return;

    const setup = () => {
      const totalScroll = image.offsetWidth - window.innerWidth;
      outer.style.height = `${window.innerHeight + totalScroll}px`;

      const ctx = gsap.context(() => {
        // Horizontal image pan
        gsap.to(image, {
          x: -totalScroll,
          ease: "none",
          scrollTrigger: {
            trigger: outer,
            start: "top top",
            end: "bottom bottom",
            scrub: 1.2,
          },
        });

        // Scroll hint fades out faster
        gsap.to(scrollHintRef.current, {
          opacity: 0,
          ease: "none",
          scrollTrigger: {
            trigger: outer,
            start: "1% top",
            end: "6% top",
            scrub: true,
          },
        });

        // Overlay fade in → out
        OVERLAYS.forEach((overlay, i) => {
          const el = overlayRefs.current[i];
          if (!el) return;

          gsap.fromTo(
            el,
            { opacity: 0, filter: "blur(12px)" },
            {
              opacity: 1,
              filter: "blur(0px)",
              ease: "none",
              scrollTrigger: {
                trigger: outer,
                start: `${overlay.scrollStart}% top`,
                end: `${overlay.scrollPeakStart}% top`,
                scrub: true,
              },
            }
          );

          gsap.fromTo(
            el,
            { opacity: 1, filter: "blur(0px)" },
            {
              opacity: 0,
              filter: "blur(12px)",
              ease: "none",
              immediateRender: false,
              scrollTrigger: {
                trigger: outer,
                start: `${overlay.scrollPeakEnd}% top`,
                end: `${overlay.scrollEnd}% top`,
                scrub: true,
              },
            }
          );
        });
      }, outer);

      return ctx;
    };

    let ctx = setup();

    const onResize = () => {
      ctx.revert();
      ctx = setup();
    };

    window.addEventListener("resize", onResize);
    return () => {
      ctx.revert();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <>
    {/* Mobile: native horizontal-scroll strip (image keeps its panorama ratio) */}
    <div className="md:hidden relative">
      <div className="px-4 pt-8 pb-4">
        <p className="text-foreground/60 text-sm font-poppins mb-1 tracking-wide">
          Ontdek onze collectie
        </p>
        <h2 className="text-foreground text-3xl font-bold font-poppins leading-tight">
          Bekijk al onze modules
        </h2>
      </div>
      <div
        ref={mobileScrollRef}
        className="w-full overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/Modules_High4.webp"
          alt="Alle modules"
          className="h-[60vh] w-auto max-w-none select-none"
          draggable={false}
        />
      </div>
      {/* Swipe hint */}
      <div className="absolute right-4 bottom-4 flex items-center gap-2 text-foreground/50 pointer-events-none">
        <span className="text-[10px] font-poppins tracking-[0.2em] uppercase">Swipe</span>
        <svg width="28" height="10" viewBox="0 0 36 12" fill="none" aria-hidden>
          <path
            d="M0 6H34M29 1L34 6L29 11"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
    <div ref={outerRef} className="hidden md:block">
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Image strip */}
        <div
          ref={imageRef}
          className="relative h-full will-change-transform"
          style={{ width: `${IMG_RATIO * 100}vh` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/Modules_High4.webp"
            alt="Alle modules"
            className="h-full w-full object-cover select-none"
            draggable={false}
          />
          {/* Gradient for text legibility — travels with the image */}
          {/* <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-primary/10 to-transparent pointer-events-none" /> */}
          {/* Intro text at 5% of image width, scrolls with image */}
          <div
            className="absolute top-0 bottom-0 flex flex-col justify-center pointer-events-none"
            style={{ left: "2%" }}
          >
            <p className="text-white/70 text-lg font-poppins mb-3 tracking-wide">
              Ontdek onze collectie
            </p>
            <h2 className="text-white text-5xl md:text-6xl font-bold font-poppins max-w-xl leading-tight">
              Bekijk al onze modules
            </h2>
          </div>
        </div>

        {/* Scroll hint */}
        <div
          ref={scrollHintRef}
          className="absolute bottom-12 left-16 flex items-center gap-3 text-white/60 pointer-events-none"
        >
          <span className="text-xs font-poppins tracking-[0.2em] uppercase">Scroll</span>
          <svg width="36" height="12" viewBox="0 0 36 12" fill="none" aria-hidden>
            <path
              d="M0 6H34M29 1L34 6L29 11"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Scroll-triggered overlays */}
        {OVERLAYS.map((overlay, i) => (
          <div
            key={overlay.id}
            ref={(el) => {
              overlayRefs.current[i] = el;
            }}
            className="absolute inset-0 flex flex-col justify-center px-16 pointer-events-none opacity-0"
          >
            <h3 className="text-white text-4xl md:text-5xl font-bold font-poppins max-w-xl leading-tight mb-4">
              {overlay.title}
            </h3>
            <p className="text-white/80 text-lg font-poppins max-w-md leading-relaxed">
              {overlay.body}
            </p>
          </div>
        ))}
      </div>
    </div>
    </>
  );
}
