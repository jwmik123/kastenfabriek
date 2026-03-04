'use client'

import { useRef, useState, useEffect } from 'react'
import { useProgress } from '@react-three/drei'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

export default function ThreeLoader() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(true)
  const animDone = useRef(false)
  const loadDone = useRef(false)
  const exiting = useRef(false)
  const hasBeenActive = useRef(false)
  const { active } = useProgress()

  const doExit = () => {
    if (exiting.current) return
    exiting.current = true
    gsap.to(wrapperRef.current, {
      opacity: '0',
      duration: 1,
      ease: 'power4.inOut',
      onComplete: () => setVisible(false),
    })
  }

  useGSAP(
    () => {
      gsap.set('.loader-fill-rect', { scaleX: 0, transformOrigin: 'left center' })
      gsap.to('.loader-fill-rect', {
        scaleX: 1,
        duration: 1.5,
        ease: 'power4.inOut',
        onComplete: () => {
          animDone.current = true
          if (loadDone.current) doExit()
        },
      })
    },
    { scope: containerRef }
  )

  useEffect(() => {
    if (active) hasBeenActive.current = true
    if (!active && hasBeenActive.current) {
      loadDone.current = true
      if (animDone.current) doExit()
    }
  }, [active])

  if (!visible) return null

  return (
    <div ref={wrapperRef} className="absolute inset-0 z-50 flex items-center justify-center bg-primary-dark">
      <div ref={containerRef} className="w-[91.5px] h-[55.5px]">
        <svg className="w-full h-full" viewBox="0 0 183 111" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <clipPath id="loaderClipPath">
              <rect className="loader-fill-rect" x="0" y="0" width="183" height="111" />
            </clipPath>
          </defs>
          <path
            d="M13.75 108.5H2.5V2.5H25V108.5H13.75ZM13.75 108.5L13.5 55H45V108.5H35.5M13.75 108.5H35.5M35.5 108.5V34H76V108.5H58M35.5 108.5H58M58 108.5V75H146V108.5H107M58 108.5H95.5M95.5 108.5V57.5H168.5V108.5H107M95.5 108.5H107M107 108.5V93H180.5V108.5H107Z"
            stroke="var(--color-primary)"
            strokeWidth="5"
            fill="none"
            opacity="0.2"
          />
          <path
            d="M13.75 108.5H2.5V2.5H25V108.5H13.75ZM13.75 108.5L13.5 55H45V108.5H35.5M13.75 108.5H35.5M35.5 108.5V34H76V108.5H58M35.5 108.5H58M58 108.5V75H146V108.5H107M58 108.5H95.5M95.5 108.5V57.5H168.5V108.5H107M95.5 108.5H107M107 108.5V93H180.5V108.5H107Z"
            stroke="white"
            strokeWidth="5"
            fill="none"
            opacity="0.8"
            clipPath="url(#loaderClipPath)"
          />
        </svg>
      </div>
    </div>
  )
}
