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
      const transform = l.rotate ? ` transform="rotate(${l.rotate} ${r(l.x)} ${r(l.y)})"` : "";
      // Knock a hole in whatever sits behind the text, as the PDF does.
      const w = l.text.length * fontSize * 0.58;
      const plate = `<rect x="${r(l.x - w / 2)}" y="${r(l.y - fontSize * 0.82)}" width="${r(w)}" height="${r(fontSize * 1.1)}" fill="#ffffff"/>`;
      const text = `<text x="${r(l.x)}" y="${r(l.y)}" text-anchor="${l.anchor}" font-size="${fontSize}" fill="#34463a" font-family="Helvetica, Arial, sans-serif">${escapeXml(l.text)}</text>`;
      return `<g${transform}>${plate}${text}</g>`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" ${attrs}viewBox="0 0 ${r(viewWidth)} ${r(viewHeight)}" role="img" aria-label="Vooraanzicht met maatvoering">${lines}${circles}${labels}</svg>`;
}

export function renderClosetWireframeSvg(
  c: ClosetConfigSnapshot,
  opts?: { maxWidth?: number },
): string {
  // This renderer draws at a fixed font size in drawing units, so the builder
  // can lay the dimension rows out for exactly that.
  return renderWireframeSvg(buildWireframe(c, { labelHeightCm: FONT_SIZE.normal }), opts);
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
