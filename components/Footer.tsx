import Link from 'next/link'
import { Mail, Phone, MapPin, Star } from 'lucide-react'
import Image from 'next/image'

const Footer = () => {
  return (
    <footer className="bg-primary text-white font-poppins">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pb-0">

        <div className="relative w-20 h-20 lg:w-24 lg:h-24 flex-shrink-0 pb-12 flex items-center">
            <svg viewBox="0 0 183 111" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13.75 108.5H2.5V2.5H25V108.5H13.75ZM13.75 108.5L13.5 55H45V108.5H35.5M13.75 108.5H35.5M35.5 108.5V34H76V108.5H58M35.5 108.5H58M58 108.5V75H146V108.5H107M58 108.5H95.5M95.5 108.5V57.5H168.5V108.5H107M95.5 108.5H107M107 108.5V93H180.5V108.5H107Z" stroke="white" strokeWidth="5" className='stroke-white/30'/>
            </svg>
        </div>

        {/* Slogan */}
        <div className="mb-20">
          <p className="text-xl md:text-6xl text-white font-semibold leading-tighter tracking-tight">
            Maatwerk dat niet alleen opbergt, maar ook sfeer brengt.
          </p>
        </div>

        {/* Four Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {/* Column 1: Navigation */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Navigatie</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-white hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-white hover:text-white transition-colors">
                  Onze kasten
                </Link>
              </li>
              <li>
                <Link href="/projects" className="text-white hover:text-white transition-colors">
                  Materialen
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-white hover:text-white transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Closets */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Onze Kasten</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/kledingkast" className="text-white hover:text-white transition-colors">
                  Kledingkast
                </Link>
              </li>
              <li>
                <Link href="/wasmachinekast" className="text-white hover:text-white transition-colors">
                  Wasmachinekast
                </Link>
              </li>
              <li>
                <Link href="/ikea-pax" className="text-white hover:text-white transition-colors">
                  IKEA PAX Deuren
                </Link>
              </li>
              <li>
                <span className="text-white/50">TV Meubel (Binnenkort)</span>
              </li>
              <li>
                <span className="text-white/50">Badkamermeubel (Binnenkort)</span>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <Mail size={18} className="text-white mt-1 flex-shrink-0" />
                <a href="mailto:info@kasten-fabriek.nl" className="text-white hover:text-white transition-colors">
                  info@kasten-fabriek.nl
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Phone size={18} className="text-white mt-1 flex-shrink-0" />
                <a href="tel:+31612345678" className="text-white hover:text-white transition-colors">
                  +31 6 1234 5678
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin size={18} className="text-white mt-1 flex-shrink-0" />
                <span className="text-white">
                  Amsterdam, Nederland
                </span>
              </li>
            </ul>
          </div>

          {/* Column 4: Payment & Reviews */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Betaalmethoden</h3>
            <div className="flex flex-wrap gap-2 mb-6">
              <div className="bg-white rounded px-3 py-2 text-xs font-semibold text-gray-800">
                iDEAL
              </div>
              <div className="bg-white rounded px-3 py-2 text-xs font-semibold text-gray-800">
                Visa
              </div>
              <div className="bg-white rounded px-3 py-2 text-xs font-semibold text-gray-800">
                Mastercard
              </div>
              <div className="bg-white rounded px-3 py-2 text-xs font-semibold text-gray-800">
                PayPal
              </div>
            </div>

            {/* <h3 className="text-lg font-semibold mb-3">Beoordelingen</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} fill="#FFC107" className="text-[#FFC107]" />
                  ))}
                </div>
                <span className="text-sm text-white">4,9/5</span>
              </div>
              <p className="text-xs text-white/50">700+ reviews op Trustpilot</p>
            </div> */}
          </div>
        </div>

        {/* Bottom Logo Section */}
        {/* <div className="pt-8 mb-8">
          <div className="flex items-center justify-center gap-3">
            
            <h2 className="text-3xl md:text-4xl lg:text-7xl font-bold">Kasten-fabriek.nl</h2>
          </div>
        </div> */}
      </div>

      {/* Copyright - Full Width */}
      <div className="w-full bg-primary-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between">
          <p className="text-sm text-white/50">&copy; {new Date().getFullYear()} Kasten Fabriek. Alle rechten voorbehouden.</p>
          <p className="text-sm text-white/50">Website gerealiseerd door Mik Development</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
