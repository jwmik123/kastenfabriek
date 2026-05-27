export type DiagonalSide = 'none' | 'left' | 'right' | 'both'

export interface DiagParams {
  diagonalSide: DiagonalSide
  leftDiagStartHeight: number   // meters
  rightDiagStartHeight: number  // meters
  leftDiagTopWidth: number      // meters — horizontal reach of left diagonal
  rightDiagTopWidth: number     // meters — horizontal reach of right diagonal
  outerWidth: number            // meters — total closet outer width
  mainHeight: number            // meters — corpus/TC separator height (225cm when TC, else ~height-15mm)
  closetHeight: number          // meters — full outer closet height (defines slope angle)
  // Back diagonal (mutually exclusive with side diagonal)
  backDiagonal: boolean
  backDiagKinkHeight: number       // meters — height at back wall where slope meets wall
  backDiagFlatSectionDepth: number // meters — flat-top section depth measured from front
  outerDepth: number               // meters — total closet outer depth
  // Cap height for module geometry (separate from mainHeight, which carries slope-math semantics).
  // Equals mainHeight in most cases; reduced to fillerBottomY when back-diag is active without TC
  // and flatSec is below the filler threshold.
  moduleCapY: number
  // Outer side-wall thickness in metres. 0.018 standard, 0.036 when upgraded (issue 072).
  sideWallThickness: number
}

// Filler depth from front face of closet (matches the corpus filler back-face offset).
export const FILLER_DEPTH_FROM_FRONT = 0.15
// Flat-section threshold below which the corpus renders a top-front filler wedge.
export const FILLER_FLAT_SEC_THRESHOLD = 0.10

/**
 * Module cap height: the Y at which module geometry (roof, door, sidewall tops) is clamped.
 * - Back-diagonal off → mainHeight.
 * - Top cabinet active → mainHeight (corpus/TC separator handles the cap).
 * - Back-diagonal on, no TC, flatSec >= threshold → mainHeight.
 * - Back-diagonal on, no TC, flatSec < threshold → shell height at the filler back face.
 */
export function computeModuleCapY(p: DiagParams, needsTop: boolean): number {
  if (!p.backDiagonal) return p.mainHeight
  if (needsTop) return p.mainHeight
  if (p.backDiagFlatSectionDepth >= FILLER_FLAT_SEC_THRESHOLD) return p.mainHeight
  return getBackDiagHeightAtZ(p.outerDepth - FILLER_DEPTH_FROM_FRONT, p)
}

/**
 * Returns the maximum usable height (in meters) at a given X position
 * measured from the closet's outer LEFT edge.
 */
// Corpus wall thickness — diagonal starts at the inner face of the side wall, not the outer face.
export const CORPUS_WALL = 0.018

export function getDiagHeightAt(xFromOuterLeft: number, p: DiagParams): number {
  let h = p.mainHeight

  if (p.diagonalSide === 'left' || p.diagonalSide === 'both') {
    if (p.leftDiagTopWidth > 0 && xFromOuterLeft < p.sideWallThickness + p.leftDiagTopWidth) {
      const xFromInner = xFromOuterLeft - p.sideWallThickness
      const t = Math.max(0, xFromInner) / p.leftDiagTopWidth
      h = Math.min(h, p.leftDiagStartHeight + (p.mainHeight - p.leftDiagStartHeight) * t)
    }
  }

  if (p.diagonalSide === 'right' || p.diagonalSide === 'both') {
    const xFromRight = p.outerWidth - xFromOuterLeft
    if (p.rightDiagTopWidth > 0 && xFromRight < p.sideWallThickness + p.rightDiagTopWidth) {
      const xFromInner = xFromRight - p.sideWallThickness
      const t = Math.max(0, xFromInner) / p.rightDiagTopWidth
      h = Math.min(h, p.rightDiagStartHeight + (p.mainHeight - p.rightDiagStartHeight) * t)
    }
  }

  return h
}

/**
 * Returns the ceiling height (in meters) at a given worldZ position when
 * back diagonal is active.  worldZ=0 is the outer back face of the closet.
 */
export function getBackDiagHeightAtZ(worldZ: number, p: DiagParams): number {
  if (!p.backDiagonal) return p.mainHeight
  const { backDiagKinkHeight, backDiagFlatSectionDepth, outerDepth, closetHeight } = p
  const flatStartZ = outerDepth - backDiagFlatSectionDepth
  if (worldZ >= flatStartZ) return closetHeight
  if (worldZ <= 0) return backDiagKinkHeight
  const t = worldZ / flatStartZ
  return backDiagKinkHeight + t * (closetHeight - backDiagKinkHeight)
}

/**
 * Returns the effective inner height (in meters) at a module wall's X position.
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
 * Always returns true for back diagonal since it is X-uniform (double modules allowed).
 */
export function isFullHeight(xLeft: number, xRight: number, p: DiagParams): boolean {
  if (p.backDiagonal) return true  // back diagonal is uniform in X — double modules always OK
  return (
    getDiagHeightAt(xLeft, p) >= p.mainHeight &&
    getDiagHeightAt(xRight, p) >= p.mainHeight
  )
}
