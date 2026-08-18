import type {
  ClosetConfigSnapshot,
  ModuleSlotSnapshot,
  PriceSnapshot,
  ProductConfigSnapshot,
  ProductPriceSnapshot,
} from '@/lib/cart/types'
import type { AddressSnapshot, OrderLine } from '@/lib/order/types'

/**
 * Sample orders for previewing the confirmation mail, the admin mail and the
 * spec PDF without placing a real order. Used by `npm run preview:order-docs`.
 */

export const mod = (i: number, o: Partial<ModuleSlotSnapshot> = {}): ModuleSlotSnapshot => ({
  slotIndex: i,
  layoutId: 1,
  layoutName: 'Planken',
  layoutContents: { shelves: 3, rods: 0, drawers: 0 },
  hasDoor: true,
  span: 1,
  hasPowerHole: false,
  pushToOpen: false,
  ...o,
})

const base = {
  id: 'fixture',
  capturedAt: '2026-01-01T00:00:00.000Z',
  depthCm: 85,
  buitenkantMaterialId: 'zwart',
  binnenkantMaterialId: 'premium-wit',
  doorHandleId: 'greep-recht-160',
  doorHandleName: 'Rechte greep 160 mm',
  diagonalSide: 'none' as const,
  leftDiagStartHeight: 0,
  rightDiagStartHeight: 0,
  leftDiagTopWidth: 0,
  rightDiagTopWidth: 0,
  backDiagonal: false,
  backDiagKinkHeight: 0,
  backDiagFlatSectionDepth: 0,
  placementType: 'ingebouwd' as const,
  lightStripsEnabled: true,
  sidePanelThickness: '18mm' as const,
  hasTopCabinet: false,
  topCabinetHeightCm: 0,
}

export const kledingkast: ClosetConfigSnapshot = {
  ...base,
  productType: 'kledingkast',
  widthCm: 240,
  heightCm: 290,
  moduleCount: 4,
  hasTopCabinet: true,
  topCabinetHeightCm: 64.5,
  modules: [
    mod(0, { layoutContents: { shelves: 4, rods: 0, drawers: 0 }, hasPowerHole: true }),
    mod(1, { layoutName: 'Lades + planken', layoutContents: { shelves: 2, rods: 0, drawers: 3 } }),
    mod(2, { layoutName: 'Dubbele roede', layoutContents: { shelves: 0, rods: 2, drawers: 0 } }),
    mod(3, {
      layoutName: 'Open vak',
      hasDoor: false,
      layoutContents: { shelves: 1, rods: 1, drawers: 0 },
    }),
  ],
}

/** Dual layout: lage kast links (met wasmachine), hoge kast rechts. */
export const wasmachinekast: ClosetConfigSnapshot = {
  ...base,
  productType: 'wasmachinekast',
  widthCm: 150,
  heightCm: 240,
  moduleCount: 2,
  layout: 'low-left',
  drawerHandleId: 'none',
  drawerHandleName: 'Greeploos (push-to-open)',
  washerModules: [{ slotIndex: 0, layoutId: 11, section: 'low' }],
  modules: [
    mod(0, { layoutName: 'Planken', layoutContents: { shelves: 4, rods: 0, drawers: 0 } }),
    mod(1, { layoutName: 'Roede + plank', layoutContents: { shelves: 1, rods: 1, drawers: 0 } }),
  ],
  lowSection: {
    width: 120,
    height: 90,
    moduleCount: 2,
    topPanelThicknessMm: 36,
    countertopMaterialId: 'h1199-thermo-eik',
    modules: [
      mod(0, {
        layoutName: 'Wasmachine (enkel)',
        layoutId: 11,
        fixedWidth: 65,
        layoutContents: { shelves: 0, rods: 0, drawers: 0 },
        pushToOpen: true,
      }),
      mod(1, {
        layoutName: 'Lades',
        layoutContents: { shelves: 0, rods: 0, drawers: 2 },
        hasPowerHole: true,
      }),
    ],
  },
}

export const price = (o: Partial<PriceSnapshot> = {}): PriceSnapshot => ({
  calculatedAt: '2026-01-01T00:00:00.000Z',
  currency: 'EUR',
  moduleCost: 1800,
  doorCost: 620,
  mechanismCost: 180,
  ledCost: 120,
  powerHoleCost: 45,
  deliveryCost: 95,
  subtotal: 2860,
  installationTierName: 'Groot project',
  installationCost: 720,
  sidePanelCost: 0,
  slopedBackWallSurcharge: 0,
  slopedSideWallSurcharge: 0,
  freeMontageApplied: false,
  freeMontageDiscount: 0,
  total: 3580,
  ...o,
})

export const paxProduct: ProductConfigSnapshot = {
  id: 'p1',
  capturedAt: '2026-01-01T00:00:00.000Z',
  sanityProductId: 'pax-doors',
  productType: 'pax-doors',
  productSlug: 'pax-deuren',
  productName: 'PAX deuren',
  widthCm: 50,
  heightCm: 236,
  materialId: 'zwart',
  materialName: 'Zwart',
  doorType: 'deuren',
  doorSide: 'pair',
  depthCm: 58,
}

export const paxPrice: ProductPriceSnapshot = {
  calculatedAt: '2026-01-01T00:00:00.000Z',
  currency: 'EUR',
  unitPrice: 245,
  materialSurcharge: 30,
  deliveryCost: 95,
  total: 275,
}

export const address: AddressSnapshot = {
  firstName: 'Sam',
  lastName: 'de Vries',
  company: 'De Vries Interieur',
  street: 'Kastenlaan',
  houseNumber: '12',
  houseNumberAddition: 'B',
  postalCode: '1234 AB',
  city: 'Amsterdam',
  country: 'Nederland',
  phone: '+31 6 12345678',
}

/**
 * A capture as the configurator stores it: a `data:` URI. Real ones are ~100 KB;
 * this stand-in only has to prove the inlining path, not the byte count.
 */
export const captureDataUri =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q=='

export const items: OrderLine[] = [
  {
    kind: 'closet',
    configuration: kledingkast,
    priceSnapshot: price(),
    quantity: 1,
    screenshotClosedUrl: captureDataUri,
    screenshotOpenUrl: captureDataUri,
  },
  {
    kind: 'closet',
    configuration: wasmachinekast,
    priceSnapshot: price({
      moduleCost: 1200,
      doorCost: 380,
      subtotal: 2120,
      total: 2600,
      installationCost: 480,
      installationTierName: 'Middel project',
    }),
    quantity: 1,
  },
  { kind: 'product', configuration: paxProduct, priceSnapshot: paxPrice, quantity: 2 },
]

export const coupon = { code: 'WELKOM10', amountCents: 15000 }
