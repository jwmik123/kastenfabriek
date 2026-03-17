export type DiagonalSide = 'none' | 'left' | 'right' | 'both'

export interface DiagParams {
  diagonalSide: DiagonalSide
  leftDiagStartHeight: number   // meters
  rightDiagStartHeight: number  // meters
  leftDiagTopWidth: number      // meters — horizontal reach of left diagonal
  rightDiagTopWidth: number     // meters — horizontal reach of right diagonal
  outerWidth: number            // meters — total closet outer width
  mainHeight: number            // meters — interior ceiling height
}

/**
 * Returns the maximum usable height (in meters) at a given X position
 * measured from the closet's outer LEFT edge.
 *
 * Outside the diagonal zone: returns mainHeight.
 * Inside the left diagonal zone: interpolates between leftDiagStartHeight and mainHeight.
 * Inside the right diagonal zone: interpolates between rightDiagStartHeight and mainHeight.
 */
// Corpus wall thickness — diagonal starts at the inner face of the side wall, not the outer face.
export const CORPUS_WALL = 0.018

export function getDiagHeightAt(xFromOuterLeft: number, p: DiagParams): number {
  let h = p.mainHeight

  if (p.diagonalSide === 'left' || p.diagonalSide === 'both') {
    if (p.leftDiagTopWidth > 0 && xFromOuterLeft < CORPUS_WALL + p.leftDiagTopWidth) {
      const xFromInner = xFromOuterLeft - CORPUS_WALL
      const t = Math.max(0, xFromInner) / p.leftDiagTopWidth
      h = Math.min(h, p.leftDiagStartHeight + (p.mainHeight - p.leftDiagStartHeight) * t)
    }
  }

  if (p.diagonalSide === 'right' || p.diagonalSide === 'both') {
    const xFromRight = p.outerWidth - xFromOuterLeft
    if (p.rightDiagTopWidth > 0 && xFromRight < CORPUS_WALL + p.rightDiagTopWidth) {
      const xFromInner = xFromRight - CORPUS_WALL
      const t = Math.max(0, xFromInner) / p.rightDiagTopWidth
      h = Math.min(h, p.rightDiagStartHeight + (p.mainHeight - p.rightDiagStartHeight) * t)
    }
  }

  return h
}

/**
 * Returns the effective inner height (in meters) at a module wall's X position,
 * already accounting for MODULE_FLOOR_Y and top WALL deduction.
 *
 * @param wallXOuter  X from outer left edge in meters (e.g. WALL + index * slotW)
 * @param floorY      MODULE_FLOOR_Y in meters
 * @param topWall     WALL thickness in meters
 */
export function getDiagModuleWallHeight(
  wallXOuter: number,
  p: DiagParams,
  floorY: number,
  topWall: number,
): number {
  const diagH = getDiagHeightAt(wallXOuter, p)
  return Math.max(0, diagH - floorY - topWall)
}

/**
 * True when the given X range (from outer left) is fully outside any diagonal zone.
 */
export function isFullHeight(xLeft: number, xRight: number, p: DiagParams): boolean {
  return (
    getDiagHeightAt(xLeft, p) >= p.mainHeight &&
    getDiagHeightAt(xRight, p) >= p.mainHeight
  )
}
