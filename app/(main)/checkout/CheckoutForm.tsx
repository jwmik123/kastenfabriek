'use client'

import { useState, useTransition } from 'react'
import { MapPin, Package, CreditCard, Plus, Check, X } from 'lucide-react'
import { createCheckoutSession } from '@/lib/actions/checkout'
import { createAddress } from '@/lib/actions/address'
import { validateCoupon } from '@/lib/actions/coupon'
import type { ValidateCouponResult } from '@/lib/actions/coupon'
import { calculateDiscount } from '@/lib/cart/discount'
import type { CartItem, ClosetConfigSnapshot } from '@/lib/cart/types'
import { getDeliveryWindow } from '@/lib/delivery-window'
import { calcCartTotals } from '@/lib/cart/totals'
import { summarizeCloset } from '@/lib/order/closet-spec'
import { summarizeProductLine } from '@/lib/order/types'
import { LEGAL_DOCUMENTS, type LegalDocumentKey } from '@/lib/legal'

type Address = {
  id: string
  firstName: string
  lastName: string
  company: string | null
  street: string
  houseNumber: string
  houseNumberAddition: string | null
  postalCode: string
  city: string
  country: string
  phone: string | null
  isDefault: boolean
  type: string
}

interface CheckoutFormProps {
  addresses: Address[]
  cartItems: CartItem[]
  /** Which legal documents an editor has written — unwritten ones 404, so they stay unlinked. */
  legalFilled: Record<LegalDocumentKey, boolean>
}

/**
 * "de algemene voorwaarden, privacyverklaring en het retourbeleid" — each
 * document links to its page once an editor has actually written it.
 */
function LegalDocumentList({ legalFilled }: { legalFilled: Record<LegalDocumentKey, boolean> }) {
  return (
    <>
      {LEGAL_DOCUMENTS.map((doc, i) => (
        <span key={doc.key}>
          {i > 0 && (i === LEGAL_DOCUMENTS.length - 1 ? ' en ' : ', ')}
          {legalFilled[doc.key] ? (
            <a
              href={doc.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:no-underline"
            >
              {doc.title.toLowerCase()}
            </a>
          ) : (
            doc.title.toLowerCase()
          )}
        </span>
      ))}
    </>
  )
}

const fmt = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 })

/** Name and outer size — a dual-layout wasmachinekast counts both sections. */
function ClosetSummaryLine({ config }: { config: ClosetConfigSnapshot }) {
  const headline = summarizeCloset(config)
  return (
    <div>
      <p className="font-medium text-sm text-gray-900">{headline.typeLabel}</p>
      <p className="text-xs text-gray-500">
        {headline.totalWidthCm} × {headline.maxHeightCm} × {config.depthCm} cm
      </p>
    </div>
  )
}

type Step = 'address' | 'review' | 'payment'

type AppliedCoupon = {
  code: string
  discountType: 'percent' | 'fixed'
  discountValue: number
}

