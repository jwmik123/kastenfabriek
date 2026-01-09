'use client'

import Image from 'next/image'
import Link from 'next/link'
import { User, ShoppingBasket } from 'lucide-react'
import { useEffect, useState } from 'react'

const Navigation = () => {
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    const sections = document.querySelectorAll('[data-nav-theme]')

    const observer = new IntersectionObserver(
      (entries) => {
        // Sort entries by their position to handle the topmost visible section
        const sortedEntries = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => {
            return a.boundingClientRect.top - b.boundingClientRect.top
          })

        // Use the first (topmost) intersecting section
        if (sortedEntries.length > 0) {
          const theme = sortedEntries[0].target.getAttribute('data-nav-theme')
          setIsDark(theme === 'dark')
        }
      },
      {
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
        rootMargin: '0px 0px -80% 0px'
      }
    )

    sections.forEach((section) => observer.observe(section))

    return () => observer.disconnect()
  }, [])

  return (
    <nav className="w-full py-6 fixed top-0 left-0 right-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 bg-white/20 backdrop-blur-sm font-poppins rounded-xl border border-white/40">
        <div className={`flex items-center justify-between transition-colors duration-300 ${
          isDark ? 'text-white' : 'text-black'
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
            <Link href="/about" className={`transition-colors ${
              isDark ? 'hover:text-gray-300' : 'hover:text-gray-600'
            }`}>
              Onze kasten
            </Link>
            <Link href="/projects" className={`transition-colors ${
              isDark ? 'hover:text-gray-300' : 'hover:text-gray-600'
            }`}>
              Materialen
            </Link>
            <Link href="/contact" className={`transition-colors ${
              isDark ? 'hover:text-gray-300' : 'hover:text-gray-600'
            }`}>
              Blog
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <button className="bg-primary text-white px-4 py-2 rounded-xl">
              Ontwerp je maatkast
            </button>

            <div className={`h-8 w-px transition-colors ${
              isDark ? 'bg-white/30' : 'bg-gray-300'
            }`} />

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
  )
}

export default Navigation