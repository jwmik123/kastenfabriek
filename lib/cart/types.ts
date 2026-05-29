import type { DiagonalSide } from "@/app/(configurator)/kledingkast/scene/diagonalUtils";
import type { HandleMaterial } from "@/app/(configurator)/_shared/constants/handleMaterials";

// Snapshot of a single module slot at cart time
export interface ModuleSlotSnapshot {
  slotIndex: number;
  layoutId: number | null;
  layoutName: string | null; // snapshot of name from Sanity
  hasDoor: boolean;
  span: 1 | 2;
  buitenkantMaterialId?: string;
  binnenkantMaterialId?: string;
  hasPowerHole?: boolean;
}

// Wasmachinekast sections (issue 075/076).
// Kledingkast snapshots leave these undefined; wasmachinekast writes them.
export type WasmLayout = 'high-only' | 'low-only' | 'low-left' | 'low-right';
export type WasherSection = 'high' | 'low' | null;

export interface LowSectionSnapshot {
  width: number;
  height: number;
  moduleCount: number;
  modules: ModuleSlotSnapshot[];
  topPanelThicknessMm: 18 | 36;
  countertopMaterialId: string;
}

// Serialized closet configuration — mirrors relevant Zustand store state
export interface ClosetConfigSnapshot {
  id: string; // uuid generated at cart time
  capturedAt: string; // ISO timestamp

  // Dimensions (cm)
  widthCm: number;
  heightCm: number;
  depthCm: number;

  // Module layout
  moduleCount: number;
  modules: ModuleSlotSnapshot[];

  // Appearance
  buitenkantMaterialId: string;
  binnenkantMaterialId: string;
  doorHandleId: string;
  doorHandleName?: string | null;

  // Diagonal walls
  diagonalSide: DiagonalSide;
  leftDiagStartHeight: number;
  rightDiagStartHeight: number;
  leftDiagTopWidth: number;   // horizontal reach of left diagonal in cm
  rightDiagTopWidth: number;  // horizontal reach of right diagonal in cm
  /** @deprecated use leftDiagTopWidth / rightDiagTopWidth */
  diagTopWidth?: number;

  // Placement type
  placementType?: 'vrijstaand' | 'ingebouwd';

  // Back diagonal
  backDiagonal?: boolean;
  backDiagKinkHeight?: number;    // cm
  backDiagFlatSectionDepth?: number;  // cm

  // Appearance extras
  doorHandleMaterial?: HandleMaterial;
  doorsExtendToFloor?: boolean;

  // Washer modules
  washerModules?: { slotIndex: number; layoutId: number }[];

  // Wasmachinekast sections (issue 076). Optional — kledingkast ignores.
  // When `layout` is absent, top-level width/height/moduleCount/modules are
  // interpreted as the high section and layout defaults to 'high-only'.
  layout?: WasmLayout;
  lowSection?: LowSectionSnapshot;
  washerSection?: WasherSection;

  // Lighting & extras
  lightStripsEnabled: boolean;

  // Side panels thickness (issue 072). 18mm = default, 36mm = paid upgrade.
  sidePanelThickness?: '18mm' | '36mm';

  // Derived (snapshotted for display)
  hasTopCabinet: boolean;
  topCabinetHeightCm: number;
}

// Serialized non-configurator product line (e.g. PAX doors)
export interface ProductConfigSnapshot {
  id: string; // uuid generated at cart time
  capturedAt: string; // ISO timestamp

  sanityProductId: string;
  productType: string; // e.g. 'pax-doors'
  productSlug: string;
  productName: string;

  widthCm: number;
  heightCm: number;
  materialId: string;
  materialName: string;
}

// Price calculated at "Add to Cart" time for a closet
export interface PriceSnapshot {
  calculatedAt: string; // ISO timestamp
  currency: "EUR";

  moduleCost: number; // sum of module layout prices
  doorCost: number; // all door panel costs (main + top cabinet)
  mechanismCost: number; // handles or push-to-open
  ledCost: number; // 0 unless LED enabled
  deliveryCost: number; // €95 flat
  subtotal: number; // all of the above combined

  installationTierName: string | null; // e.g. "Groot project"
  installationCost: number; // €720 | €1440 | €2160

  // Sloped-wall surcharges (issue 069). Optional for back-compat with old cart entries.
  slopedBackWallSurcharge?: number;
  slopedSideWallSurcharge?: number; // already multiplied: left/right = ×1, both = ×2

  // Side panels accessory cost (issue 072). Optional for back-compat.
  sidePanelCost?: number;

  freeMontageApplied?: boolean;
  freeMontageDiscount?: number;

  total: number; // subtotal + installationCost

  discountCode?: string;
  discountAmount?: number; // cents
  discountType?: "percent" | "fixed";
}

// Price snapshot for a non-configurator product line (e.g. PAX doors)
export interface ProductPriceSnapshot {
  calculatedAt: string; // ISO timestamp
  currency: "EUR";

  unitPrice: number;
  materialSurcharge: number;
  deliveryCost: number;
  total: number; // unitPrice + materialSurcharge (excludes delivery)

  discountCode?: string;
  discountAmount?: number;
  discountType?: "percent" | "fixed";
}

interface BaseCartItem {
  id: string; // uuid
  addedAt: string; // ISO timestamp
  quantity: number;
  screenshotClosedUrl?: string;
  screenshotOpenUrl?: string;
}

export interface ClosetCartItem extends BaseCartItem {
  kind: 'closet';
  configuration: ClosetConfigSnapshot;
  priceSnapshot: PriceSnapshot;
}

export interface ProductCartItem extends BaseCartItem {
  kind: 'product';
  configuration: ProductConfigSnapshot;
  priceSnapshot: ProductPriceSnapshot;
}

export type CartItem = ClosetCartItem | ProductCartItem;

// The full cart stored in localStorage
export interface Cart {
  version: number;
  items: CartItem[];
  updatedAt: string;
}

export const CART_VERSION = 2;
export const CART_LS_KEY = "kf-cart";