export default function CheckoutForm({ addresses, cartItems, legalFilled }: CheckoutFormProps) {
  const [step, setStep] = useState<Step>('address')
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? ''
  )
  const [showNewAddress, setShowNewAddress] = useState(addresses.length === 0)
  const [isPending, startTransition] = useTransition()
  const [couponIsPending, startCouponTransition] = useTransition()
  const [error, setError] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)

  // Coupon state
  const [couponInput, setCouponInput] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null)
  const [couponError, setCouponError] = useState('')

  // New address form state
  const [newAddr, setNewAddr] = useState({
    firstName: '', lastName: '', street: '', houseNumber: '',
    houseNumberAddition: '', postalCode: '', city: '', country: 'NL', phone: '',
  })

  const totals = calcCartTotals(cartItems)

  const freeMontageTotal = cartItems.reduce(
    (sum, item) =>
      item.kind === 'closet'
        ? sum + (item.priceSnapshot.freeMontageDiscount ?? 0) * item.quantity
        : sum,
    0
  )

  const discountAmountEur = appliedCoupon
    ? calculateDiscount(totals.lineSubtotal + totals.install, appliedCoupon)
    : 0
  const discountedTotal = totals.grandTotal - discountAmountEur
  const discountAmountCents = Math.round(discountAmountEur * 100)

  const handleApplyCoupon = () => {
    if (!couponInput.trim()) return
    setCouponError('')
    startCouponTransition(async () => {
      const result: ValidateCouponResult = await validateCoupon(couponInput)
      if (result.valid) {
        setAppliedCoupon(result.discount)
        setCouponInput('')
      } else {
        const messages = {
          not_found: 'Couponcode niet gevonden.',
          expired: 'Deze couponcode is verlopen.',
          limit_reached: 'Deze couponcode is niet meer geldig (limiet bereikt).',
        }
        setCouponError(messages[result.error])
      }
    })
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponError('')
  }

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId)

  const handleSaveNewAddress = () => {
    setError('')
    if (!newAddr.firstName || !newAddr.lastName || !newAddr.street || !newAddr.houseNumber || !newAddr.postalCode || !newAddr.city) {
      setError('Vul alle verplichte velden in.')
      return
    }
    startTransition(async () => {
      try {
        const result = await createAddress({ ...newAddr, isDefault: addresses.length === 0 })
        setSelectedAddressId(result.id)
        setShowNewAddress(false)
        // Refresh is not possible here; user needs to refresh manually or we use router.refresh
        // For simplicity we just proceed assuming the address is saved
      } catch {
        setError('Adres opslaan mislukt. Probeer opnieuw.')
      }
    })
  }

  const handleProceedToReview = () => {
    if (!selectedAddressId) {
      setError('Selecteer een bezorgadres.')
      return
    }
    setError('')
    setStep('review')
  }

  const handleStartPayment = () => {
    if (!termsAccepted) {
      setError('Ga akkoord met de algemene voorwaarden om af te rekenen.')
      return
    }
    setError('')
    startTransition(async () => {
      try {
        const { url } = await createCheckoutSession(
          selectedAddressId,
          termsAccepted,
          appliedCoupon ? { couponCode: appliedCoupon.code, discountAmount: discountAmountCents } : undefined
        )
        window.location.href = url
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Er ging iets mis. Probeer opnieuw.')
      }
    })
  }

  const steps: { key: Step; label: string; icon: React.ReactNode }[] = [
    { key: 'address', label: 'Adres', icon: <MapPin className="w-4 h-4" /> },
    { key: 'review', label: 'Overzicht', icon: <Package className="w-4 h-4" /> },
    { key: 'payment', label: 'Betaling', icon: <CreditCard className="w-4 h-4" /> },
  ]

  return (
    <div className="max-w-2xl mx-auto px-4 pt-40 pb-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Afrekenen</h1>

      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-10">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
              step === s.key
                ? 'bg-primary text-white'
                : steps.findIndex((x) => x.key === step) > i
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-400'
            }`}>
              {steps.findIndex((x) => x.key === step) > i ? <Check className="w-4 h-4" /> : s.icon}
              {s.label}
            </div>
            {i < steps.length - 1 && <div className="w-6 h-px bg-gray-200 mx-1" />}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">{error}</div>
      )}

      {/* Step 1: Address */}
      {step === 'address' && (
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 text-lg">Bezorgadres</h2>

          {addresses.length > 0 && !showNewAddress && (
            <div className="space-y-3">
              {addresses.map((addr) => (
                <label key={addr.id} className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${
                  selectedAddressId === addr.id ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="address"
                    value={addr.id}
                    checked={selectedAddressId === addr.id}
                    onChange={() => setSelectedAddressId(addr.id)}
                    className="mt-1 accent-primary"
                  />
                  <div className="text-sm text-gray-700">
                    <p className="font-medium">{addr.firstName} {addr.lastName}</p>
                    {addr.company && <p className="text-gray-500">{addr.company}</p>}
                    <p>{addr.street} {addr.houseNumber}{addr.houseNumberAddition}</p>
                    <p>{addr.postalCode} {addr.city}</p>
                    <p>{addr.country}</p>
                    {addr.phone && <p className="text-gray-500">{addr.phone}</p>}
                  </div>
                </label>
              ))}
              <button
                type="button"
                onClick={() => setShowNewAddress(true)}
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <Plus className="w-4 h-4" /> Nieuw adres toevoegen
              </button>
            </div>
          )}

          {showNewAddress && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Voornaam *</label>
                  <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none" value={newAddr.firstName} onChange={(e) => setNewAddr({ ...newAddr, firstName: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Achternaam *</label>
                  <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none" value={newAddr.lastName} onChange={(e) => setNewAddr({ ...newAddr, lastName: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Straat *</label>
                  <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none" value={newAddr.street} onChange={(e) => setNewAddr({ ...newAddr, street: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Huisnr. *</label>
                  <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none" value={newAddr.houseNumber} onChange={(e) => setNewAddr({ ...newAddr, houseNumber: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Postcode *</label>
                  <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none" value={newAddr.postalCode} onChange={(e) => setNewAddr({ ...newAddr, postalCode: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Stad *</label>
                  <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none" value={newAddr.city} onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Telefoonnummer</label>
                <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none" value={newAddr.phone} onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })} />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleSaveNewAddress}
                  disabled={isPending}
                  className="flex-1 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                >
                  {isPending ? 'Opslaan...' : 'Adres opslaan'}
                </button>
                {addresses.length > 0 && (
                  <button type="button" onClick={() => setShowNewAddress(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
                    Annuleren
                  </button>
                )}
              </div>
            </div>
          )}

          {!showNewAddress && (
            <button
              onClick={handleProceedToReview}
              disabled={!selectedAddressId}
              className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              Doorgaan naar overzicht
            </button>
          )}
        </div>
      )}

      {/* Step 2: Review */}
      {step === 'review' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 text-lg mb-4">Bezorgadres</h2>
            {selectedAddress && (
              <div className="text-sm text-gray-700">
                <p className="font-medium">{selectedAddress.firstName} {selectedAddress.lastName}</p>
                <p>{selectedAddress.street} {selectedAddress.houseNumber}{selectedAddress.houseNumberAddition}</p>
                <p>{selectedAddress.postalCode} {selectedAddress.city}</p>
                <p>{selectedAddress.country}</p>
              </div>
            )}
            <button onClick={() => setStep('address')} className="mt-3 text-sm text-primary hover:underline">
              Wijzigen
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 text-lg mb-4">Bestelling</h2>
            {cartItems.map((item) => (
              <div key={item.id} className="py-3 border-b border-gray-100 last:border-0">
                <div className="flex justify-between items-start">
                  {item.kind === 'closet' ? (
                    <ClosetSummaryLine config={item.configuration} />
                  ) : (
                    <div>
                      <p className="font-medium text-sm text-gray-900">{item.configuration.productName}</p>
                      <p className="text-xs text-gray-500">
                        {summarizeProductLine(item.configuration)}
                        {item.quantity > 1 ? ` · ${item.quantity}×` : ''}
                      </p>
                    </div>
                  )}
                  <span className="text-sm font-medium">{fmt.format(item.priceSnapshot.total * item.quantity)}</span>
                </div>
              </div>
            ))}

            <div className="pt-4 space-y-1.5 text-sm text-gray-600">
              <div className="flex justify-between"><span>Subtotaal</span><span>{fmt.format(totals.lineSubtotal)}</span></div>
              <div className="flex justify-between"><span>Bezorging</span><span>{fmt.format(totals.delivery)}</span></div>
              {(totals.install > 0 || freeMontageTotal > 0) && (
                <div className="flex justify-between">
                  <span>Installatie</span>
                  <span>{fmt.format(totals.install > 0 ? totals.install : freeMontageTotal)}</span>
                </div>
              )}
              {freeMontageTotal > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Gratis montage</span>
                  <span>-{fmt.format(freeMontageTotal)}</span>
                </div>
              )}
              {discountAmountEur > 0 && appliedCoupon && (
                <div className="flex justify-between text-green-700">
                  <span>Korting ({appliedCoupon.code})</span>
                  <span>-{fmt.format(discountAmountEur)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-gray-900 text-base pt-2 border-t border-gray-100">
                <span>Totaal (incl. BTW)</span><span>{fmt.format(discountedTotal)}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span>Geschatte aankomst</span><span className="text-gray-700">{getDeliveryWindow(new Date())}</span>
              </div>
            </div>
          </div>

          {/* Coupon input */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 text-lg mb-4">Kortingscode</h2>
            {appliedCoupon ? (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <div className="text-sm">
                  <span className="font-medium text-green-800">{appliedCoupon.code}</span>
                  <span className="text-green-600 ml-2">-{fmt.format(discountAmountEur)}</span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  aria-label="Verwijder kortingscode"
                  className="text-green-600 hover:text-green-800 ml-3"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => { setCouponInput(e.target.value); setCouponError('') }}
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                    placeholder="Voer je code in"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={couponIsPending || !couponInput.trim()}
                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    {couponIsPending ? 'Controleren...' : 'Toepassen'}
                  </button>
                </div>
                {couponError && (
                  <p className="text-sm text-red-600">{couponError}</p>
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => setStep('payment')}
            className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
          >
            Doorgaan naar betaling
          </button>
        </div>
      )}

      {/* Step 3: Payment */}
      {step === 'payment' && (
        <div className="bg-white rounded-2xl shadow-sm p-6 text-center space-y-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <CreditCard className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Klaar voor betaling</h2>
            <p className="text-gray-500 text-sm">
              Je wordt doorgestuurd naar Stripe om je betaling veilig af te ronden.
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 text-left space-y-1.5 text-sm text-gray-600">
            {freeMontageTotal > 0 && (
              <div className="flex justify-between text-green-700">
                <span>Gratis montage</span>
                <span>-{fmt.format(freeMontageTotal)}</span>
              </div>
            )}
            {discountAmountEur > 0 && appliedCoupon && (
              <div className="flex justify-between text-green-700">
                <span>Korting ({appliedCoupon.code})</span>
                <span>-{fmt.format(discountAmountEur)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Te betalen</span>
              <span className="font-semibold text-gray-900 text-base">{fmt.format(discountedTotal)}</span>
            </div>
          </div>

          <label className="flex items-start gap-3 text-left cursor-pointer">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-0.5 w-4 h-4 shrink-0 accent-primary cursor-pointer"
            />
            <span className="text-sm text-gray-600">
              Ik ga akkoord met de <LegalDocumentList legalFilled={legalFilled} />.
            </span>
          </label>

          <button
            onClick={handleStartPayment}
            disabled={isPending || !termsAccepted}
            className="w-full py-4 bg-primary text-white rounded-xl font-semibold text-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? 'Doorsturen naar Stripe...' : `Betaal ${fmt.format(discountedTotal)}`}
          </button>

          <button onClick={() => setStep('review')} className="text-sm text-gray-500 hover:underline">
            Terug naar overzicht
          </button>
        </div>
      )}
    </div>
  )
}
