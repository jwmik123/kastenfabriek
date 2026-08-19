import {
  MODULE_FLOOR_Y,
  MODULE_WALL,
  ONDERSTEL_HEIGHT,
  WALL,
} from "@/app/(configurator)/kledingkast/scene/closetConstants";
import {
  computeShelfPositions,
  resolveElementPositions,
  SHELF_THICKNESS,
  type ElementBbox,
  type ModuleLayoutConfig,
} from "@/app/(configurator)/kledingkast/scene/moduleLayouts";
import { getWasmLayoutConfig } from "@/app/(configurator)/wasmachinekast/moduleLayoutConfigs";
import glbBboxes from "./glb-bboxes.json";
import type { ClosetConfigSnapshot } from "@/lib/cart/types";
import { resolveSections, type SpecModule, type SpecSection } from "./closet-spec";

/**
 * Pure: turn an ordered closet into a 2D front elevation, doors off, with the
 * measurements written next to the lines.
 *
 * Everything is produced in centimetres in a y-down drawing space (top-left
 * origin), including the margins the dimension lines live in, so a renderer
 * only has to scale the whole thing into the space it has.
 *
 * Carcass, section split and every width are exact — the same numbers the 3D
 * scene uses. Interiors are exact too: element and shelf positions come from
 * `resolveElementPositions` / `computeShelfPositions`, the functions the scene
 * itself places drawers, rods and shelves with, fed by GLB bounding boxes that
 * `npm run generate:glb-bboxes` measured from the same models the scene loads.
 * Only a module whose layout is unknown here (a new Sanity layout without a
 * config) falls back to a schematic sketch of its contents.
 */

// Scene constants are in metres; the drawing works in centimetres.
const SIDE_WALL_CM = WALL * 100;
const MODULE_WALL_CM = MODULE_WALL * 100;
const PLINTH_CM = ONDERSTEL_HEIGHT * 100;
const MODULE_FLOOR_CM = MODULE_FLOOR_Y * 100;
/** Matches TOP_CABINET_THRESHOLD / mainHeight() in both stores. */
const TOP_CABINET_MAIN_HEIGHT_CM = 225;
/** How far up an appliance front reaches, for drawing its drum. */
const WASHER_FRONT_HEIGHT_CM = 90;

/**
 * Cap height of a dimension label, in drawing units (cm).
 *
 * Everything around the cabinet — the gap between a label and its line, the
 * spacing of the dimension rows, the margins — is a multiple of this, because a
 * label's size on paper is fixed while the drawing scale is not. A 542 cm
 * cabinet is drawn at roughly half the scale of a 240 cm one, so a fixed
 * spacing in centimetres that looks right for the small one has the text of the
 * wide one running straight through the carcass.
 */
const DEFAULT_LABEL_HEIGHT_CM = 4.2;

/** Gap between sections that stand next to each other. */
const SECTION_GAP = 0;

/** Margins and dimension-row offsets, all as multiples of the label height. */
function layoutMetrics(labelHeightCm: number) {
  const L = Math.max(1, labelHeightCm);
  return {
    labelGap: L * 0.5,
    marginLeft: L * 3.2,
    marginRightSingle: L * 1.5,
    marginRightMulti: L * 3.2,
    marginTop: L * 2,
    marginBottom: L * 6.6,
    rowModules: L * 1.9,
    rowSection: L * 3.8,
    rowTotal: L * 5.5,
  };
}

export type LineWeight = "outline" | "panel" | "interior" | "dimension";

export interface WireLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  weight: LineWeight;
}

export interface WireCircle {
  cx: number;
  cy: number;
  r: number;
}

export interface WireLabel {
  /**
   * Already clear of the line it belongs to — the builder offsets it by a
   * multiple of the label height it was given, so a renderer just draws it.
   */
  x: number;
  y: number;
  text: string;
  anchor: "start" | "middle" | "end";
  size: "normal" | "small";
  /** Degrees, counter-clockwise around (x, y). Only -90 is used, for heights. */
  rotate?: number;
}

