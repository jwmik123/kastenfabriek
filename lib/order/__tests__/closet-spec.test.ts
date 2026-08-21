import { describe, it, expect } from "vitest";
import {
  buildPriceRows,
  buildClosetSpec,
  closetLineSubtotal,
  describeModuleRow,
  resolveClosetKind,
  resolveSections,
  summarizeCloset,
} from "../closet-spec";
import type { ClosetConfigSnapshot, ModuleSlotSnapshot, PriceSnapshot } from "@/lib/cart/types";

const mod = (i: number, o: Partial<ModuleSlotSnapshot> = {}): ModuleSlotSnapshot => ({
  slotIndex: i,
  layoutId: 1,
  layoutName: "Planken",
  hasDoor: true,
  span: 1,
  hasPowerHole: false,
  ...o,
});

const base: ClosetConfigSnapshot = {
  id: "id",
  capturedAt: "2026-01-01T00:00:00Z",
  widthCm: 200,
  heightCm: 220,
  depthCm: 60,
  moduleCount: 2,
  modules: [mod(0), mod(1)],
  buitenkantMaterialId: "zwart",
  binnenkantMaterialId: "premium-wit",
  doorHandleId: "none",
  diagonalSide: "none",
  leftDiagStartHeight: 0,
  rightDiagStartHeight: 0,
  leftDiagTopWidth: 0,
  rightDiagTopWidth: 0,
  placementType: "ingebouwd",
  lightStripsEnabled: false,
  hasTopCabinet: false,
  topCabinetHeightCm: 0,
};

const price: PriceSnapshot = {
  calculatedAt: "2026-01-01T00:00:00Z",
  currency: "EUR",
  moduleCost: 1000,
  doorCost: 200,
  mechanismCost: 50,
  ledCost: 0,
  deliveryCost: 95,
  subtotal: 1345,
  installationTierName: "Klein project",
  installationCost: 300,
  total: 1645,
};

const lowSection = {
  width: 120,
  height: 90,
  moduleCount: 2,
  topPanelThicknessMm: 36 as const,
  countertopMaterialId: "h1199-thermo-eik",
  modules: [
    mod(0, { layoutName: "Wasmachine", fixedWidth: 65, pushToOpen: true }),
    mod(1, { layoutName: "Lades", hasPowerHole: true }),
  ],
};

describe("resolveClosetKind", () => {
  it("uses productType when present", () => {
    expect(resolveClosetKind({ ...base, productType: "wasmachinekast" })).toBe("wasmachinekast");
  });

  it("recognises an old wasmachinekast by its section fields", () => {
    expect(resolveClosetKind({ ...base, layout: "low-left", lowSection })).toBe("wasmachinekast");
    expect(resolveClosetKind({ ...base, washerModules: [{ slotIndex: 0, layoutId: 11 }] })).toBe(
      "wasmachinekast",
    );
  });

  it("falls back to kledingkast", () => {
    expect(resolveClosetKind(base)).toBe("kledingkast");
  });
});

describe("resolveSections", () => {
  it("returns a single unnamed section for a kledingkast", () => {
    const sections = resolveSections(base);
    expect(sections).toHaveLength(1);
    expect(sections[0]).toMatchObject({ key: "high", label: null, moduleCount: 2 });
  });

  it("returns both sections in left-to-right order for low-left", () => {
    const sections = resolveSections({ ...base, layout: "low-left", lowSection });
    expect(sections.map((s) => s.key)).toEqual(["low", "high"]);
    expect(sections.map((s) => s.label)).toEqual(["Lage kast", "Hoge kast"]);
  });

  it("puts the high section first for low-right", () => {
    const sections = resolveSections({ ...base, layout: "low-right", lowSection });
    expect(sections.map((s) => s.key)).toEqual(["high", "low"]);
  });

  it("treats the top level as the low section in low-only", () => {
    const sections = resolveSections({
      ...base,
      layout: "low-only",
      heightCm: 90,
      lowSection: { ...lowSection, width: 200, moduleCount: 2 },
    });
    expect(sections).toHaveLength(1);
    expect(sections[0].key).toBe("low");
    expect(sections[0].countertopMaterialName).toBe("Thermo Eik Zwartbruin");
  });

  it("marks the washer slots of the section they were placed in", () => {
    const sections = resolveSections({
      ...base,
      layout: "low-left",
      lowSection,
      washerModules: [{ slotIndex: 0, layoutId: 11, section: "low" }],
    });
    const low = sections.find((s) => s.key === "low")!;
    expect(low.modules[0].isWasher).toBe(true);
    expect(low.modules[1].isWasher).toBe(false);
    expect(sections.find((s) => s.key === "high")!.modules[0].isWasher).toBe(false);
  });

  it("reads a legacy washerSection that applied to every placement", () => {
    const sections = resolveSections({
      ...base,
      layout: "low-left",
      lowSection,
      washerSection: "low",
      washerModules: [{ slotIndex: 1, layoutId: 11 }],
    });
    expect(sections.find((s) => s.key === "low")!.modules[1].isWasher).toBe(true);
  });
});

