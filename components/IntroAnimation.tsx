// components/IntroAnimation.tsx
"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export default function IntroAnimation() {
  const container = useRef<HTMLDivElement>(null);
  const introWrapper = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Set initial state immediately
      gsap.set(".fill-rect", {
        scaleX: 0,
        transformOrigin: "left center",
      });

      const tl = gsap.timeline();

      tl.to(
        ".fill-rect",
        {
          scaleX: 1,
          duration: 2,
          ease: "power4.inOut",
        }
      ).to(introWrapper.current, {
        y: "-200%",
        duration: 1.5,
        ease: "power4.inOut",
      });
    },
    { scope: container }
  );

  return (
    <div ref={introWrapper} className="fixed inset-0 z-50 flex items-center justify-center bg-primary-dark">
      <div ref={container} className="w-[91.5px] h-[55.5px]">
        <svg
          className="w-full h-full"
          viewBox="0 0 183 111"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <clipPath id="strokeClipPath">
              <rect className="fill-rect" x="0" y="0" width="183" height="111" />
            </clipPath>
          </defs>

          {/* Base path with low opacity */}
          <path
            d="M13.75 108.5H2.5V2.5H25V108.5H13.75ZM13.75 108.5L13.5 55H45V108.5H35.5M13.75 108.5H35.5M35.5 108.5V34H76V108.5H58M35.5 108.5H58M58 108.5V75H146V108.5H107M58 108.5H95.5M95.5 108.5V57.5H168.5V108.5H107M95.5 108.5H107M107 108.5V93H180.5V108.5H107Z"
            stroke="var(--color-primary)"
            strokeWidth="5"
            fill="none"
            opacity="0.2"
          />

          {/* Animated stroke that fills in from left to right */}
          <path
            d="M13.75 108.5H2.5V2.5H25V108.5H13.75ZM13.75 108.5L13.5 55H45V108.5H35.5M13.75 108.5H35.5M35.5 108.5V34H76V108.5H58M35.5 108.5H58M58 108.5V75H146V108.5H107M58 108.5H95.5M95.5 108.5V57.5H168.5V108.5H107M95.5 108.5H107M107 108.5V93H180.5V108.5H107Z"
            stroke="white"
            strokeWidth="5"
            fill="none"
            opacity="0.8"
            clipPath="url(#strokeClipPath)"
          />
        </svg>
      </div>
    </div>
  );
}
