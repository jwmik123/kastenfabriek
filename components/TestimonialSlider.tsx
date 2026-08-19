"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Draggable, InertiaPlugin } from "gsap/all";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import { SanityImageSource } from "@sanity/image-url/lib/types/types";

gsap.registerPlugin(Draggable, InertiaPlugin, useGSAP);

export interface Testimonial {
  _id: string;
  quote: string;
  name: string;
  company: string;
  image?: SanityImageSource;
}

interface Props {
  testimonials: Testimonial[];
  /** Minimum scale applied to cards as they move behind the active card */
  minScale?: number;
  /** Rotation (deg) applied to cards while moving behind the active card */
  maxRotation?: number;
}

export default function TestimonialSlider({
  testimonials,
  minScale = 0.45,
  maxRotation = -8,
}: Props) {
  const initRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const init = initRef.current;
      const wrap = wrapRef.current;
      const slider = listRef.current;
      if (!init || !wrap || !slider) return;

      const slides = Array.from(
        init.querySelectorAll<HTMLElement>("[data-overlap-slider-item]")
      );
      if (!slides.length) return;

      wrap.style.touchAction = "none";
      wrap.style.userSelect = "none";

      let spacing = 0;
      let maxDrag = 0;
      let dragX = 0;

      function clamp(value: number) {
        if (maxDrag <= 0) return 0;
        return Math.min(Math.max(value, 0), maxDrag);
      }

      function update() {
        gsap.set(slider, { x: -dragX });

        slides.forEach((slide, i) => {
          const threshold = i * spacing;
          const local = Math.max(0, dragX - threshold);
          const t = spacing > 0 ? Math.min(local / spacing, 1) : 0;

          gsap.set(slide, {
            x: local,
            scale: 1 - (1 - minScale) * t,
            rotation: maxRotation * t,
            transformOrigin: "75% center",
          });
        });
      }

      function recalc() {
        const style = getComputedStyle(slides[0]);
        const gapRight = parseFloat(style.marginRight) || 0;

        spacing = slides[0].offsetWidth + gapRight;
        maxDrag = spacing * (slides.length - 1);

        dragX = clamp(dragX);
        update();

        draggable?.applyBounds({ minX: -maxDrag, maxX: 0 });
      }

      const draggable = Draggable.create(slider, {
        type: "x",
        bounds: { minX: -maxDrag, maxX: 0 },
        inertia: true,
        // Without this, Draggable pins z-index 1000 on the list and the cards
        // start covering the fixed navigation.
        zIndexBoost: false,
        maxDuration: 1,
        snap: (raw: number) => {
          const d = clamp(-raw);
          const idx = spacing > 0 ? Math.round(d / spacing) : 0;
          return -idx * spacing;
        },
        onDrag: () => {
          dragX = clamp(-draggable.x);
          update();
        },
        onThrowUpdate: () => {
          dragX = clamp(-draggable.x);
          update();
        },
      })[0];

      const ro = new ResizeObserver(() => recalc());
      ro.observe(init);

      // Keyboard navigation, only while the slider is in view
      let active = false;
      let currentIndex = 0;

      function goToSlide(idx: number) {
        idx = Math.max(0, Math.min(idx, slides.length - 1));
        currentIndex = idx;

        const proxy = { value: dragX };
        gsap.to(proxy, {
          value: idx * spacing,
          duration: 0.35,
          ease: "power4.out",
          onUpdate: () => {
            dragX = proxy.value;
            update();
          },
        });

        wrap!.setAttribute(
          "aria-label",
          `Testimonial ${idx + 1} van ${slides.length}`
        );
      }

      const io = new IntersectionObserver(
        (entries) => {
          active = entries[0].isIntersecting;
        },
        { threshold: 0.25 }
      );
      io.observe(init);

      wrap.setAttribute("role", "region");
      wrap.setAttribute("aria-roledescription", "carousel");
      wrap.setAttribute("aria-label", "Testimonial slider");

      function onKey(e: KeyboardEvent) {
        if (!active) return;
        const t = e.target as HTMLElement | null;
        if (
          t?.tagName === "INPUT" ||
          t?.tagName === "TEXTAREA" ||
          t?.isContentEditable
        )
          return;

        if (e.key === "ArrowLeft") {
          e.preventDefault();
          goToSlide(currentIndex - 1);
        }
        if (e.key === "ArrowRight") {
          e.preventDefault();
          goToSlide(currentIndex + 1);
        }
      }
      window.addEventListener("keydown", onKey);

      recalc();

      return () => {
        window.removeEventListener("keydown", onKey);
        ro.disconnect();
        io.disconnect();
        draggable?.kill();
      };
    },
    { scope: initRef, dependencies: [testimonials] }
  );

  if (!testimonials.length) return null;

  return (
    <div ref={initRef} data-overlap-slider-init className="w-full">
      <div
        ref={wrapRef}
        data-overlap-slider-collection
        className="relative flex w-full items-start justify-start"
      >
        <div
          ref={listRef}
          data-overlap-slider-list
          className="relative flex flex-none flex-row items-center cursor-grab active:cursor-grabbing"
        >
          {testimonials.map((t) => (
            <div
              key={t._id}
              data-overlap-slider-item
              className="flex-none mr-6"
            >
              {/* Card */}
              <div
                className="flex aspect-[3/4] w-[24em] max-w-[85vw] flex-col justify-between gap-8 rounded-2xl border-[3px] border-primary bg-white px-8 pt-12 pb-8 text-primary"
                style={{ fontSize: "clamp(0.65rem, 1.6vw, 1rem)" }}
              >
                <h3 className="m-0 text-[1.5em] font-semibold leading-[1.3]">
                  &ldquo;{t.quote}&rdquo;
                </h3>

                <div className="flex flex-row items-center gap-3">
                  <div className="size-[3em] flex-none overflow-hidden rounded-full bg-primary-200">
                    {t.image ? (
                      <Image
                        src={urlFor(t.image).width(160).height(160).url()}
                        alt={t.name}
                        width={80}
                        height={80}
                        draggable={false}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-amber-500 text-[1.25em] font-semibold text-white">
                        {t.name.charAt(0)}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col">
                    <span className="text-[1.25em] font-semibold leading-none">
                      {t.name}
                    </span>
                    <span className="text-[1.25em] leading-none opacity-50">
                      {t.company}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
