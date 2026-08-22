import Link from 'next/link'
import { Mail, Phone, MapPin } from 'lucide-react'
import {
  CONFIGURATORS,
  CONFIGURATORS_HREF,
  CONTACT_EMAIL,
  UPCOMING_CONFIGURATORS,
} from '@/lib/configurators'
import {
  filledLegalDocuments,
  getSiteSettings,
  type SiteAddress,
  type SiteSocialMedia,
} from '@/sanity/lib/siteSettings'

/**
 * Every footer link points at a route that exists — the configurators come
 * from `lib/configurators`, so a new cabinet shows up here automatically and
 * the "Binnenkort" placeholders stay in step with the products page.
 */
const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: CONFIGURATORS_HREF, label: 'Onze kasten' },
  { href: '/producten', label: 'Producten' },
  { href: '/producten/materiaalstalen', label: 'Materialen' },
  { href: '/kennisbank', label: 'Kennisbank' },
]

const CLOSET_LINKS = [
  ...CONFIGURATORS.map((c) => ({ href: c.href, label: c.title })),
  { href: '/producten/ikea-pax-deur', label: 'IKEA PAX deuren' },
]

const PAYMENT_METHODS = ['iDEAL', 'Visa', 'Mastercard', 'PayPal']

/** Shown when Sanity has no slogan yet. */
const DEFAULT_TAGLINE =
  'Maatwerk dat niet alleen opbergt, maar ook sfeer brengt.'
const DEFAULT_SITE_NAME = 'Kasten Fabriek'

const SOCIAL_LABELS: Record<keyof SiteSocialMedia, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  pinterest: 'Pinterest',
  linkedin: 'LinkedIn',
}

/** "Straat 1, 1689ZX Zwaag" — skips whatever the editor left empty. */
function addressLines(address: SiteAddress | undefined): string[] {
  if (!address) return []
  const place = [address.postalCode, address.city].filter(Boolean).join(' ')
  return [address.street, place, address.country].filter(
    (line): line is string => Boolean(line?.trim()),
  )
}

function socialLinks(socialMedia: SiteSocialMedia | undefined) {
  if (!socialMedia) return []
  return (Object.keys(SOCIAL_LABELS) as (keyof SiteSocialMedia)[])
    .map((platform) => ({
      platform,
      label: SOCIAL_LABELS[platform],
      href: socialMedia[platform],
    }))
    .filter(
      (link): link is { platform: keyof SiteSocialMedia; label: string; href: string } =>
        Boolean(link.href),
    )
}

/**
 * The company details all come from the `siteSettings` document in Sanity —
 * anything an editor hasn't filled in is left out rather than shown as a
 * placeholder, so the footer never states a phone number or address that isn't
 * real. Legal links only appear once their document actually has content.
 */
const Footer = async () => {
  const settings = await getSiteSettings()

  const siteName = settings.siteName?.trim() || DEFAULT_SITE_NAME
  const tagline = settings.tagline?.trim() || DEFAULT_TAGLINE
  const email = settings.contactEmail?.trim() || CONTACT_EMAIL
  const phone = settings.contactPhone?.trim()
  const address = addressLines(settings.address)
  const socials = socialLinks(settings.socialMedia)
  const legalLinks = filledLegalDocuments(settings)
  const companyNumbers = [
    settings.kvkNumber?.trim() && `KvK ${settings.kvkNumber.trim()}`,
    settings.vatNumber?.trim() && `BTW ${settings.vatNumber.trim()}`,
  ].filter(Boolean) as string[]

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
            {tagline}
          </p>
        </div>

        {/* Four Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {/* Column 1: Navigation */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Navigatie</h3>
            <ul className="space-y-2">
              {NAV_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-white hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Closets */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Onze Kasten</h3>
            <ul className="space-y-2">
              {CLOSET_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-white hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
              {UPCOMING_CONFIGURATORS.map(({ id, title }) => (
                <li key={id}>
                  <span className="text-white/50">{title} (Binnenkort)</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <Mail size={18} className="text-white mt-1 flex-shrink-0" />
                <a href={`mailto:${email}`} className="text-white hover:text-white transition-colors">
                  {email}
                </a>
              </li>
              {phone && (
                <li className="flex items-start gap-2">
                  <Phone size={18} className="text-white mt-1 flex-shrink-0" />
                  <a
                    href={`tel:${phone.replace(/[^+\d]/g, '')}`}
                    className="text-white hover:text-white transition-colors"
                  >
                    {phone}
                  </a>
                </li>
              )}
              {address.length > 0 && (
                <li className="flex items-start gap-2">
                  <MapPin size={18} className="text-white mt-1 flex-shrink-0" />
                  <address className="not-italic text-white">
                    {address.map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}
                  </address>
                </li>
              )}
            </ul>

            {socials.length > 0 && (
              <>
                <h3 className="text-lg font-semibold mt-8 mb-4">Volg ons</h3>
                <ul className="flex flex-wrap gap-2">
                  {socials.map(({ platform, label, href }) => (
                    <li key={platform}>
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block rounded-full border border-white/30 px-3 py-1 text-sm text-white transition-colors hover:border-white"
                      >
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {/* Column 4: Payment & legal */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Betaalmethoden</h3>
            <div className="flex flex-wrap gap-2 mb-6">
              {PAYMENT_METHODS.map((method) => (
                <div
                  key={method}
                  className="bg-white rounded px-3 py-2 text-xs font-semibold text-gray-800"
                >
                  {method}
                </div>
              ))}
            </div>

            {legalLinks.length > 0 && (
              <>
                <h3 className="text-lg font-semibold mb-4">Voorwaarden</h3>
                <ul className="space-y-2">
                  {legalLinks.map(({ key, href, title }) => (
                    <li key={key}>
                      <Link href={href} className="text-white hover:text-white transition-colors">
                        {title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {companyNumbers.length > 0 && (
              <p className="mt-6 text-sm text-white/50">{companyNumbers.join(' · ')}</p>
            )}
          </div>
        </div>
      </div>

      {/* Copyright - Full Width */}
      <div className="w-full bg-primary-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col gap-2 sm:flex-row sm:justify-between">
          <p className="text-sm text-white/50">&copy; {new Date().getFullYear()} {siteName}. Alle rechten voorbehouden.</p>
          <p className="text-sm text-white/50">Website gerealiseerd door Mik Development</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
