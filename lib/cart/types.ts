import type { DiagonalSide } from "@/app/(main)/(bouw-je-kast)/kledingkast/scene/diagonalUtils";

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
  doorHandleMaterial?: 'chrome' | 'black' | 'gold';
  doorsExtendToFloor?: boolean;

  // Washer slot locking
  washerSlotIndex?: number | null;
  washerLayoutId?: number | null;

  // Lighting & extras
  lightStripsEnabled: boolean;

  // Derived (snapshotted for display)
  hasTopCabinet: boolean;
  topCabinetHeightCm: number;
}

// Price calculated at "Add to Cart" time
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

  total: number; // subtotal + installationCost

  discountCode?: string;
  discountAmount?: number; // cents
  discountType?: "percent" | "fixed";
}

// One item in the cart (typically quantity=1 for custom closets)
export interface CartItem {
  id: string; // uuid
  addedAt: string; // ISO timestamp
  configuration: ClosetConfigSnapshot;
  priceSnapshot: PriceSnapshot;
  quantity: number;
  screenshotClosedUrl?: string; // base64 JPEG with doors closed, front-facing
  screenshotOpenUrl?: string;   // base64 JPEG with doors open, front-facing
}

// The full cart stored in localStorage
export interface Cart {
  version: number;
  items: CartItem[];
  updatedAt: string;
}

export const CART_VERSION = 1;
export const CART_LS_KEY = "kf-cart";
