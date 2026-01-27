'use client'

import Image from 'next/image'
import Link from 'next/link'
import { User, ShoppingBasket, Mail, Star } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'
import gsap from 'gsap'

const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const menuContentRef = useRef<HTMLDivElement>(null)

  // useEffect(() => {
  //   const handleScroll = () => {
  //     setIsScrolled(window.scrollY > 50)
  //   }

  //   window.addEventListener('scroll', handleScroll)
  //   return () => window.removeEventListener('scroll', handleScroll)
  // }, [])

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

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-30  font-poppins">
      {/* Top Header */}
      <div className="hidden lg:block w-full bg-primary text-white py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Mail size={16} />
              <span>info@kasten-fabriek.nl</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} fill="white" />
                ))}
              </div>
              <span>4,9/5 van 700+ reviews</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className={`w-full transition-all duration-300 ${
        isScrolled ? 'py-0' : 'py-0'
      }`}>
        {/* ${
          isScrolled
            ? 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-white/60 backdrop-blur-md rounded-xl border border-gray-200'
            : 'bg-white'
        } */}
        <div className={`transition-all duration-300 bg-white`}>
          <div className={`flex items-center justify-between font-poppins text-black transition-all duration-300 ${
            isScrolled ? 'py-4' : 'py-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'
          }`}>
          <Link href="/" className="flex-shrink-0 flex items-center gap-2">
            <Image
              src="/logo.svg"
              alt="Kastenfabriek Logo"
              width={80}
              height={40}
              priority
              className="w-[50px] h-auto lg:w-[60px]"
            />
            {/* <h1 className="text-4xl flex items-center gap-2">
                <span>KF</span>
            </h1> */}
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-8 lg:gap-12 text-lg">
            <Link href="/about" className="transition-colors hover:text-gray-600">
              Onze kasten
            </Link>
            <Link href="/projects" className="transition-colors hover:text-gray-600">
              Materialen
            </Link>
            <Link href="/contact" className="transition-colors hover:text-gray-600">
              Blog
            </Link>
          </div>

          {/* Desktop Right Section */}
          <div className="hidden lg:flex items-center gap-4">
            <Link href="/kledingkast" className="text-white bg-green-600 px-6 py-4 rounded-full cursor-pointer">
              Ontwerp je maatkast
            </Link>

            <div className="h-8 w-px bg-gray-300" />

            <Link href="/account" className="hover:text-primary transition-colors">
              <User size={24} />
            </Link>

            <Link href="/cart" className="hover:text-primary transition-colors">
              <ShoppingBasket size={24} />
            </Link>
          </div>

          {/* Mobile Right Section */}
          <div className="flex lg:hidden items-center gap-4">
            <button className="text-white bg-green-600 px-4 py-2 text-sm rounded-full cursor-pointer">
              Ontwerp je kast
            </button>

            {/* Mobile Hamburger Menu */}
            <label className="flex flex-col w-[28px] cursor-pointer z-50">
              <input
                type="checkbox"
                className="hidden peer"
                checked={isMenuOpen}
                onChange={handleMenuToggle}
              />
              <span className="bg-primary rounded-[5px] h-[3px] my-[3px] transition-all duration-400 ease-[cubic-bezier(0.68,-0.6,0.32,1.6)] w-1/2 origin-bottom peer-checked:bg-white peer-checked:rotate-[45deg] peer-checked:translate-x-[4px] peer-checked:translate-y-0" />
              <span className="bg-primary rounded-[5px] h-[3px] my-[3px] transition-all duration-400 ease-[cubic-bezier(0.68,-0.6,0.32,1.6)] w-full origin-top peer-checked:bg-white peer-checked:rotate-[-45deg]" />
              <span className="bg-primary rounded-[5px] h-[3px] my-[3px] transition-all duration-400 ease-[cubic-bezier(0.68,-0.6,0.32,1.6)] w-3/4 origin-bottom peer-checked:bg-white peer-checked:w-1/2 peer-checked:translate-x-[12px] peer-checked:translate-y-[-6px] peer-checked:rotate-[45deg]" />
            </label>
          </div>
        </div>
      </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        ref={mobileMenuRef}
        className="fixed inset-0 bg-primary z-40 hidden flex-col items-center justify-center"
        style={{ clipPath: 'circle(0% at top right)' }}
      >
        <div ref={menuContentRef} className="flex flex-col items-center gap-8">
          <Link
            href="/about"
            onClick={closeMenu}
            className="text-white text-3xl font-medium hover:opacity-80 transition-opacity"
          >
            Onze kasten
          </Link>
          <Link
            href="/projects"
            onClick={closeMenu}
            className="text-white text-3xl font-medium hover:opacity-80 transition-opacity"
          >
            Materialen
          </Link>
          <Link
            href="/contact"
            onClick={closeMenu}
            className="text-white text-3xl font-medium hover:opacity-80 transition-opacity"
          >
            Blog
          </Link>

          <div className="w-16 h-px bg-white/30 my-4" />

          <button className="text-primary bg-white px-8 py-4 rounded-full font-medium">
            Ontwerp je maatkast
          </button>

          <div className="flex items-center gap-6 mt-4">
            <Link href="/account" onClick={closeMenu} className="text-white hover:opacity-80 transition-opacity">
              <User size={28} />
            </Link>
            <Link href="/cart" onClick={closeMenu} className="text-white hover:opacity-80 transition-opacity">
              <ShoppingBasket size={28} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Navigation