describe("summarizeCloset", () => {
  it("adds up the widths of side-by-side sections and takes the tallest", () => {
    const s = summarizeCloset({
      ...base,
      productType: "wasmachinekast",
      widthCm: 150,
      heightCm: 240,
      layout: "low-left",
      lowSection,
    });
    expect(s.totalWidthCm).toBe(270);
    expect(s.maxHeightCm).toBe(240);
    expect(s.moduleTotal).toBe(4);
    expect(s.title).toBe("Wasmachinekast — 270 × 240 × 60 cm");
  });
});

describe("buildPriceRows", () => {
  it("never includes delivery or installation — those are order-level", () => {
    const labels = buildPriceRows(base, price).map((r) => r.label);
    expect(labels).not.toContain("Bezorging");
    expect(labels.some((l) => l.startsWith("Montage"))).toBe(false);
  });

  it("adds up to the line subtotal", () => {
    const sum = buildPriceRows(base, price).reduce((t, r) => t + r.amount, 0);
    expect(sum).toBeCloseTo(closetLineSubtotal(price), 2);
  });

  it("shows kabeldoorvoer from powerHoleCost", () => {
    const p = { ...price, powerHoleCost: 45, subtotal: 1390, total: 1690 };
    const c = { ...base, modules: [mod(0, { hasPowerHole: true }), mod(1)] };
    const row = buildPriceRows(c, p).find((r) => r.label.startsWith("Kabeldoorvoer"));
    expect(row).toEqual({ label: "Kabeldoorvoer (1×)", amount: 45 });
  });

  it("recovers kabeldoorvoer from the subtotal residual on older snapshots", () => {
    // No powerHoleCost field, but the subtotal still carries the €45.
    const p = { ...price, subtotal: 1390, total: 1690 };
    const c = { ...base, modules: [mod(0, { hasPowerHole: true }), mod(1)] };
    const rows = buildPriceRows(c, p);
    expect(rows.find((r) => r.label.startsWith("Kabeldoorvoer"))?.amount).toBe(45);
    expect(rows.reduce((t, r) => t + r.amount, 0)).toBeCloseTo(closetLineSubtotal(p), 2);
  });

  it("counts sockets in both sections", () => {
    const c = { ...base, layout: "low-left" as const, lowSection };
    const p = { ...price, powerHoleCost: 45, subtotal: 1390, total: 1690 };
    expect(buildPriceRows(c, p).find((r) => r.label.startsWith("Kabeldoorvoer"))?.label).toBe(
      "Kabeldoorvoer (1×)",
    );
  });
});

describe("buildClosetSpec", () => {
  it("lists the drawer handle only when it differs from the door handle", () => {
    const same = buildClosetSpec(
      { ...base, doorHandleId: "none", drawerHandleId: "none" },
      price,
    );
    expect(same.details.find((d) => d.label === "Handgrepen")?.notes).toBeUndefined();

    const differs = buildClosetSpec(
      {
        ...base,
        doorHandleId: "greep",
        doorHandleName: "Greep",
        drawerHandleId: "none",
        drawerHandleName: "Greeploos (push-to-open)",
      },
      price,
    );
    expect(differs.details.find((d) => d.label === "Handgrepen")?.notes).toEqual([
      "Lades: Greeploos (push-to-open)",
    ]);
  });

  it("adds a Werkblad detail for a cabinet with a low section", () => {
    const spec = buildClosetSpec({ ...base, layout: "low-left", lowSection }, price);
    const werkblad = spec.details.find((d) => d.label === "Werkblad");
    expect(werkblad?.value).toBe("Thermo Eik Zwartbruin");
    expect(werkblad?.notes).toEqual(["Dikte: 36 mm"]);
  });

  it("has no Werkblad for a kledingkast", () => {
    const spec = buildClosetSpec(base, price);
    expect(spec.details.find((d) => d.label === "Werkblad")).toBeUndefined();
  });
});

