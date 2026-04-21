type CameraLike = {
  setLookAt(ex: number, ey: number, ez: number, tx: number, ty: number, tz: number, animate: boolean): unknown
}

// Module-level state — shared across all imports in the same client bundle.
let glCanvas: HTMLCanvasElement | null = null
let latestCapture: string | null = null
let offscreenCanvas: HTMLCanvasElement | null = null
let _cameraControls: CameraLike | null = null

// Single pending capture request — resolved from inside the render loop.
let _pendingResolve: ((url: string | null) => void) | null = null

export function setGlCanvas(canvas: HTMLCanvasElement | null) {
  glCanvas = canvas
}

export function setCameraControls(ref: CameraLike | null) {
  _cameraControls = ref
}

export function resetToFrontView(heightM: number): void {
  _cameraControls?.setLookAt(0, heightM / 2, 5, 0, heightM / 2, 0, false)
}

/**
 * Request a capture on the next render frame. Returns a Promise that resolves
 * with the data URL once tickCapture() is called from inside useFrame.
 * This avoids reading a cleared/black canvas between frames.
 */
export function requestCapture(): Promise<string | null> {
  return new Promise((resolve) => {
    _pendingResolve = resolve
  })
}

/**
 * Called every frame from inside useFrame. Resolves any pending capture request.
 */
export function tickCapture(): void {
  if (!_pendingResolve) return
  const resolve = _pendingResolve
  _pendingResolve = null
  resolve(captureNow())
}

/**
 * Draws the current Three.js canvas into a small offscreen canvas,
 * stores the result, and returns the captured data URL.
 * Must be called while the canvas has valid content (inside useFrame or tickCapture).
 */
export function captureNow(maxW = 1280, maxH = 720): string | null {
  const src: HTMLCanvasElement | null =
    glCanvas ??
    (typeof document !== 'undefined'
      ? (document.querySelector('canvas') as HTMLCanvasElement | null)
      : null)

  if (!src || src.width === 0 || src.height === 0) return null

  try {
    const scale = Math.min(maxW / src.width, maxH / src.height)
    const w = Math.round(src.width * scale)
    const h = Math.round(src.height * scale)

    if (!offscreenCanvas) offscreenCanvas = document.createElement('canvas')
    offscreenCanvas.width = w
    offscreenCanvas.height = h

    const ctx = offscreenCanvas.getContext('2d')
    if (!ctx) return null

    ctx.drawImage(src, 0, 0, w, h)
    latestCapture = offscreenCanvas.toDataURL('image/jpeg', 0.85)
    return latestCapture
  } catch {
    // drawImage can throw for cross-origin or context-lost canvases
  }
  return null
}

/** Returns the most recently captured frame, or null if none yet. */
export function getLatestCapture(): string | null {
  return latestCapture
}
