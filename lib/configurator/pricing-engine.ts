import type {
  FullPricingData,
  ModuleLayout,
  DoorVariant,
  CorpusType,
  Accessory,
  InstallationTier,
  HandleType,
} from "@/types/configurator-pricing";

export type DiagonalSideValue = "none" | "left" | "right" | "both";

export interface SlopeSnapshot {
  backDiagonal?: boolean | null;
  diagonalSide?: DiagonalSideValue | null;
}

export interface SurchargeBreakdown {
  slopedBackWallSurcharge: number;
  slopedSideWallSurcharge: number;
  total: number;
}

export const DEFAULT_SLOPED_BACK_WALL_SURCHARGE = 1100;
export const DEFAULT_SLOPED_SIDE_WALL_SURCHARGE_PER_SIDE = 1100;

export class PricingEngine {
  constructor(private data: FullPricingData) {}

  get slopedBackWallSurcharge(): number {
    return (
      this.data.config.slopedBackWallSurcharge ??
      DEFAULT_SLOPED_BACK_WALL_SURCHARGE
    );
  }

  get slopedSideWallSurchargePerSide(): number {
    return (
      this.data.config.slopedSideWallSurchargePerSide ??
      DEFAULT_SLOPED_SIDE_WALL_SURCHARGE_PER_SIDE
    );
  }

  calculateSurchargesFromSnapshot(snapshot: SlopeSnapshot): SurchargeBreakdown {
    const slopedBackWallSurcharge = snapshot.backDiagonal
      ? this.slopedBackWallSurcharge
      : 0;
    const side = snapshot.diagonalSide ?? "none";
    const sideCount = side === "both" ? 2 : side === "left" || side === "right" ? 1 : 0;
    const slopedSideWallSurcharge =
      sideCount * this.slopedSideWallSurchargePerSide;
    return {
      slopedBackWallSurcharge,
      slopedSideWallSurcharge,
      total: slopedBackWallSurcharge + slopedSideWallSurcharge,
    };
  }

  getModule(layoutId: number): ModuleLayout | undefined {
    return this.data.modules.find((m) => m.layoutId === layoutId);
  }

  getModulePrice(layoutId: number, type: CorpusType): number {
    const module = this.getModule(layoutId);
    if (!module) {
      throw new Error(`Module layout ${layoutId} not found`);
    }
    return type === "double" ? module.priceDouble : module.priceSingle;
  }

  getDoor(variant: DoorVariant): Accessory | undefined {
    return this.data.doors.find((d) => d.variant === variant) as unknown as Accessory;
  }

  getDoorPrice(variant: DoorVariant): number {
    const door = this.data.doors.find((d) => d.variant === variant);
    return door?.price ?? 0;
  }

  getAccessory(accessoryId: string): Accessory | undefined {
    return this.data.accessories.find((a) => a.id === accessoryId);
  }

  getAccessoryPrice(accessoryId: string): number {
    const accessory = this.getAccessory(accessoryId);
    return accessory?.price ?? 0;
  }

  calculateLedPrice(moduleCount: number): number {
    if (moduleCount === 0) return 0;
    const { basePrice, pricePerModule } = this.data.config.led;
    return basePrice + pricePerModule * moduleCount;
  }

  getHandle(handleId: string): HandleType | undefined {
    return this.data.handles.find((h) => h.id === handleId);
  }

  getHandlePrice(handleId: string): number {
    if (handleId === "none") return this.getAccessoryPrice("push-to-open");
    return this.getHandle(handleId)?.price ?? 0;
  }

  getInstallationTier(subtotal: number): InstallationTier | undefined {
    return this.data.installation.find(
      (t) => subtotal >= t.minTotal && subtotal < t.maxTotal
    );
  }

  getInstallationPrice(subtotal: number): number {
    const tier = this.getInstallationTier(subtotal);
    return tier?.price ?? 0;
  }

  get deliveryPrice(): number {
    return this.data.config.deliveryPrice;
  }

  get constraints() {
    return this.data.config.constraints;
  }

  get ledPricing() {
    return this.data.config.led;
  }

  validateCorpusWidth(width: number, type: CorpusType): boolean {
    const constraints =
      type === "single"
        ? this.data.config.constraints.singleCorpus
        : this.data.config.constraints.doubleCorpus;
    return width >= constraints.minWidth && width <= constraints.maxWidth;
  }

  validateCorpusHeight(height: number, type: CorpusType): boolean {
    const constraints =
      type === "single"
        ? this.data.config.constraints.singleCorpus
        : this.data.config.constraints.doubleCorpus;
    return height >= constraints.minHeight && height <= constraints.maxHeight;
  }

  validateCorpusDepth(depth: number, type: CorpusType): boolean {
    const constraints =
      type === "single"
        ? this.data.config.constraints.singleCorpus
        : this.data.config.constraints.doubleCorpus;
    return depth >= constraints.minDepth && depth <= constraints.maxDepth;
  }

  validateTopCabinetHeight(height: number): boolean {
    return height <= this.data.config.constraints.topCabinet.maxHeight;
  }

  determineCorpusType(width: number): CorpusType {
    const { singleCorpus, doubleCorpus } = this.data.config.constraints;
    if (width <= singleCorpus.maxWidth) {
      return "single";
    }
    if (width >= doubleCorpus.minWidth) {
      return "double";
    }
    return "single";
  }
}