describe("describeModule", () => {
  it("uses singular forms for a count of one", () => {
    const section = resolveSections({
      ...base,
      modules: [mod(0, { layoutContents: { shelves: 1, rods: 1, drawers: 1 } })],
    })[0];
    const row = describeModuleRow(section.modules[0]);
    expect(row.description).toContain("1 plank");
    expect(row.description).toContain("1 roede");
    expect(row.description).toContain("1 lade");
  });
});

describe("describeModuleRow", () => {
  const rowFor = (o: Partial<ModuleSlotSnapshot>, section: "high" | "low" = "high") => {
    const c: ClosetConfigSnapshot =
      section === "low"
        ? { ...base, layout: "low-left", lowSection: { ...lowSection, modules: [mod(0, o)] } }
        : { ...base, modules: [mod(0, o)] };
    const spec = resolveSections(c).find((s) => s.key === section)!;
    return describeModuleRow(spec.modules[0]);
  };

  it("keeps the position and the layout id apart", () => {
    const row = rowFor({ slotIndex: 0, layoutId: 11 });
    expect(row.position).toBe(1);
    expect(row.layoutId).toBe(11);
  });

  it("carries the layout's own name and description", () => {
    const row = rowFor({ layoutId: 3, layoutName: "Dubbele roede", layoutDescription: "Twee roeden boven elkaar" });
    expect(row.name).toBe("Dubbele roede");
    expect(row.description).toContain("Twee roeden boven elkaar");
  });

  it("falls back to the configurator's description on older snapshots", () => {
    // Layout 11 is the wasmachinekast's single-washer module.
    const row = rowFor({ layoutId: 11, layoutDescription: undefined });
    expect(row.description).toContain("wasmachine");
  });

  it("calls out push-to-open on the module that has it", () => {
    expect(rowFor({ pushToOpen: true }).execution).toContain("push-to-open");
    expect(rowFor({ pushToOpen: false }).execution).not.toContain("push-to-open");
  });

  it("lists accessories separately from how the module is built", () => {
    const row = rowFor({ hasPowerHole: true });
    expect(row.accessories).toBe("kabeldoorvoer");
    expect(row.execution).not.toContain("kabeldoorvoer");
  });

  it("says front in a lage kast and deur in a hoge kast", () => {
    expect(rowFor({}, "low").execution).toContain("met front");
    expect(rowFor({}).execution).toContain("met deur");
  });

  it("names an empty slot instead of leaving it blank", () => {
    expect(rowFor({ layoutId: null, layoutName: null }).name).toBe("— leeg —");
  });
});

// ---------------------------------------------------------------------------
// LED strips
// ---------------------------------------------------------------------------

/**
 * LED is a wasmachinekast option too. It has to survive the whole way: the
 * store writes it to the snapshot, the price snapshot carries its cost, and
 * both the mail and the PDF read those through this module.
 */
describe("LED strips reach the order documents", () => {
  const wasmWithLed: ClosetConfigSnapshot = {
    ...base,
    productType: "wasmachinekast",
    layout: "low-left",
    lowSection,
    lightStripsEnabled: true,
  };

  it("lists LED strips among the extras", () => {
    const spec = buildClosetSpec(wasmWithLed, price);
    expect(spec.extras).toContain("LED-strips");
  });

  it("keeps them out of the extras when they were not ordered", () => {
    const spec = buildClosetSpec({ ...wasmWithLed, lightStripsEnabled: false }, price);
    expect(spec.extras).not.toContain("LED-strips");
  });

  it("gives them their own price row", () => {
    const withLed = { ...price, ledCost: 120, subtotal: price.subtotal + 120, total: price.total + 120 };
    const rows = buildPriceRows(wasmWithLed, withLed);
    expect(rows.find((r) => r.label === "LED-strips")?.amount).toBe(120);
  });

  it("still adds up to the line subtotal with LED in it", () => {
    const withLed = { ...price, ledCost: 120, subtotal: price.subtotal + 120, total: price.total + 120 };
    const sum = buildPriceRows(wasmWithLed, withLed).reduce((t, r) => t + r.amount, 0);
    expect(sum).toBeCloseTo(closetLineSubtotal(withLed), 2);
  });

  it("shows no price row for a low-only cabinet, which cannot carry them", () => {
    // The store switches the toggle off when the layout becomes low-only, so
    // the snapshot never claims lighting the cabinet does not have.
    const lowOnly = { ...wasmWithLed, layout: "low-only" as const, lightStripsEnabled: false };
    expect(buildClosetSpec(lowOnly, price).extras).not.toContain("LED-strips");
    expect(buildPriceRows(lowOnly, price).find((r) => r.label === "LED-strips")).toBeUndefined();
  });
});
