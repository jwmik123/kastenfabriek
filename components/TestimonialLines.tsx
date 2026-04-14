"use client";

import { useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import { SanityImageSource } from "@sanity/image-url/lib/types/types";

gsap.registerPlugin(SplitText, ScrollTrigger, useGSAP);

export interface Testimonial {
  _id: string;
  quote: string;
  name: string;
  company: string;
  image?: SanityImageSource;
}

interface Props {
  testimonials: Testimonial[];
  autoplay?: boolean;
  autoplayDuration?: number;
}

export default function TestimonialLines({
  testimonials,
  autoplay = true,
  autoplayDuration = 5000,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [currentCount, setCurrentCount] = useState(1);

  // Element refs — populated via callback refs in JSX
  const itemRefs = useRef<HTMLDivElement[]>([]);
  const textRefs = useRef<HTMLHeadingElement[]>([]);
  const imgRefs = useRef<HTMLDivElement[]>([]);
  const detailRefs = useRef<HTMLParagraphElement[][]>([]);

  // Exposed handles so button callbacks can call GSAP functions
  const activeIndexRef = useRef(0);
  const goToRef = useRef<(next: number) => void>(() => {});
  const resetAutoplayRef = useRef<() => void>(() => {});

  useGSAP(
    () => {
      if (testimonials.length === 0) return;

      const CLIP_HIDDEN = "circle(0% at 50% 50%)";
      const CLIP_VISIBLE = "circle(50% at 50% 50%)";

      let reduceMotion = false;
      let isAnimating = false;
      let isInView = false;
      let autoplayCall: gsap.core.Tween | null = null;

      const slides = testimonials.map((_, i) => ({
        item: itemRefs.current[i],
        image: imgRefs.current[i] ?? null,
        splitTargets: [
          textRefs.current[i],
          ...(detailRefs.current[i] ?? []),
        ].filter((el): el is HTMLElement => el != null),
        splitInstances: [] as InstanceType<typeof SplitText>[],
        getLines(): HTMLElement[] {
          return this.splitInstances.flatMap(
            (inst) => inst.lines as HTMLElement[]
          );
        },
      }));

      function setSlideState(index: number, isActive: boolean) {
        const { item } = slides[index];
        if (!item) return;
        item.setAttribute("aria-hidden", String(!isActive));
        gsap.set(item, {
          autoAlpha: isActive ? 1 : 0,
          pointerEvents: isActive ? "auto" : "none",
        });
      }

      // Set initial visibility
      slides.forEach((_, i) => setSlideState(i, i === 0));

      // Reduced motion detection
      gsap.matchMedia().add(
        { reduce: "(prefers-reduced-motion: reduce)" },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (ctx: any) => {
          reduceMotion = ctx.conditions.reduce;
        }
      );

      // Create SplitText instances and set initial line positions
      slides.forEach((slide, slideIndex) => {
        slide.splitInstances = slide.splitTargets.map(
          (el) =>
            new SplitText(el, {
              type: "lines",
              mask: "lines",
              linesClass: "text-line",
            })
        );

        if (!reduceMotion) {
          const isActive = slideIndex === activeIndexRef.current;
          gsap.set(slide.getLines(), { yPercent: isActive ? 0 : 125 });
          if (slide.image) {
            gsap.set(slide.image, {
              clipPath: isActive ? CLIP_VISIBLE : CLIP_HIDDEN,
            });
          }
        }
      });

      function startAutoplay() {
        if (!autoplay) return;
        if (autoplayCall) autoplayCall.kill();
        autoplayCall = gsap.delayedCall(autoplayDuration / 1000, () => {
          if (!isInView || isAnimating) {
            startAutoplay();
            return;
          }
          goTo((activeIndexRef.current + 1) % slides.length);
          startAutoplay();
        });
      }

      function pauseAutoplay() {
        if (autoplayCall) autoplayCall.pause();
      }

      function resumeAutoplay() {
        if (!autoplay) return;
        if (!autoplayCall) startAutoplay();
        else autoplayCall.resume();
      }

      function resetAutoplay() {
        if (!autoplay) return;
        startAutoplay();
      }

      resetAutoplayRef.current = resetAutoplay;

      function goTo(nextIndex: number) {
        if (isAnimating || nextIndex === activeIndexRef.current) return;
        isAnimating = true;

        const prevIndex = activeIndexRef.current;
        const outgoing = slides[prevIndex];
        const incoming = slides[nextIndex];

        const tl = gsap.timeline({
          onComplete: () => {
            setSlideState(prevIndex, false);
            setSlideState(nextIndex, true);
            activeIndexRef.current = nextIndex;
            setCurrentCount(nextIndex + 1);
            isAnimating = false;
          },
        });

        if (reduceMotion) {
          tl.to(outgoing.item, { autoAlpha: 0, duration: 0.4, ease: "power2" }, 0).fromTo(
            incoming.item,
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: 0.4, ease: "power2" },
            0
          );
          return;
        }

        const outLines = outgoing.getLines();
        const inLines = incoming.getLines();

        gsap.set(incoming.item, { autoAlpha: 1, pointerEvents: "auto" });
        gsap.set(inLines, { yPercent: 125 });
        if (outgoing.image) gsap.set(outgoing.image, { clipPath: CLIP_VISIBLE });

        tl.to(
          outLines,
          { yPercent: -125, duration: 0.6, ease: "power4.inOut", stagger: { amount: 0.25 } },
          0
        );

        if (outgoing.image) {
          tl.to(outgoing.image, { clipPath: CLIP_HIDDEN, duration: 0.6, ease: "power4.inOut" }, 0);
        }

        tl.to(
          inLines,
          { yPercent: 0, duration: 0.7, ease: "power4.inOut", stagger: { amount: 0.4 } },
          ">-=0.3"
        );

        if (incoming.image) {
          tl.fromTo(
            incoming.image,
            { clipPath: CLIP_HIDDEN },
            { clipPath: CLIP_VISIBLE, duration: 0.75, ease: "power4.inOut" },
            "<"
          );
        }

        tl.set(outgoing.item, { autoAlpha: 0 }, ">");
      }

      goToRef.current = goTo;

      startAutoplay();

      // Keyboard navigation
      const handleKeyDown = (e: KeyboardEvent) => {
        if (!isInView) return;
        const t = e.target as HTMLElement;
        if (t?.tagName === "INPUT" || t?.tagName === "TEXTAREA" || t?.isContentEditable) return;
        if (e.key === "ArrowRight") {
          e.preventDefault();
          resetAutoplay();
          goTo((activeIndexRef.current + 1) % slides.length);
        }
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          resetAutoplay();
          goTo((activeIndexRef.current - 1 + slides.length) % slides.length);
        }
      };

      window.addEventListener("keydown", handleKeyDown);

      ScrollTrigger.create({
        trigger: wrapRef.current,
        start: "top bottom",
        end: "bottom top",
        onEnter: () => {
          isInView = true;
          resumeAutoplay();
        },
        onEnterBack: () => {
          isInView = true;
          resumeAutoplay();
        },
        onLeave: () => {
          isInView = false;
          pauseAutoplay();
        },
        onLeaveBack: () => {
          isInView = false;
          pauseAutoplay();
        },
      });

      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        if (autoplayCall) autoplayCall.kill();
      };
    },
    { scope: wrapRef, dependencies: [testimonials] }
  );

  const handlePrev = useCallback(() => {
    resetAutoplayRef.current();
    goToRef.current((activeIndexRef.current - 1 + testimonials.length) % testimonials.length);
  }, [testimonials.length]);

  const handleNext = useCallback(() => {
    resetAutoplayRef.current();
    goToRef.current((activeIndexRef.current + 1) % testimonials.length);
  }, [testimonials.length]);

  if (testimonials.length === 0) return null;

  return (
    <div
      ref={wrapRef}
      className="flex flex-wrap gap-5"
    >
      {/* Controls — stacks below on mobile */}
      <div className="flex flex-row gap-4 w-full md:w-1/3 order-last md:order-first items-start pt-1">
        <button
          onClick={handlePrev}
          aria-label="Vorige testimonial"
          className="bg-transparent border border-black/20 rounded flex items-center justify-center cursor-pointer"
          style={{ width: "2.5em", height: "2.5em", padding: 0 }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 12 12"
            style={{ width: "0.75em" }}
          >
            <path
              d="M5.26512 12L6.43721 10.7746L1.48837 5.28169V6.71831L6.45581 1.22535L5.28372 0L-2.21369e-07 6L5.26512 12ZM12 6.97183V5.02817H1.30232V6.97183H12Z"
              fill="currentColor"
            />
          </svg>
        </button>
        <button
          onClick={handleNext}
          aria-label="Volgende testimonial"
          className="bg-transparent border border-black/20 rounded flex items-center justify-center cursor-pointer"
          style={{ width: "2.5em", height: "2.5em", padding: 0 }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 12 12"
            style={{ width: "0.75em" }}
          >
            <path
              d="M6.73488 12L5.56279 10.7746L10.5116 5.28169V6.71831L5.54419 1.22535L6.71628 0L12 6L6.73488 12ZM0 6.97183V5.02817H10.6977V6.97183H0Z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 gap-12 md:gap-20">
        {/* Counter + label */}
        <div className="flex flex-row gap-6 items-center">
          <p className="text-xl leading-tight opacity-50 m-0">
            <span style={{ width: "1ch", display: "inline-block" }}>{currentCount}</span>
            {" / "}
            <span>{testimonials.length}</span>
          </p>
          <p className="text-xl leading-tight m-0">Wat onze klanten zeggen:</p>
        </div>

        {/* Slides */}
        <div className="w-full">
          <div role="list" className="w-full grid relative">
            {testimonials.map((t, i) => (
              <div
                key={t._id}
                role="listitem"
                aria-hidden={i !== 0}
                ref={(el) => {
                  if (el) itemRefs.current[i] = el;
                }}
                className="flex flex-col gap-8 md:gap-16 w-full [grid-area:1/1]"
                style={{
                  opacity: i === 0 ? 1 : 0,
                  visibility: i === 0 ? "visible" : "hidden",
                  pointerEvents: i === 0 ? "auto" : "none",
                }}
              >
                <h3
                  ref={(el) => {
                    if (el) textRefs.current[i] = el;
                  }}
                  className="w-full m-0 font-medium"
                  style={{
                    fontSize: "clamp(1.75rem, 4vw, 3rem)",
                    letterSpacing: "-0.02em",
                    lineHeight: 1.1,
                  }}
                >
                  &ldquo;{t.quote}&rdquo;
                </h3>

                <div className="flex flex-row gap-5 items-center">
                  {/* Avatar */}
                  <div
                    ref={(el) => {
                      if (el) imgRefs.current[i] = el;
                    }}
                    className="shrink-0 rounded-full overflow-hidden"
                    style={{ width: "5em", aspectRatio: "1" }}
                  >
                    {t.image ? (
                      <Image
                        src={urlFor(t.image).width(160).height(160).url()}
                        alt={t.name}
                        width={80}
                        height={80}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full bg-primary-200 flex items-center justify-center text-primary-600 font-semibold text-xl">
                        {t.name.charAt(0)}
                      </div>
                    )}
                  </div>

                  <div>
                    <p
                      ref={(el) => {
                        if (el) {
                          if (!detailRefs.current[i]) detailRefs.current[i] = [];
                          detailRefs.current[i][0] = el;
                        }
                      }}
                      className="text-xl leading-tight m-0"
                    >
                      {t.name}
                    </p>
                    <p
                      ref={(el) => {
                        if (el) {
                          if (!detailRefs.current[i]) detailRefs.current[i] = [];
                          detailRefs.current[i][1] = el;
                        }
                      }}
                      className="text-xl leading-tight m-0 opacity-50"
                    >
                      {t.company}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
