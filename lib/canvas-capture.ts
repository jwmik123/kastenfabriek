// Module-level state — shared across all imports in the same client bundle.
let glCanvas: HTMLCanvasElement | null = null
let latestCapture: string | null = null
let offscreenCanvas: HTMLCanvasElement | null = null

export function setGlCanvas(canvas: HTMLCanvasElement | null) {
  glCanvas = canvas
}

/**
 * Draws the current Three.js canvas into a small offscreen canvas and
 * stores the result. Called from inside useFrame so the canvas content
 * is guaranteed to be from the last rendered frame.
 */
export function captureNow(maxW = 480, maxH = 300): void {
  // Try the registered ref first, fall back to the first canvas in the DOM
  const src: HTMLCanvasElement | null =
    glCanvas ??
    (typeof document !== 'undefined'
      ? (document.querySelector('canvas') as HTMLCanvasElement | null)
      : null)

  if (!src || src.width === 0 || src.height === 0) return

  try {
    const scale = Math.min(maxW / src.width, maxH / src.height, 1)
    const w = Math.round(src.width * scale)
    const h = Math.round(src.height * scale)

    // Reuse the same offscreen canvas to avoid GC pressure
    if (!offscreenCanvas) offscreenCanvas = document.createElement('canvas')
    offscreenCanvas.width = w
    offscreenCanvas.height = h

    const ctx = offscreenCanvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(src, 0, 0, w, h)
    latestCapture = offscreenCanvas.toDataURL('image/jpeg', 0.75)
  } catch {
    // drawImage can throw for cross-origin or context-lost canvases
  }
}

/** Returns the most recently captured frame, or null if none yet. */
export function getLatestCapture(): string | null {
  return latestCapture
}