export interface WireframeDrawing {
  /** Drawing extents in cm, margins included. */
  viewWidth: number;
  viewHeight: number;
  lines: WireLine[];
  circles: WireCircle[];
  labels: WireLabel[];
  /** True when any module interior was drawn schematically. */
  hasSchematicInteriors: boolean;
}

/**
 * Per-slot widths in cm. Fixed slots (washers) keep their width; the rest share
 * what is left. Mirrors `computeSlotWidthsM`, in cm and tolerant of the older
 * snapshots that never stored `fixedWidth`.
 */
export function computeSlotWidthsCm(
  modules: Pick<SpecModule, "fixedWidthCm">[],
  innerWidthCm: number,
): number[] {
  const totalFixed = modules.reduce((sum, m) => sum + (m.fixedWidthCm ?? 0), 0);
  const varCount = modules.filter((m) => !m.fixedWidthCm).length;
  const varW = varCount > 0 ? Math.max(0, (innerWidthCm - totalFixed) / varCount) : 0;
  return modules.map((m) => m.fixedWidthCm ?? varW);
}

function fmtCm(cm: number): string {
  const rounded = Math.round(cm * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1);
}

/**
 * A section's carcass height below any top cabinet. Above 275 cm both stores
 * cap the main body at 225 cm and put a top cabinet on it.
 */
function mainHeightCm(section: SpecSection, c: ClosetConfigSnapshot): number {
  if (section.key === "low") return section.heightCm;
  if (!c.hasTopCabinet || c.topCabinetHeightCm <= 0) return section.heightCm;
  return Math.min(TOP_CABINET_MAIN_HEIGHT_CM, section.heightCm - c.topCabinetHeightCm);
}

export interface WireframeOptions {
  /**
   * Cap height of a dimension label in drawing units. Pass the renderer's own
   * font size divided by the scale it will draw at, so spacing on paper stays
   * constant across cabinets of very different widths.
   */
  labelHeightCm?: number;
}

