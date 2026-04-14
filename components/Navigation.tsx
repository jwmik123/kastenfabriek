'use client'

import Image from 'next/image'
import Link from 'next/link'
import { User, ShoppingBasket, Heart } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'
import gsap from 'gsap'

const NAV_LINKS = [
  { href: '/about', label: 'Onze kasten' },
  { href: '/projects', label: 'Materialen' },
  { href: '/contact', label: 'Blog' },
]

const ICON_LINKS = [
  { href: '/wishlist', icon: Heart, label: 'Wishlist' },
  { href: '/cart', icon: ShoppingBasket, label: 'Winkelwagen' },
  { href: '/account', icon: User, label: 'Account' },
]

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const menuContentRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLElement>(null)
  const highlightRef = useRef<HTMLDivElement>(null)

  const handleNavLinkHover = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const highlight = highlightRef.current
    if (!highlight) return
    const link = e.currentTarget
    gsap.to(highlight, {
      x: link.offsetLeft,
      y: link.offsetTop,
      width: link.offsetWidth,
      height: link.offsetHeight,
      opacity: 1,
      duration: 0.25,
      ease: 'power2.out',
    })
  }

  const handleNavLeave = () => {
    gsap.to(highlightRef.current, { opacity: 0, duration: 0.2, ease: 'power2.out' })
  }

  useEffect(() => {
    if (!mobileMenuRef.current || !menuContentRef.current) return

    const menu = mobileMenuRef.current
    const content = menuContentRef.current
    const links = content.querySelectorAll('a, button')

    if (isMenuOpen) {
      document.body.style.overflow = 'hidden'
      gsap.set(menu, { display: 'flex' })
      gsap.to(menu, {
        clipPath: 'circle(150% at top right)',
        duration: 0.8,
        ease: 'power3.inOut',
      })
      gsap.fromTo(
        links,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, delay: 0.3, ease: 'power2.out' }
      )
    } else {
      document.body.style.overflow = ''
      gsap.to(menu, {
        clipPath: 'circle(0% at top right)',
        duration: 0.6,
        ease: 'power3.inOut',
        onComplete: () => { gsap.set(menu, { display: 'none' }) },
      })
    }
  }, [isMenuOpen])

  return (
    <div className="fixed top-0 left-0 right-0 z-30 font-poppins pointer-events-none">
      <div className="flex items-center justify-between px-24 pt-6">

        {/* Logo — floating independently */}
        <Link
          href="/"
          className="pointer-events-auto flex-shrink-0"
          style={{ mixBlendMode: 'difference', filter: 'invert(1)' }}
        >
          <Image
            src="/logo.svg"
            alt="Kastenfabriek Logo"
            width={80}
            height={40}
            priority
            className="w-[50px] h-auto lg:w-[60px]"
          />
        </Link>

        {/* Desktop Center Nav — frosted glass pill */}
        <nav
          ref={navRef}
          className="hidden lg:flex pointer-events-auto relative items-center gap-1 bg-white/80 backdrop-blur-md rounded-full px-2 py-2 shadow-sm border border-white/50"
          onMouseLeave={handleNavLeave}
        >
          {/* Sliding highlight */}
          <div
            ref={highlightRef}
            className="absolute top-0 left-0 rounded-full bg-primary-500 pointer-events-none opacity-0"
          />
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onMouseEnter={handleNavLinkHover}
              className="relative z-10 px-5 py-2 text-sm font-medium text-gray-700 rounded-full hover:text-white transition-colors duration-150"
            >
              {label}
            </Link>
          ))}
          <div className="w-px h-5 bg-gray-300/70 mx-1" />
          <Link
            href="/kledingkast"
            className="relative z-10 px-5 py-2 text-sm font-semibold text-white bg-[#aa382b] rounded-full hover:opacity-80 transition-opacity duration-150 shadow-sm"
          >
            Ontwerp je kast
          </Link>
        </nav>

        {/* Desktop Right Icons — each floating independently */}
        <div className="hidden lg:flex items-center gap-2 pointer-events-auto">
          {ICON_LINKS.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white/80 backdrop-blur-md shadow-sm border border-white/50 text-gray-600 hover:text-primary hover:scale-110 transition-all duration-200"
            >
              <Icon size={17} />
            </Link>
          ))}
        </div>

        {/* Mobile Right Section */}
        <div className="flex lg:hidden items-center gap-3 pointer-events-auto">
          <Link href="/kledingkast" className="text-white bg-primary px-4 py-2 text-sm rounded-full">
            Ontwerp je kast
          </Link>

          <label className="flex flex-col w-[28px] cursor-pointer z-50">
            <input
              type="checkbox"
              className="hidden peer"
              checked={isMenuOpen}
              onChange={() => setIsMenuOpen(v => !v)}
            />
            <span className="bg-primary rounded-[5px] h-[3px] my-[3px] transition-all duration-400 ease-[cubic-bezier(0.68,-0.6,0.32,1.6)] w-1/2 origin-bottom peer-checked:bg-white peer-checked:rotate-[45deg] peer-checked:translate-x-[4px] peer-checked:translate-y-0" />
            <span className="bg-primary rounded-[5px] h-[3px] my-[3px] transition-all duration-400 ease-[cubic-bezier(0.68,-0.6,0.32,1.6)] w-full origin-top peer-checked:bg-white peer-checked:rotate-[-45deg]" />
            <span className="bg-primary rounded-[5px] h-[3px] my-[3px] transition-all duration-400 ease-[cubic-bezier(0.68,-0.6,0.32,1.6)] w-3/4 origin-bottom peer-checked:bg-white peer-checked:w-1/2 peer-checked:translate-x-[12px] peer-checked:translate-y-[-6px] peer-checked:rotate-[45deg]" />
          </label>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div
        ref={mobileMenuRef}
        className="fixed inset-0 bg-primary z-40 hidden flex-col items-center justify-center pointer-events-auto"
        style={{ clipPath: 'circle(0% at top right)' }}
      >
        <div ref={menuContentRef} className="flex flex-col items-center gap-8">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setIsMenuOpen(false)}
              className="text-white text-3xl font-medium hover:opacity-80 transition-opacity"
            >
              {label}
            </Link>
          ))}

          <div className="w-16 h-px bg-white/30 my-4" />

          <Link
            href="/kledingkast"
            onClick={() => setIsMenuOpen(false)}
            className="text-primary bg-white px-8 py-4 rounded-full font-medium"
          >
            Ontwerp je maatkast
          </Link>

          <div className="flex items-center gap-6 mt-4">
            {ICON_LINKS.map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                aria-label={label}
                onClick={() => setIsMenuOpen(false)}
                className="text-white hover:opacity-80 transition-opacity"
              >
                <Icon size={28} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Navigation
