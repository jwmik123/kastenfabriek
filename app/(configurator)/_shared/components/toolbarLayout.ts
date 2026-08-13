// Pure layout logic for the canvas toolbar.
//
// Decides the toolbar orientation and which buttons are present, given the
// viewport (mobile vs desktop) and whether randomize is allowed. Kept free of
// React so it can be unit-tested without mounting the 3D canvas.

export type ToolbarOrientation = 'horizontal' | 'vertical'

export type ToolbarItem =
  | 'zoomIn'
  | 'zoomOut'
  | 'measurements'
  | 'doors'
  | 'randomize'
  | 'help'

export interface ToolbarLayout {
  orientation: ToolbarOrientation
  items: ToolbarItem[]
}

export interface ToolbarLayoutOptions {
  /** True on phone-sized viewports (below the `md` breakpoint). */
  isMobile: boolean
  /** Whether the randomize-fill button is available for this configurator. */
  showRandomize?: boolean
}

/**
 * Resolve the toolbar orientation and ordered button list.
 *
 * - Both viewports render a vertical rail along the left edge; mobile's is
 *   compact (see CanvasToolbar) so it stays clear of the cabinet.
 * - Desktop includes zoom in/out; mobile omits them (pinch-to-zoom remains).
 * - Randomize is gated by `showRandomize`.
 */
export function getToolbarLayout({
  isMobile,
  showRandomize = true,
}: ToolbarLayoutOptions): ToolbarLayout {
  const items: ToolbarItem[] = []

  // Zoom buttons are desktop-only; mobile relies on pinch-to-zoom.
  if (!isMobile) {
    items.push('zoomIn', 'zoomOut')
  }

  items.push('measurements', 'doors')

  if (showRandomize) {
    items.push('randomize')
  }

  items.push('help')

  return {
    orientation: 'vertical',
    items,
  }
}