export function buildWireframe(
  c: ClosetConfigSnapshot,
  opts: WireframeOptions = {},
): WireframeDrawing {
  const sections = resolveSections(c);
  const sideWallCm = c.sidePanelThickness === "36mm" ? 3.6 : SIDE_WALL_CM;
  const M = layoutMetrics(opts.labelHeightCm ?? DEFAULT_LABEL_HEIGHT_CM);

  /**
   * In a dual layout the sections meet as one cabinet and share a single panel
   * at the seam: the high section keeps its panel and the low section drops the
   * one facing it, widening its interior into the freed space. Mirrors
   * `lowSharedSideWall` in WasmachinekastScene — without it every module in the
   * low section comes out a little too narrow.
   */
  const sharedSeam: "left" | "right" | null =
    sections.length > 1 ? (c.layout === "low-left" ? "right" : "left") : null;
  const wallsOf = (section: SpecSection) => {
    const shares = section.key === "low" ? sharedSeam : null;
    return {
      left: shares === "left" ? 0 : sideWallCm,
      right: shares === "right" ? 0 : sideWallCm,
    };
  };

  const totalWidth =
    sections.reduce((sum, s) => sum + s.widthCm, 0) + SECTION_GAP * (sections.length - 1);
  const totalHeight = sections.reduce((max, s) => Math.max(max, s.heightCm), 0);

  const marginRight = sections.length > 1 ? M.marginRightMulti : M.marginRightSingle;
  const viewWidth = M.marginLeft + totalWidth + marginRight;
  const viewHeight = M.marginTop + totalHeight + M.marginBottom;
  /** cabinet y (cm, from the floor, up) -> drawing y (down). */
  const dy = (y: number) => M.marginTop + totalHeight - y;

  const lines: WireLine[] = [];
  const circles: WireCircle[] = [];
  const labels: WireLabel[] = [];
  let hasSchematicInteriors = false;

  const rect = (x: number, yBottom: number, w: number, h: number, weight: LineWeight) => {
    const top = dy(yBottom + h);
    const bottom = dy(yBottom);
    lines.push(
      { x1: x, y1: top, x2: x + w, y2: top, weight },
      { x1: x + w, y1: top, x2: x + w, y2: bottom, weight },
      { x1: x + w, y1: bottom, x2: x, y2: bottom, weight },
      { x1: x, y1: bottom, x2: x, y2: top, weight },
    );
  };
  const hLine = (x1: number, x2: number, y: number, weight: LineWeight) =>
    lines.push({ x1, y1: dy(y), x2, y2: dy(y), weight });

  let cursorX = M.marginLeft;

  for (const section of sections) {
    const x0 = cursorX;
    const W = section.widthCm;
    const H = section.heightCm;
    const mainH = mainHeightCm(section, c);

    // --- Carcass ---
    rect(x0, 0, W, H, "outline");
    // Plinth.
    hLine(x0, x0 + W, PLINTH_CM, "panel");
    // Top cabinet divider.
    if (mainH < H - 0.01) hLine(x0, x0 + W, mainH, "panel");

    // --- Modules ---
    const walls = wallsOf(section);
    const innerW = W - walls.left - walls.right;
    const slotWidths = computeSlotWidthsCm(section.modules, innerW);
    const moduleTop = mainH - SIDE_WALL_CM;
    let slotX = x0 + walls.left;

    for (let i = 0; i < section.modules.length; i++) {
      const m = section.modules[i];
      const consumed = i > 0 && section.modules[i - 1].span === 2;
      const slotW = slotWidths[i];
      if (consumed) {
        slotX += slotW;
        continue;
      }
      const spanW = slotWidths
        .slice(i, i + m.span)
        .reduce((a, b) => a + b, 0);

      const openLeft = slotX + MODULE_WALL_CM;
      const openRight = slotX + spanW - MODULE_WALL_CM;
      const openW = openRight - openLeft;
      const openBottom = MODULE_FLOOR_CM;
      // An appliance sits at the bottom of a full-height carcass — only the
      // lage-kast bays are 90 cm tall, and there the section already is.
      const openTop = moduleTop;
      const openH = openTop - openBottom;

      if (openW > 0 && openH > 0) {
        rect(openLeft, openBottom, openW, openH, "panel");
        if (m.isWasher) {
          const frontH = Math.min(openH, WASHER_FRONT_HEIGHT_CM);
          drawWasher(circles, lines, openLeft, openW, openBottom, frontH, dy);
          if (frontH < openH - 0.01) hLine(openLeft, openRight, openBottom + frontH, "interior");
        } else {
          const exact = drawInteriorFromConfig(
            { rect, hLine },
            m,
            openLeft,
            openRight,
            openBottom,
            openTop,
          );
          if (!exact && m.contents) {
            const drew = drawInterior(hLine, m, openLeft, openRight, openBottom, openTop);
            hasSchematicInteriors = hasSchematicInteriors || drew;
          }
        }

        // Top cabinet compartments line up with the modules below them.
        if (mainH < H - 0.01 && openRight < x0 + W - walls.right - 0.01) {
          lines.push({
            x1: openRight + MODULE_WALL_CM / 2,
            y1: dy(H - SIDE_WALL_CM),
            x2: openRight + MODULE_WALL_CM / 2,
            y2: dy(mainH),
            weight: "panel",
          });
        }

        // Module clear widths go under the cabinet rather than across the
        // plinth, so the labels never sit on top of the carcass lines.
        dimensionH(lines, labels, openLeft, openRight, dy(0) + M.rowModules, fmtCm(openW), M.labelGap);
      }
      slotX += spanW;
    }

    // --- Section dimensions ---
    dimensionH(lines, labels, x0, x0 + W, dy(0) + M.rowSection, `${fmtCm(W)} cm`, M.labelGap);

    // Height lines stay clear of the drawing: the first section measures on the
    // left of the assembly, any other on the right of it.
    const heightDimX =
      section === sections[0]
        ? M.marginLeft - M.marginLeft * 0.45
        : M.marginLeft + totalWidth + marginRight * 0.45;
    dimensionV(lines, labels, heightDimX, dy(H), dy(0), `${fmtCm(H)} cm`, M.labelGap);

    cursorX += W + SECTION_GAP;
  }

  // Overall width, under the per-section lines, when there is more than one.
  if (sections.length > 1) {
    dimensionH(
      lines,
      labels,
      M.marginLeft,
      M.marginLeft + totalWidth,
      dy(0) + M.rowTotal,
      `totaal ${fmtCm(totalWidth)} cm`,
      M.labelGap,
    );
  }

  return { viewWidth, viewHeight, lines, circles, labels, hasSchematicInteriors };
}

