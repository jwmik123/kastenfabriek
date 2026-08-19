"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { HotspotContent } from "./hotspot-content";

// Transition timings — keep in sync with the duration classes on the cards.
const TRANSITION_MS = 600;
/** How far the base image is blown up on mobile, so the points spread out. */
const MOBILE_ZOOM = 2.2;

type CardStatus =
  | "active"
  | "not-active"
  | "in-right"
  | "in-left"
  | "out-right"
  | "out-left";

const CARD_TRANSITION: Record<CardStatus, string> = {
  active: "opacity-100 visible translate-x-0",
  "not-active": "opacity-0 invisible translate-x-0",
  "in-right": "opacity-0 visible translate-x-4 transition-none!",
  "in-left": "opacity-0 visible -translate-x-4 transition-none!",
  "out-right": "opacity-0 visible translate-x-4",
  "out-left": "opacity-0 visible -translate-x-4",
};

const PlusIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M19 5L5 19" stroke="currentColor" strokeMiterlimit="10" strokeWidth="2.5" />
    <path d="M5 5L19 19" stroke="currentColor" strokeMiterlimit="10" strokeWidth="2.5" />
  </svg>
);

const ArrowIcon = () => (
  <svg className="w-full" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M14 19L21 12L14 5" stroke="currentColor" strokeMiterlimit="10" strokeWidth="2.5" />
    <path d="M21 12H2" stroke="currentColor" strokeMiterlimit="10" strokeWidth="2.5" />
  </svg>
);

