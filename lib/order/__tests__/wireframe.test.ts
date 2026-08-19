import { describe, it, expect } from "vitest";
import { buildWireframe, computeSlotWidthsCm } from "../wireframe";
import type { ClosetConfigSnapshot, ModuleSlotSnapshot } from "@/lib/cart/types";
import { computeSlotWidthsM } from "@/app/(configurator)/_shared/store/slotWidths";
import { MODULE_WALL, WALL } from "@/app/(configurator)/kledingkast/scene/closetConstants";
import { resolveSections } from "@/lib/order/closet-spec";

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
    // Drawing is as wide as both sections plus the margins, which scale with
    // the label height rather than being fixed.
    expect(drawing.viewWidth).toBeGreaterThan(270);
    expect(drawing.viewWidth - 270).toBeLessThan(60);
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

// ---------------------------------------------------------------------------
// Agreement with the 3D scene
// ---------------------------------------------------------------------------

/**
 * The drawing is a production document, so its module widths have to be the
 * same numbers the scene builds the cabinet from — not a re-derivation that
 * happens to look close.
 */
describe("module widths agree with the scene's own slot maths", () => {
  /** ORD-20260819-WYS1: low-right, 36 mm side panels, washers in both sections. */
  const order: ClosetConfigSnapshot = {
    ...base,
    productType: "wasmachinekast",
    sidePanelThickness: "36mm",
    layout: "low-right",
    widthCm: 281,
    heightCm: 240,
    moduleCount: 5,
    washerModules: [
      { slotIndex: 0, layoutId: 11, section: "high" },
      { slotIndex: 1, layoutId: 11, section: "high" },
      { slotIndex: 3, layoutId: 23, section: "low" },
    ],
    modules: [
      mod(0, { fixedWidth: 68.6 }),
      mod(1, { fixedWidth: 68.6 }),
      mod(2),
      mod(3),
      mod(4),
    ],
    lowSection: {
      width: 261,
      height: 90,
      moduleCount: 5,
      topPanelThicknessMm: 36,
      countertopMaterialId: "zwart",
      modules: [mod(0), mod(1), mod(2), mod(3, { fixedWidth: 68.6 }), mod(4)],
    },
  };

  /** What the scene itself would compute, via its own helper. */
  function sceneClearWidths(c: ClosetConfigSnapshot): string[] {
    const sideWallM = c.sidePanelThickness === "36mm" ? 0.036 : WALL;
    const sections = resolveSections(c);
    const seam = sections.length > 1 ? (c.layout === "low-left" ? "right" : "left") : null;
    const out: string[] = [];
    for (const s of sections) {
      const shares = s.key === "low" ? seam : null;
      const innerW =
        s.widthCm / 100 -
        (shares === "left" ? 0 : sideWallM) -
        (shares === "right" ? 0 : sideWallM);
      const slots = computeSlotWidthsM(
        s.modules.map((m) => ({ fixedWidth: m.fixedWidthCm ?? undefined })),
        innerW,
      );
      s.modules.forEach((m, i) => {
        if (i > 0 && s.modules[i - 1].span === 2) return;
        const spanW = slots.slice(i, i + m.span).reduce((a, b) => a + b, 0);
        // Same rounding the drawing uses: one decimal, trailing zero dropped.
        out.push(String(Math.round((spanW - MODULE_WALL * 2) * 1000) / 10));
      });
    }
    return out;
  }

  it("prints exactly what computeSlotWidthsM yields", () => {
    const printed = buildWireframe(order)
      .labels.filter((l) => !l.text.includes("cm"))
      .map((l) => l.text);
    expect(printed).toEqual(sceneClearWidths(order));
  });

  it("gives the low section the panel the high section shares at the seam", () => {
    // 261 wide, no left panel, one 68.6 washer, four variable slots:
    // (261 − 3.6 − 68.6) / 4 = 47.2 per slot → 43.6 clear.
    const printed = buildWireframe(order)
      .labels.filter((l) => !l.text.includes("cm"))
      .map((l) => l.text);
    expect(printed.slice(5)).toEqual(["43.6", "43.6", "43.6", "65", "43.6"]);
  });

  it("keeps both side panels on a single-section cabinet", () => {
    // 200 wide, 18 mm panels, two slots: (200 − 3.6) / 2 = 98.2 → 94.6 clear.
    const printed = buildWireframe(base)
      .labels.filter((l) => !l.text.includes("cm"))
      .map((l) => l.text);
    expect(printed).toEqual(["94.6", "94.6"]);
  });

  it("draws an appliance in a full-height carcass, not capped at its 90 cm front", () => {
    const drawing = buildWireframe(order);
    // Three appliances, each drawn low in its carcass rather than halfway up a
    // 90 cm box: in y-down coordinates that means well below the middle.
    expect(drawing.circles).toHaveLength(3);
    for (const drum of drawing.circles) {
      expect(drum.cy).toBeGreaterThan(drawing.viewHeight * 0.55);
    }
  });
});