/** Shelves in the upper band, drawers stacked at the bottom, rods near the top. */
function drawInterior(
  hLine: (x1: number, x2: number, y: number, weight: LineWeight) => void,
  m: SpecModule,
  left: number,
  right: number,
  bottom: number,
  top: number,
): boolean {
  const { shelves, rods, drawers } = m.contents!;
  if (shelves === 0 && rods === 0 && drawers === 0) return false;

  const height = top - bottom;
  const drawerBandH = drawers > 0 ? Math.min(height * 0.45, drawers * 20) : 0;
  const drawerTop = bottom + drawerBandH;

  for (let d = 1; d <= drawers; d++) {
    hLine(left, right, bottom + (drawerBandH / drawers) * d, "interior");
  }

  const shelfSpan = top - drawerTop;
  let topShelfY = drawerTop;
  for (let s = 1; s <= shelves; s++) {
    topShelfY = drawerTop + (shelfSpan / (shelves + 1)) * s;
    hLine(left, right, topShelfY, "interior");
  }

  // Rods hang in what is left above the highest shelf, so they never land on it.
  const rodSpan = top - topShelfY;
  for (let r = 1; r <= rods; r++) {
    hLine(left + 2, right - 2, top - (rodSpan / (rods + 1)) * r, "interior");
  }

  return true;
}

type DrawOps = {
  rect: (x: number, yBottom: number, w: number, h: number, weight: LineWeight) => void;
  hLine: (x1: number, x2: number, y: number, weight: LineWeight) => void;
};

const BBOXES = glbBboxes as Record<string, ElementBbox>;

/**
 * Draw a module interior exactly as the 3D scene builds it.
 *
 * Same functions, same inputs: `resolveElementPositions` places the drawer,
 * split and desk boxes (using the measured GLB bounds), `computeShelfPositions`
 * lays the shelves out in the fill zones around them, and a rod is drawn at the
 * height its GLB hangs at. All positions are in module space (metres above the
 * module floor), converted here to the drawing's centimetres.
 *
 * Returns false when the layout is unknown or a GLB was never measured — the
 * caller then falls back to the schematic sketch.
 */