export default function HotspotShowcase({ content }: { content: HotspotContent }) {
  const points = content.points;
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [statuses, setStatuses] = useState<CardStatus[]>(() =>
    points.map((_, i) => (i === 0 ? "active" : "not-active"))
  );
  const activeIndexRef = useRef(0);
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);
  const frames = useRef<number[]>([]);

  // Centre the zoomed mobile crop on the middle of the hotspots, so whatever
  // the editor positions in Sanity stays in frame.
  const mobileShift = useMemo(() => {
    if (!points.length) return 0;
    const centroid = points.reduce((sum, p) => sum + p.x, 0) / points.length;
    return 50 - centroid * MOBILE_ZOOM;
  }, [points]);

  const clearPending = () => {
    timeouts.current.forEach(clearTimeout);
    frames.current.forEach(cancelAnimationFrame);
    timeouts.current = [];
    frames.current = [];
  };

  useEffect(() => clearPending, []);

  // Slide the outgoing card away and bring the incoming one in from the
  // opposite side — mirrors the CSS status classes above.
  const showCard = useCallback(
    (index: number, direction: "next" | "prev") => {
      const current = activeIndexRef.current;
      if (index === current) return;

      clearPending();
      activeIndexRef.current = index;
      setActiveIndex(index);

      setStatuses((prev) => {
        const next = [...prev];
        next[current] = direction === "next" ? "out-left" : "out-right";
        next[index] = direction === "next" ? "in-right" : "in-left";
        return next;
      });

      // Let the "transition-none" start position paint, then transition in. A
      // timer backs up the frame callback, which stalls in unrendered tabs.
      const activate = () =>
        setStatuses((prev) => {
          if (!prev[index].startsWith("in-")) return prev;
          const next = [...prev];
          next[index] = "active";
          return next;
        });

      frames.current.push(
        requestAnimationFrame(() => {
          frames.current.push(requestAnimationFrame(activate));
        })
      );
      timeouts.current.push(setTimeout(activate, 60));

      timeouts.current.push(
        setTimeout(() => {
          setStatuses((prev) => {
            const next = [...prev];
            if (next[current] !== "active") next[current] = "not-active";
            return next;
          });
        }, TRANSITION_MS)
      );
    },
    []
  );

  const goTo = useCallback(
    (index: number) => showCard(index, index > activeIndexRef.current ? "next" : "prev"),
    [showCard]
  );

  const close = useCallback(() => setIsOpen(false), []);

  const openAt = useCallback(
    (index: number) => {
      if (!isOpen) {
        clearPending();
        activeIndexRef.current = index;
        setActiveIndex(index);
        setStatuses(points.map((_, i) => (i === index ? "active" : "not-active")));
        setIsOpen(true);
        return;
      }
      if (index === activeIndex) {
        close();
        return;
      }
      goTo(index);
    },
    [activeIndex, close, goTo, isOpen, points]
  );

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowRight") showCard((activeIndex + 1) % points.length, "next");
      if (event.key === "ArrowLeft")
        showCard((activeIndex - 1 + points.length) % points.length, "prev");
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [activeIndex, close, isOpen, points.length, showCard]);

  if (!points.length) return null;

  const frameStyle = {
    width: "min(100%, 160svh)",
    "--hotspot-ratio": `${content.baseImageAspectRatio}`,
    "--hotspot-shift": `${mobileShift}%`,
  } as CSSProperties;

  return (
    <section className="relative w-full bg-[#f2ede4] font-poppins overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 md:pt-24 pb-8 md:pb-10">
        {content.eyebrow && (
          <p className="text-primary-600 text-sm uppercase tracking-widest font-semibold mb-3">
            {content.eyebrow}
          </p>
        )}
        <h2 className="text-4xl md:text-5xl font-bold text-primary-900 max-w-3xl">
          {content.heading}
          {content.headingAccent && (
            <span className="italic text-[var(--color-secondary)]"> {content.headingAccent}</span>
          )}
        </h2>
        {content.intro && <p className="mt-4 text-gray-600 max-w-xl">{content.intro}</p>}
      </div>

      {/* Hotspot area — the inner box keeps the base image's aspect ratio, so
          the hotspot percentages stay aligned at every screen size. On mobile
          that box is blown up and shifted so the cabinet fills the frame and
          the hotspots don't pile up on each other. */}
      <div className="flex justify-center pb-16 md:pb-24">
        <div
          className="relative aspect-[4/5] w-full overflow-hidden md:aspect-[var(--hotspot-ratio)]"
          style={frameStyle}
        >
          <div className="absolute top-1/2 left-[var(--hotspot-shift)] w-[220%] -translate-y-1/2 aspect-[var(--hotspot-ratio)] md:left-0 md:top-0 md:w-full md:translate-y-0">
            <Image
              src={content.baseImage}
              alt={content.baseImageAlt}
              fill
              sizes="(max-width: 768px) 220vw, 1600px"
              className="object-cover"
            />

            {/* Clicking anywhere outside a hotspot closes the panel. */}
            {isOpen && (
              <button
                type="button"
                tabIndex={-1}
                aria-hidden="true"
                onClick={close}
                className="absolute inset-0 z-10 cursor-default"
              />
            )}

            <div className="absolute inset-0 z-20 pointer-events-none">
              {points.map((hotspot, index) => {
                const isActive = isOpen && index === activeIndex;
                return (
                  <div
                    key={hotspot.name}
                    className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
                    style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
                  >
                    {!isActive && (
                      <span className="absolute inset-0 rounded-full bg-white/50 animate-ping [animation-duration:2.5s]" />
                    )}
                    <button
                      type="button"
                      onClick={() => openAt(index)}
                      aria-label={`Bekijk ${hotspot.label}`}
                      aria-expanded={isActive}
                      data-hotspot-target={hotspot.name}
                      data-hotspot-status={isActive ? "active" : "not-active"}
                      className={`relative flex items-center justify-center rounded-full p-3 md:p-4 w-10 h-10 md:w-14 md:h-14 cursor-pointer shadow-lg shadow-black/10 transition-[transform,background-color] duration-300 ease-[cubic-bezier(0.38,0.005,0.215,1)] ${
                        isActive
                          ? "bg-[var(--color-secondary)] text-white scale-110 rotate-45"
                          : "bg-white text-primary-900 -rotate-45 hover:scale-110 hover:rotate-45"
                      }`}
                    >
                      <PlusIcon className="w-full" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Detail panel */}
      <div
        role="dialog"
        aria-modal="false"
        aria-hidden={!isOpen}
        aria-label="Kastdetails"
        className="fixed inset-0 z-100 pointer-events-none overflow-hidden"
      >
        <div
          className={`absolute right-0 top-0 flex h-full w-full max-w-[30em] items-center p-3 md:p-6 transition-transform duration-[600ms] ease-[cubic-bezier(0.625,0.05,0,1)] ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="pointer-events-auto relative flex h-full max-h-[54em] w-full flex-col overflow-y-auto rounded-3xl bg-white shadow-2xl shadow-black/20">
            <div className="sticky top-6 z-10 flex h-0 w-full justify-end px-6 pointer-events-none">
              <button
                type="button"
                onClick={close}
                aria-label="Sluit kastdetails"
                className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#f2ede4] p-3 text-primary-900 cursor-pointer transition-colors hover:bg-primary-200"
              >
                <PlusIcon className="w-full" />
              </button>
            </div>

            <div className="relative flex-1 overflow-hidden">
              <div className="grid h-full w-full grid-cols-1 grid-rows-1">
                {points.map((hotspot, index) => (
                  <div
                    key={hotspot.name}
                    data-hotspot-name={hotspot.name}
                    data-hotspot-status={statuses[index]}
                    aria-hidden={index !== activeIndex}
                    className={`col-start-1 row-start-1 flex flex-col px-3 pt-3 transition-[opacity,transform] duration-[600ms] ease-[cubic-bezier(0.625,0.05,0,1)] ${CARD_TRANSITION[statuses[index]]}`}
                  >
                    <div className="relative aspect-[3/2] overflow-hidden rounded-2xl bg-primary-100">
                      <Image
                        src={hotspot.image}
                        alt=""
                        fill
                        sizes="(max-width: 768px) 100vw, 480px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col gap-5 px-4 py-8">
                      <h3 className="text-3xl md:text-4xl font-semibold leading-[0.95] tracking-tight text-primary-900">
                        {hotspot.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">{hotspot.body}</p>
                      {hotspot.href && hotspot.ctaLabel && (
                        <Link
                          href={hotspot.href}
                          className="inline-flex w-fit items-center gap-2 rounded-full bg-[var(--color-secondary)] px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
                        >
                          {hotspot.ctaLabel}
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex w-full items-center justify-between px-6 pb-6">
              <button
                type="button"
                onClick={() => showCard((activeIndex - 1 + points.length) % points.length, "prev")}
                aria-label="Vorig detail"
                className="flex h-11 w-11 -scale-x-100 items-center justify-center rounded-full bg-[#f2ede4] p-3 text-primary-900 cursor-pointer transition-colors hover:bg-primary-200"
              >
                <ArrowIcon />
              </button>

              <div className="flex items-center gap-2">
                {points.map((hotspot, index) => (
                  <button
                    key={hotspot.name}
                    type="button"
                    onClick={() => goTo(index)}
                    aria-label={`Ga naar detail ${index + 1}`}
                    aria-current={index === activeIndex}
                    className={`h-2.5 w-2.5 rounded-full cursor-pointer transition-colors ${
                      index === activeIndex ? "bg-primary-900" : "bg-primary-300"
                    }`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => showCard((activeIndex + 1) % points.length, "next")}
                aria-label="Volgend detail"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-900 p-3 text-white cursor-pointer transition-opacity hover:opacity-90"
              >
                <ArrowIcon />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
