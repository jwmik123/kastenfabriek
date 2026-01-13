'use client'

import Image from 'next/image'
import Link from 'next/link'
import { User, ShoppingBasket, Mail, Star } from 'lucide-react'
import { useEffect, useState } from 'react'

const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false)

  // useEffect(() => {
  //   const handleScroll = () => {
  //     setIsScrolled(window.scrollY > 50)
  //   }

  //   window.addEventListener('scroll', handleScroll)
  //   return () => window.removeEventListener('scroll', handleScroll)
  // }, [])

  return (
    <div className="fixed top-0 left-0 right-0 z-30">
      {/* Top Header */}
      <div className="w-full bg-primary text-white py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between text-sm font-poppins">
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
        isScrolled ? 'py-4' : 'py-0'
      }`}>
        <div className={`transition-all duration-300 ${
          isScrolled
            ? 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-white/60 backdrop-blur-md rounded-xl border border-gray-200'
            : 'bg-white'
        }`}>
          <div className={`flex items-center justify-between font-poppins text-black transition-all duration-300 ${
            isScrolled ? 'py-4' : 'py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'
          }`}>
          <Link href="/" className="flex-shrink-0 flex items-center gap-2">
            {/* <Image
              src="/logo.svg"
              alt="Kastenfabriek Logo"
              width={80}
              height={40}
              priority
            /> */}
            <h1 className="text-xl flex items-center gap-2">
                <span>Kasten-fabriek.nl</span>
            </h1>
          </Link>

          <div className="flex items-center gap-8">
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

          <div className="flex items-center gap-4">
            <button className="text-white bg-green-600 px-4 py-2 rounded-full cursor-pointer">
              Ontwerp je maatkast
            </button>

            <div className="h-8 w-px bg-gray-300" />

            <Link href="/account" className="hover:text-primary transition-colors">
              <User size={24} />
            </Link>

            <Link href="/cart" className="hover:text-primary transition-colors">
              <ShoppingBasket size={24} />
            </Link>
          </div>
        </div>
      </div>
      </nav>
    </div>
  )
}

export default Navigation