function drawInteriorFromConfig(
  ops: DrawOps,
  m: SpecModule,
  left: number,
  right: number,
  bottom: number,
  top: number,
): boolean {
  if (m.layoutId == null) return false;
  const config: ModuleLayoutConfig | undefined = getWasmLayoutConfig(m.layoutId);
  if (!config) return false;

  const bboxes = config.elements.map((el) => BBOXES[el.glbPath]);
  if (bboxes.some((b) => !b)) return false;

  const width = right - left;
  const roofY = (top - bottom) / 100; // module space, metres

  // Lage-kast fronts: the GLB is a run of kitchen fronts covering the opening.
  if (config.lowFronts) {
    const count = config.lowFrontCount ?? 1;
    for (let i = 1; i < count; i++) {
      ops.hLine(left, right, bottom + ((top - bottom) / count) * i, "interior");
    }
    return true;
  }

  const { elementYs, fillAbove, fillBelow } = resolveElementPositions(config, roofY, bboxes);

  // A line only makes sense inside the opening; a squat module can put an
  // element's top past its roof, so everything is clipped to [bottom, top].
  const inBand = (y: number) => y > bottom + 0.05 && y < top - 0.05;

  config.elements.forEach((el, i) => {
    const b = bboxes[i];
    const hM = b.maxY - b.minY;
    const yCm = bottom + elementYs[i] * 100;
    const isRod = el.glbPath.includes("Rod");
    if (isRod) {
      // A rod reads as a bar, not a box: one line at the height it hangs.
      const rodY = yCm + (hM / 2) * 100;
      if (inBand(rodY)) ops.hLine(left + width * 0.06, right - width * 0.06, rodY, "interior");
      return;
    }
    const yTop = Math.min(yCm + hM * 100, top);
    if (yTop - yCm <= 0) return;
    ops.rect(left, yCm, width, yTop - yCm, "interior");
    // Drawer stacks get their fronts hinted, evenly over the box.
    const drawers = m.contents?.drawers ?? 0;
    if (drawers > 1 && el.glbPath.includes("Drawer")) {
      for (let d = 1; d < drawers; d++) {
        const y = yCm + ((yTop - yCm) / drawers) * d;
        if (inBand(y)) ops.hLine(left, right, y, "interior");
      }
    }
  });

  // Shelves in the zones around the elements — top surfaces, like the scene.
  for (const zone of [
    { config: config.fillZone.above, span: fillAbove },
    { config: config.fillZone.below, span: fillBelow },
  ]) {
    for (const shelfTop of computeShelfPositions(zone.config, zone.span.start, zone.span.end, false)) {
      const y = bottom + (shelfTop - SHELF_THICKNESS) * 100;
      if (inBand(y)) ops.hLine(left, right, y, "interior");
    }
  }

  return true;
}

/** Appliance front: a drum circle inside the opening. */
function drawWasher(
  circles: WireCircle[],
  lines: WireLine[],
  left: number,
  width: number,
  bottom: number,
  height: number,
  dy: (y: number) => number,
): void {
  const cx = left + width / 2;
  const cy = dy(bottom + height / 2);
  circles.push({ cx, cy, r: Math.max(4, Math.min(width, height) * 0.3) });
  // Control panel strip along the top of the appliance.
  const stripY = dy(bottom + height - Math.min(12, height * 0.15));
  lines.push({ x1: left, y1: stripY, x2: left + width, y2: stripY, weight: "interior" });
}

/** Horizontal dimension line with end ticks and a centred label above it. */
function dimensionH(
  lines: WireLine[],
  labels: WireLabel[],
  x1: number,
  x2: number,
  y: number,
  text: string,
  gap: number,
): void {
  const tick = gap * 0.5;
  lines.push({ x1, y1: y, x2, y2: y, weight: "dimension" });
  lines.push({ x1, y1: y - tick, x2: x1, y2: y + tick, weight: "dimension" });
  lines.push({ x1: x2, y1: y - tick, x2, y2: y + tick, weight: "dimension" });
  labels.push({
    x: (x1 + x2) / 2,
    y: y - gap,
    text,
    anchor: "middle",
    // A label wider than its own dimension would run into its neighbours.
    size: x2 - x1 < text.length * gap * 1.3 ? "small" : "normal",
  });
}

/** Vertical dimension line with end ticks and a rotated label. */
function dimensionV(
  lines: WireLine[],
  labels: WireLabel[],
  x: number,
  yTop: number,
  yBottom: number,
  text: string,
  gap: number,
): void {
  const tick = gap * 0.5;
  lines.push({ x1: x, y1: yTop, x2: x, y2: yBottom, weight: "dimension" });
  lines.push({ x1: x - tick, y1: yTop, x2: x + tick, y2: yTop, weight: "dimension" });
  lines.push({ x1: x - tick, y1: yBottom, x2: x + tick, y2: yBottom, weight: "dimension" });
  labels.push({
    x: x - gap,
    y: (yTop + yBottom) / 2,
    text,
    anchor: "middle",
    size: "normal",
    rotate: -90,
  });
}
