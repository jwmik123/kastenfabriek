import { MATERIALS } from "@/app/(configurator)/kledingkast/materials";
import type {
  ClosetConfigSnapshot,
  ClosetProductType,
  ModuleSlotSnapshot,
  PriceSnapshot,
} from "@/lib/cart/types";

/**
 * One normalized description of an ordered closet, shared by the confirmation
 * email, the admin email, the spec PDF and the order page.
 *
 * Everything downstream reads *this* rather than the raw snapshot, so a
 * wasmachinekast's low section can no longer be silently dropped by one
 * renderer while another shows it.
 */

// ---------------------------------------------------------------------------
// Kind
// ---------------------------------------------------------------------------

export const CLOSET_TYPE_LABELS: Record<ClosetProductType, string> = {
  kledingkast: "Kledingkast",
  wasmachinekast: "Wasmachinekast",
};

/**
 * Which configurator a snapshot came from. Entries written before
 * `productType` existed are recognised by the wasmachinekast-only fields; a
 * legacy `high-only` wasmachinekast is indistinguishable from a kledingkast and
 * falls back to kledingkast.
 */
export function resolveClosetKind(c: ClosetConfigSnapshot): ClosetProductType {
  if (c.productType) return c.productType;
  if (c.layout || c.lowSection || c.washerModules?.length) return "wasmachinekast";
  return "kledingkast";
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

export interface SpecModule {
  /** Which section the module sits in — a lage kast has fronts, not doors. */
  section: "high" | "low";
  slotIndex: number;
  /** 1-based position as shown to the customer. */
  position: number;
  layoutName: string | null;
  contents: { shelves: number; rods: number; drawers: number } | null;
  hasDoor: boolean;
  span: 1 | 2;
  pushToOpen: boolean;
  hasPowerHole: boolean;
  isWasher: boolean;
  /** cm, when this slot has a fixed width (washer). */
  fixedWidthCm: number | null;
}

export interface SpecSection {
  key: "high" | "low";
  /** Null when the cabinet has only one section — no need to name it. */
  label: string | null;
  widthCm: number;
  heightCm: number;
  moduleCount: number;
  modules: SpecModule[];
  /** Lage kast only. */
  topPanelThicknessMm?: 18 | 36;
  countertopMaterialName?: string;
}

const SECTION_LABELS: Record<"high" | "low", string> = {
  high: "Hoge kast",
  low: "Lage kast",
};

export const WASM_LAYOUT_LABELS: Record<string, string> = {
  "high-only": "Eén hoge kast",
  "low-only": "Eén lage kast",
  "low-left": "Lage kast links + hoge kast rechts",
  "low-right": "Hoge kast links + lage kast rechts",
};

function toSpecModule(
  m: ModuleSlotSnapshot,
  washerSlots: Set<number>,
  section: "high" | "low",
): SpecModule {
  return {
    section,
    slotIndex: m.slotIndex,
    position: m.slotIndex + 1,
    layoutName: m.layoutName,
    contents: m.layoutContents ?? null,
    hasDoor: m.hasDoor,
    span: m.span,
    pushToOpen: m.pushToOpen ?? false,
    hasPowerHole: m.hasPowerHole ?? false,
    isWasher: washerSlots.has(m.slotIndex),
    fixedWidthCm: m.fixedWidth ?? null,
  };
}

/**
 * Resolve a snapshot into the sections it actually consists of, left to right.
 *
 * The wasmachinekast store keeps the HIGH section in the top-level
 * width/height/modules fields — except in `low-only`, where the top level *is*
 * the low section. Mirrors the resolution in WasmMeasurements/WasmachinekastScene.
 */
export function resolveSections(c: ClosetConfigSnapshot): SpecSection[] {
  const layout = c.layout;
  // Placements written before washers could sit in both sections carry no
  // `section`; back then the whole set lived in `washerSection`. Same fallback
  // chain as the configurator's snapshot migration.
  const legacySection = c.washerSection ?? (layout === "low-only" ? "low" : "high");
  const washersIn = (section: "high" | "low") =>
    new Set(
      (c.washerModules ?? [])
        .filter((w) => (w.section ?? legacySection) === section)
        .map((w) => w.slotIndex),
    );

  const topLevelKey: "high" | "low" = layout === "low-only" ? "low" : "high";
  const topLevel: SpecSection = {
    key: topLevelKey,
    label: null,
    widthCm: c.widthCm,
    heightCm: c.heightCm,
    moduleCount: c.moduleCount,
    modules: c.modules.map((m) => toSpecModule(m, washersIn(topLevelKey), topLevelKey)),
  };

  // Kledingkast, and wasmachinekast snapshots from before sections existed.
  if (!layout || layout === "high-only") return [topLevel];

  if (layout === "low-only") {
    const low = c.lowSection;
    return [
      {
        ...topLevel,
        topPanelThicknessMm: low?.topPanelThicknessMm,
        countertopMaterialName: low
          ? getMaterialName(low.countertopMaterialId)
          : undefined,
      },
    ];
  }

  // Dual layouts: both sections exist and sit side by side.
  const low = c.lowSection;
  const lowSpec: SpecSection | null = low
    ? {
        key: "low",
        label: SECTION_LABELS.low,
        widthCm: low.width,
        heightCm: low.height,
        moduleCount: low.moduleCount,
        modules: low.modules.map((m) => toSpecModule(m, washersIn("low"), "low")),
        topPanelThicknessMm: low.topPanelThicknessMm,
        countertopMaterialName: getMaterialName(low.countertopMaterialId),
      }
    : null;

  const highSpec: SpecSection = { ...topLevel, label: SECTION_LABELS.high };
  if (!lowSpec) return [highSpec];
  return layout === "low-left" ? [lowSpec, highSpec] : [highSpec, lowSpec];
}

// ---------------------------------------------------------------------------
// Price rows
// ---------------------------------------------------------------------------

export interface SpecPriceRow {
  label: string;
  /** Euros. */
  amount: number;
}

/**
 * The per-line cost rows, in euros. Delivery, installation and any coupon are
 * deliberately absent — those are order-level and are summed once by
 * `buildOrderSummary`, so a two-cabinet order no longer shows delivery twice.
 *
 * Kabeldoorvoeren are read from `powerHoleCost`, falling back to whatever the
 * subtotal has left over on snapshots written before that field existed. That
 * residual guarantees the rows always add up to the line subtotal.
 */
export function buildPriceRows(
  c: ClosetConfigSnapshot,
  p: PriceSnapshot,
): SpecPriceRow[] {
  const named =
    p.moduleCost +
    p.doorCost +
    p.mechanismCost +
    p.ledCost +
    (p.slopedBackWallSurcharge ?? 0) +
    (p.slopedSideWallSurcharge ?? 0) +
    (p.sidePanelCost ?? 0);
  const residual = round2(p.subtotal - p.deliveryCost - named);
  const powerHoleCost = p.powerHoleCost ?? Math.max(0, residual);
  const powerHoleCount = countPowerHoles(c);

  const rows: (SpecPriceRow | null)[] = [
    { label: "Modules & interieur", amount: p.moduleCost },
    p.doorCost > 0 ? { label: "Deuren & fronten", amount: p.doorCost } : null,
    p.mechanismCost > 0 ? { label: "Handgrepen", amount: p.mechanismCost } : null,
    p.ledCost > 0 ? { label: "LED-strips", amount: p.ledCost } : null,
    powerHoleCost > 0
      ? {
          label: powerHoleCount > 0 ? `Kabeldoorvoer (${powerHoleCount}×)` : "Kabeldoorvoer",
          amount: powerHoleCost,
        }
      : null,
    (p.slopedBackWallSurcharge ?? 0) > 0
      ? { label: "Schuine achterwand", amount: p.slopedBackWallSurcharge! }
      : null,
    (p.slopedSideWallSurcharge ?? 0) > 0
      ? {
          label: `Schuine zijwand${c.diagonalSide === "both" ? " (×2)" : ""}`,
          amount: p.slopedSideWallSurcharge!,
        }
      : null,
    (p.sidePanelCost ?? 0) > 0
      ? { label: "Zijpanelen 36 mm (upgrade)", amount: p.sidePanelCost! }
      : null,
  ];

  return rows.filter((r): r is SpecPriceRow => r !== null);
}

/** Line subtotal in euros, excluding delivery and installation. */
export function closetLineSubtotal(p: PriceSnapshot): number {
  return round2(p.total - p.deliveryCost - p.installationCost);
}

// ---------------------------------------------------------------------------
// Full spec
// ---------------------------------------------------------------------------

export interface SpecDetail {
  label: string;
  value: string;
  /** Extra lines rendered smaller underneath the value. */
  notes?: string[];
}

export interface ClosetSpec {
  kind: ClosetProductType;
  /** e.g. "Wasmachinekast" */
  typeLabel: string;
  /** e.g. "Wasmachinekast — 180 × 240 × 85 cm" */
  title: string;
  totalWidthCm: number;
  maxHeightCm: number;
  depthCm: number;
  sections: SpecSection[];
  details: SpecDetail[];
  extras: string[];
  priceRows: SpecPriceRow[];
  subtotal: number;
}

export function getMaterialName(id: string): string {
  return MATERIALS.find((m) => m.id === id)?.name ?? id;
}

/** Counts every section, so low-section sockets are no longer missed. */
function countPowerHoles(c: ClosetConfigSnapshot, sections = resolveSections(c)): number {
  return sections.reduce(
    (sum, s) => sum + s.modules.filter((m) => m.hasPowerHole).length,
    0,
  );
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

export interface ClosetHeadline {
  kind: ClosetProductType;
  typeLabel: string;
  /** e.g. "Wasmachinekast — 270 × 240 × 85 cm" */
  title: string;
  sections: SpecSection[];
  totalWidthCm: number;
  maxHeightCm: number;
  /** Modules across every section, not just the top-level one. */
  moduleTotal: number;
}

/**
 * Name and outer size of a closet, without needing its price. Used wherever a
 * configuration is listed compactly (cart, wishlist, checkout) so those pages
 * name a wasmachinekast correctly and count both of its sections.
 *
 * Dual layouts stand side by side, so the footprint is the sum of the section
 * widths and the tallest section sets the height.
 */
export function summarizeCloset(c: ClosetConfigSnapshot): ClosetHeadline {
  const kind = resolveClosetKind(c);
  const typeLabel = CLOSET_TYPE_LABELS[kind];
  const sections = resolveSections(c);
  const totalWidthCm = sections.reduce((sum, s) => sum + s.widthCm, 0);
  const maxHeightCm = sections.reduce((max, s) => Math.max(max, s.heightCm), 0);

  return {
    kind,
    typeLabel,
    title: `${typeLabel} — ${totalWidthCm} × ${maxHeightCm} × ${c.depthCm} cm`,
    sections,
    totalWidthCm,
    maxHeightCm,
    moduleTotal: sections.reduce((sum, s) => sum + s.moduleCount, 0),
  };
}

export function buildClosetSpec(
  c: ClosetConfigSnapshot,
  p: PriceSnapshot,
): ClosetSpec {
  const { kind, typeLabel, sections, title, totalWidthCm, maxHeightCm } =
    summarizeCloset(c);

  const details: SpecDetail[] = [
    {
      label: "Afmetingen",
      value: `${totalWidthCm} × ${maxHeightCm} × ${c.depthCm} cm (b × h × d)`,
      notes:
        sections.length > 1
          ? sections.map(
              (s) =>
                `${s.label}: ${s.widthCm} × ${s.heightCm} cm · ${plural(s.moduleCount, "module", "modules")}`,
            )
          : undefined,
    },
    {
      label: "Plaatsing",
      value: c.placementType === "vrijstaand" ? "Vrijstaand" : "Ingebouwd",
    },
    {
      label: "Materialen",
      value: `Buiten: ${getMaterialName(c.buitenkantMaterialId)}`,
      notes: [`Binnen: ${getMaterialName(c.binnenkantMaterialId)}`],
    },
  ];

  if (c.layout) {
    details.splice(1, 0, {
      label: "Opstelling",
      value: WASM_LAYOUT_LABELS[c.layout] ?? c.layout,
    });
  }

  const handleNotes: string[] = [];
  if (c.drawerHandleId && c.drawerHandleId !== c.doorHandleId) {
    handleNotes.push(`Lades: ${handleLabel(c.drawerHandleId, c.drawerHandleName)}`);
  }
  const countertop = sections.find((s) => s.countertopMaterialName);
  details.push({
    label: "Handgrepen",
    value: handleLabel(c.doorHandleId, c.doorHandleName),
    notes: handleNotes.length > 0 ? handleNotes : undefined,
  });

  if (countertop) {
    details.push({
      label: "Werkblad",
      value: countertop.countertopMaterialName!,
      notes: countertop.topPanelThicknessMm
        ? [`Dikte: ${countertop.topPanelThicknessMm} mm`]
        : undefined,
    });
  }

  const powerHoleCount = countPowerHoles(c, sections);
  const extras = [
    c.lightStripsEnabled ? "LED-strips" : null,
    powerHoleCount > 0 ? `Kabeldoorvoer (${powerHoleCount}×)` : null,
    (c.sidePanelThickness ?? "18mm") === "36mm" ? "Zijpanelen 36 mm (upgrade)" : null,
    c.hasTopCabinet ? `Bovenkast (${c.topCabinetHeightCm} cm)` : null,
    c.doorsExtendToFloor ? "Deuren doorlopend tot de vloer" : null,
    c.diagonalSide !== "none" ? `Schuine zijwand ${diagonalLabel(c.diagonalSide)}` : null,
    c.backDiagonal ? "Schuine achterwand" : null,
  ].filter((v): v is string => v !== null);

  return {
    kind,
    typeLabel,
    title,
    totalWidthCm,
    maxHeightCm,
    depthCm: c.depthCm,
    sections,
    details,
    extras,
    priceRows: buildPriceRows(c, p),
    subtotal: closetLineSubtotal(p),
  };
}

function handleLabel(id: string, name: string | null | undefined): string {
  if (name) return name;
  return id === "none" ? "Greeploos (push-to-open)" : id;
}

function diagonalLabel(side: string): string {
  if (side === "left") return "links";
  if (side === "right") return "rechts";
  if (side === "both") return "links en rechts";
  return side;
}

/** One-line description of a module for spec lists. */
export function describeModule(m: SpecModule): string {
  const front = m.section === "low" ? "front" : "deur";
  const parts: string[] = [];
  if (m.span === 2) parts.push("dubbel");
  if (m.isWasher) parts.push("wasmachine");
  if (m.fixedWidthCm) parts.push(`${m.fixedWidthCm} cm breed`);
  if (m.hasDoor) parts.push(m.pushToOpen ? `${front} push-to-open` : `met ${front}`);
  else parts.push("open");
  if (m.hasPowerHole) parts.push("kabeldoorvoer");
  if (m.contents) {
    if (m.contents.shelves > 0) parts.push(plural(m.contents.shelves, "plank", "planken"));
    if (m.contents.rods > 0) parts.push(plural(m.contents.rods, "roede", "roeden"));
    if (m.contents.drawers > 0) parts.push(plural(m.contents.drawers, "lade", "lades"));
  }
  return parts.join(" · ");
}
