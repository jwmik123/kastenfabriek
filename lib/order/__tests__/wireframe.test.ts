import { describe, it, expect } from "vitest";
import { buildWireframe, computeSlotWidthsCm } from "../wireframe";
import type { ClosetConfigSnapshot, ModuleSlotSnapshot } from "@/lib/cart/types";

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
  productType: "kledingkast",
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

const labelTexts = (c: ClosetConfigSnapshot) => buildWireframe(c).labels.map((l) => l.text);

describe("computeSlotWidthsCm", () => {
  it("shares the inner width over the variable slots", () => {
    expect(computeSlotWidthsCm([{ fixedWidthCm: null }, { fixedWidthCm: null }], 200)).toEqual([
      100, 100,
    ]);
  });

  it("keeps fixed slots at their own width and squeezes the rest", () => {
    expect(computeSlotWidthsCm([{ fixedWidthCm: 65 }, { fixedWidthCm: null }], 200)).toEqual([
      65, 135,
    ]);
  });

  it("never goes negative when the fixed slots overflow", () => {
    expect(computeSlotWidthsCm([{ fixedWidthCm: 300 }, { fixedWidthCm: null }], 200)).toEqual([
      300, 0,
    ]);
  });
});

describe("buildWireframe", () => {
  it("writes the outer size next to the lines", () => {
    expect(labelTexts(base)).toContain("200 cm");
    expect(labelTexts(base)).toContain("220 cm");
  });

  it("writes each module's clear width", () => {
    // 200 − 2 × 1.8 side walls = 196.4 inner, two slots of 98.2, minus 2 × 1.8
    // of module wall each = 94.6.
    expect(labelTexts(base)).toContain("94.6");
  });

  it("draws both sections of a dual layout side by side with a total", () => {
    const wasm: ClosetConfigSnapshot = {
      ...base,
      productType: "wasmachinekast",
      widthCm: 150,
      heightCm: 240,
      moduleCount: 1,
      modules: [mod(0)],
      layout: "low-left",
      lowSection: {
        width: 120,
        height: 90,
        moduleCount: 2,
        topPanelThicknessMm: 18,
        countertopMaterialId: "zwart",
        modules: [mod(0, { fixedWidth: 65 }), mod(1)],
      },
    };
    const drawing = buildWireframe(wasm);
    const texts = drawing.labels.map((l) => l.text);

    expect(texts).toContain("120 cm");
    expect(texts).toContain("150 cm");
    expect(texts).toContain("240 cm");
    expect(texts).toContain("90 cm");
    expect(texts).toContain("totaal 270 cm");
    // The washer keeps its 65 cm slot: 65 − 2 × 1.8 = 61.4 clear.
    expect(texts).toContain("61.4");
    // Drawing is as wide as both sections plus the margins.
    expect(drawing.viewWidth).toBe(26 + 270 + 26);
  });

  it("draws the washer drum", () => {
    const drawing = buildWireframe({
      ...base,
      productType: "wasmachinekast",
      layout: "low-only",
      heightCm: 90,
      washerModules: [{ slotIndex: 0, layoutId: 11, section: "low" }],
    });
    expect(drawing.circles).toHaveLength(1);
  });

  it("splits off a top cabinet when the cabinet is tall enough", () => {
    const tall = { ...base, heightCm: 290, hasTopCabinet: true, topCabinetHeightCm: 64.5 };
    const withTop = buildWireframe(tall);
    const withoutTop = buildWireframe(base);
    expect(withTop.lines.length).toBeGreaterThan(withoutTop.lines.length);
  });

  it("skips the slot a double-span module swallows", () => {
    const spanned = {
      ...base,
      moduleCount: 2,
      modules: [mod(0, { span: 2 }), mod(1, { layoutId: null, layoutName: null })],
    };
    // One opening dimension instead of two.
    const widths = labelTexts(spanned).filter((t) => !t.endsWith("cm"));
    expect(widths).toHaveLength(1);
    // 196.4 inner width minus 2 × 1.8 module wall.
    expect(widths[0]).toBe("192.8");
  });

  it("reports whether any interior was drawn schematically", () => {
    expect(buildWireframe(base).hasSchematicInteriors).toBe(false);
    const withContents = {
      ...base,
      modules: [mod(0, { layoutContents: { shelves: 3, rods: 0, drawers: 0 } }), mod(1)],
    };
    expect(buildWireframe(withContents).hasSchematicInteriors).toBe(true);
  });

  it("keeps every drawn coordinate inside the view box", () => {
    const drawing = buildWireframe({
      ...base,
      heightCm: 290,
      hasTopCabinet: true,
      topCabinetHeightCm: 64.5,
      modules: [mod(0, { layoutContents: { shelves: 2, rods: 1, drawers: 2 } }), mod(1)],
    });
    for (const l of drawing.lines) {
      for (const [x, y] of [
        [l.x1, l.y1],
        [l.x2, l.y2],
      ]) {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(drawing.viewWidth);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThanOrEqual(drawing.viewHeight);
      }
    }
  });
});
