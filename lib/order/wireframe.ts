import {
  MODULE_FLOOR_Y,
  MODULE_WALL,
  ONDERSTEL_HEIGHT,
  WALL,
} from "@/app/(configurator)/kledingkast/scene/closetConstants";
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
 * The carcass, the section split and every width are exact — they come from the
 * same numbers the 3D scene uses. Interiors (shelves, rods, drawers) are drawn
 * schematically from the module's Sanity contents: the right count in the right
 * band, not the exact millimetre positions.
 */

// Scene constants are in metres; the drawing works in centimetres.
const SIDE_WALL_CM = WALL * 100;
const MODULE_WALL_CM = MODULE_WALL * 100;
const PLINTH_CM = ONDERSTEL_HEIGHT * 100;
const MODULE_FLOOR_CM = MODULE_FLOOR_Y * 100;
/** Matches TOP_CABINET_THRESHOLD / mainHeight() in both stores. */
const TOP_CABINET_MAIN_HEIGHT_CM = 225;
const WASHER_HEIGHT_CM = 90;

/** Room for the height dimension line, the width lines and the labels. */
const MARGIN_LEFT = 26;
/** Sections after the first put their height line on the right of the assembly. */
const MARGIN_RIGHT_SINGLE = 6;
const MARGIN_RIGHT_MULTI = 26;
const MARGIN_TOP = 8;
const MARGIN_BOTTOM = 42;
/** Dimension rows below the cabinet: modules, then section, then total. */
const DIM_ROW_MODULES = 8;
const DIM_ROW_SECTION = 22;
const DIM_ROW_TOTAL = 35;
/** Gap between sections that stand next to each other. */
const SECTION_GAP = 0;

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
   * Sits exactly on the dimension line. The renderer nudges it clear by half
   * its own font size — above the line, or to the left of a rotated one — so
   * the gap stays right whatever size the drawing is scaled to.
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

export function buildWireframe(c: ClosetConfigSnapshot): WireframeDrawing {
  const sections = resolveSections(c);
  const sideWallCm = c.sidePanelThickness === "36mm" ? 3.6 : SIDE_WALL_CM;

  const totalWidth =
    sections.reduce((sum, s) => sum + s.widthCm, 0) + SECTION_GAP * (sections.length - 1);
  const totalHeight = sections.reduce((max, s) => Math.max(max, s.heightCm), 0);

  const marginRight = sections.length > 1 ? MARGIN_RIGHT_MULTI : MARGIN_RIGHT_SINGLE;
  const viewWidth = MARGIN_LEFT + totalWidth + marginRight;
  const viewHeight = MARGIN_TOP + totalHeight + MARGIN_BOTTOM;
  /** cabinet y (cm, from the floor, up) -> drawing y (down). */
  const dy = (y: number) => MARGIN_TOP + totalHeight - y;

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

  let cursorX = MARGIN_LEFT;

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
    const innerW = W - sideWallCm * 2;
    const slotWidths = computeSlotWidthsCm(section.modules, innerW);
    const moduleTop = mainH - SIDE_WALL_CM;
    let slotX = x0 + sideWallCm;

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
      const openTop = m.isWasher
        ? Math.min(moduleTop, openBottom + WASHER_HEIGHT_CM)
        : moduleTop;
      const openH = openTop - openBottom;

      if (openW > 0 && openH > 0) {
        rect(openLeft, openBottom, openW, openH, "panel");
        if (m.isWasher) {
          drawWasher(circles, lines, openLeft, openW, openBottom, openH, dy);
        } else if (m.contents) {
          const drew = drawInterior(hLine, m, openLeft, openRight, openBottom, openTop);
          hasSchematicInteriors = hasSchematicInteriors || drew;
        }

        // Top cabinet compartments line up with the modules below them.
        if (mainH < H - 0.01 && openRight < x0 + W - sideWallCm - 0.01) {
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
        dimensionH(lines, labels, openLeft, openRight, dy(0) + DIM_ROW_MODULES, fmtCm(openW));
      }
      slotX += spanW;
    }

    // --- Section dimensions ---
    dimensionH(lines, labels, x0, x0 + W, dy(0) + DIM_ROW_SECTION, `${fmtCm(W)} cm`);

    // Height lines stay clear of the drawing: the first section measures on the
    // left of the assembly, any other on the right of it.
    const heightDimX =
      section === sections[0]
        ? MARGIN_LEFT - 13
        : MARGIN_LEFT + totalWidth + 13;
    dimensionV(lines, labels, heightDimX, dy(H), dy(0), `${fmtCm(H)} cm`);

    cursorX += W + SECTION_GAP;
  }

  // Overall width, under the per-section lines, when there is more than one.
  if (sections.length > 1) {
    dimensionH(
      lines,
      labels,
      MARGIN_LEFT,
      MARGIN_LEFT + totalWidth,
      dy(0) + DIM_ROW_TOTAL,
      `totaal ${fmtCm(totalWidth)} cm`,
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
): void {
  lines.push({ x1, y1: y, x2, y2: y, weight: "dimension" });
  lines.push({ x1, y1: y - 2, x2: x1, y2: y + 2, weight: "dimension" });
  lines.push({ x1: x2, y1: y - 2, x2, y2: y + 2, weight: "dimension" });
  labels.push({
    x: (x1 + x2) / 2,
    y,
    text,
    anchor: "middle",
    size: x2 - x1 < 40 ? "small" : "normal",
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
): void {
  lines.push({ x1: x, y1: yTop, x2: x, y2: yBottom, weight: "dimension" });
  lines.push({ x1: x - 2, y1: yTop, x2: x + 2, y2: yTop, weight: "dimension" });
  lines.push({ x1: x - 2, y1: yBottom, x2: x + 2, y2: yBottom, weight: "dimension" });
  labels.push({
    x,
    y: (yTop + yBottom) / 2,
    text,
    anchor: "middle",
    size: "normal",
    rotate: -90,
  });
}
