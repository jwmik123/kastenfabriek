export interface ModuleLayoutContents {
  shelves: number;
  rods: number;
  drawers: number;
  hasWashingMachineShelf?: boolean;
  hasDesk?: boolean;
}

export interface ModuleLayout {
  layoutId: number;
  name: string;
  description: string;
  contents: ModuleLayoutContents;
  priceDouble: number;
  priceSingle: number;
  availableForTopCabinet: boolean;
}

export type AccessoryCategory = "interior" | "mechanism" | "electrical" | "upgrade";

export interface Accessory {
  id: string;
  name: string;
  nameNl?: string;
  price: number;
  category: AccessoryCategory;
  perUnit: boolean;
  maxPerCorpus?: number;
}

export type DoorVariant = "standard" | "small" | "veneer";

export interface DoorType {
  id: string;
  name: string;
  price: number;
  variant: DoorVariant;
  description?: string;
}

export interface InstallationTier {
  name: string;
  minTotal: number;
  maxTotal: number;
  price: number;
  days?: number;
  people?: number;
}

export interface LedPricing {
  basePrice: number;
  pricePerModule: number;
}

export interface DimensionConstraints {
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
  minDepth: number;
  maxDepth: number;
}

export interface TopCabinetConstraints {
  maxHeight: number;
}

export interface PricingConstraints {
  singleCorpus: DimensionConstraints;
  doubleCorpus: DimensionConstraints;
  topCabinet: TopCabinetConstraints;
}

export interface PricingConfig {
  currency: string;
  lastUpdated: string;
  led: LedPricing;
  deliveryPrice: number;
  constraints: PricingConstraints;
}

export interface FullPricingData {
  config: PricingConfig;
  modules: ModuleLayout[];
  accessories: Accessory[];
  doors: DoorType[];
  installation: InstallationTier[];
}

export type CorpusType = "single" | "double";
