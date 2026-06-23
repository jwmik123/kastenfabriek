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
 * - Desktop renders a vertical rail including zoom in/out buttons.
 * - Mobile renders a horizontal bar with zoom omitted (pinch-to-zoom remains).
 * - Randomize is gated by `showRandomize` in both orientations.
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
    orientation: isMobile ? 'horizontal' : 'vertical',
    items,
  }
}
