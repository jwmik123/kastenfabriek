import type {
  FullPricingData,
  ModuleLayout,
  DoorVariant,
  CorpusType,
  Accessory,
  InstallationTier,
  HandleType,
  SectionType,
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

const warnedMissingModules = new Set<number>();

function warnMissingModuleOnce(layoutId: number): void {
  if (warnedMissingModules.has(layoutId)) return;
  warnedMissingModules.add(layoutId);
  console.error(
    `[pricing] Module layout ${layoutId} has no moduleLayout document — priced at 0.`,
  );
}

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

  /**
   * The catalogue document for a layout, for the section it is placed in.
   *
   * A layoutId is not unique: the same interior exists as a high and a low
   * module, priced apart (layout 14 is the standing example). Matching on the
   * id alone hands out whichever document the query happened to return first,
   * so a wasmachinekast could price its low modules at high-module rates. Pass
   * the section and the document for that section wins; a shared ("both") or
   * unmarked document is the fallback, and only then the first one found.
   */
  getModule(layoutId: number, section?: SectionType): ModuleLayout | undefined {
    const candidates = this.data.modules.filter((m) => m.layoutId === layoutId);
    if (candidates.length <= 1 || !section) return candidates[0];
    return (
      candidates.find((m) => m.sectionType === section) ??
      candidates.find((m) => m.sectionType === "both" || m.sectionType == null) ??
      candidates[0]
    );
  }

  /**
   * Price of a module, or 0 when the catalogue has no document for it.
   *
   * A configurator cannot crash over one unknown layout, but a layout silently
   * costing nothing is how an unpriced module ends up free in a quote — so the
   * gap is logged, once per layout, rather than swallowed by the caller.
   */
  getModulePrice(layoutId: number, type: CorpusType, section?: SectionType): number {
    const layout = this.getModule(layoutId, section);
    if (!layout) {
      warnMissingModuleOnce(layoutId);
      return 0;
    }
    return type === "double" ? layout.priceDouble : layout.priceSingle;
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
