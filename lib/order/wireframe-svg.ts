import { buildWireframe, type LineWeight, type WireframeDrawing } from "./wireframe";
import type { ClosetConfigSnapshot } from "@/lib/cart/types";

/**
 * Render a wireframe as a standalone SVG string.
 *
 * The PDF draws the same `WireframeDrawing` with @react-pdf primitives; this
 * renderer exists for on-screen use and for eyeballing the geometry.
 */

const STROKE: Record<LineWeight, { width: number; color: string; dash?: string }> = {
  outline: { width: 0.9, color: "#111827" },
  panel: { width: 0.5, color: "#374151" },
  interior: { width: 0.3, color: "#9ca3af" },
  dimension: { width: 0.25, color: "#34463a" },
};

const FONT_SIZE = { normal: 4.2, small: 3.4 };

export function renderWireframeSvg(
  drawing: WireframeDrawing,
  opts: { maxWidth?: number } = {},
): string {
  const { viewWidth, viewHeight } = drawing;
  const attrs = opts.maxWidth
    ? `width="${opts.maxWidth}" `
    : "";

  const lines = drawing.lines
    .map((l) => {
      const s = STROKE[l.weight];
      return `<line x1="${r(l.x1)}" y1="${r(l.y1)}" x2="${r(l.x2)}" y2="${r(l.y2)}" stroke="${s.color}" stroke-width="${s.width}" />`;
    })
    .join("");

  const circles = drawing.circles
    .map(
      (c) =>
        `<circle cx="${r(c.cx)}" cy="${r(c.cy)}" r="${r(c.r)}" fill="none" stroke="${STROKE.interior.color}" stroke-width="${STROKE.interior.width}" />`,
    )
    .join("");

  const labels = drawing.labels
    .map((l) => {
      const fontSize = FONT_SIZE[l.size];
      // Same nudge as the PDF: labels sit on their line and are moved clear by
      // half their own size.
      const gap = fontSize * 0.55;
      const x = l.rotate ? l.x - gap : l.x;
      const y = l.rotate ? l.y : l.y - gap;
      const transform = l.rotate ? ` transform="rotate(${l.rotate} ${r(x)} ${r(y)})"` : "";
      return `<text x="${r(x)}" y="${r(y)}" text-anchor="${l.anchor}" font-size="${fontSize}" fill="#34463a" font-family="Helvetica, Arial, sans-serif"${transform}>${escapeXml(l.text)}</text>`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" ${attrs}viewBox="0 0 ${r(viewWidth)} ${r(viewHeight)}" role="img" aria-label="Vooraanzicht met maatvoering">${lines}${circles}${labels}</svg>`;
}

export function renderClosetWireframeSvg(
  c: ClosetConfigSnapshot,
  opts?: { maxWidth?: number },
): string {
  return renderWireframeSvg(buildWireframe(c), opts);
}

function r(n: number): string {
  return (Math.round(n * 100) / 100).toString();
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
