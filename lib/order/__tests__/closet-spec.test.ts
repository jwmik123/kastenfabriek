import { describe, it, expect } from "vitest";
import {
  buildPriceRows,
  buildClosetSpec,
  closetLineSubtotal,
  describeModule,
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
  it("calls a low-section front a front and a high-section one a deur", () => {
    const [low, high] = [
      resolveSections({ ...base, layout: "low-left", lowSection }).find((s) => s.key === "low")!,
      resolveSections(base)[0],
    ];
    expect(describeModule(low.modules[1])).toContain("met front");
    expect(describeModule(high.modules[0])).toContain("met deur");
  });

  it("uses singular forms for a count of one", () => {
    const section = resolveSections({
      ...base,
      modules: [mod(0, { layoutContents: { shelves: 1, rods: 1, drawers: 1 } })],
    })[0];
    expect(describeModule(section.modules[0])).toContain("1 plank");
    expect(describeModule(section.modules[0])).toContain("1 roede");
    expect(describeModule(section.modules[0])).toContain("1 lade");
  });
});
